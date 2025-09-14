// import { Prisma } from "@/lib/generated/prisma";
import { prisma } from '@/lib/prisma'; // import singleton
import { validateFile } from "@/utils/fileValidation";
import { scanFileWithVirusTotal } from "@/utils/scan-file";
import { uploadToCloudinary } from "@/utils/uploadTocloudinary";
import { forwardSecureToPython } from "@/lib/secureForward";
import { NextRequest,NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { isMaliciousPrompt } from '@/utils/promptModerator';
import { processAIResponse } from '@/utils/decryptResponse';
const logger=createLogger('Post_route at js')

export async function POST(req: NextRequest) {
    try {
        const body=await req.json()
        const {userId,prompt,file}=body
        if(!userId||!prompt ){
            return NextResponse.json({ error:'missing fields' }, { status: 400 });

        }
        const check=isMaliciousPrompt(prompt)
        if(check.isMalicious)return NextResponse.json({ error:'Your prompt seems to be malicious,Please use the system responsibily' ,reason:check.reason}, { status: 400 });
        let upload
        if(file){
            const isValid=validateFile(file)

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = `${Date.now()}-${file.name}`;
            if(!isValid)return NextResponse.json({ error:'Please make sure the file is in jpeg or png format and image size is less than 8mb' }, { status: 400 });
            const virus=await scanFileWithVirusTotal(buffer)
            if(virus) return NextResponse.json({ error: "Malicious file detected, upload blocked." }, { status: 400 });
            upload=await uploadToCloudinary(buffer,fileName)
            if(!upload)return NextResponse.json({ error:'Error uploading file' }, { status: 500 });
        }
        const response=await forwardSecureToPython({
            endpoint:'/process',
            payload:{
                prompt:prompt,
                imageUrl:upload||''
            }
        })
        const decrypted=await processAIResponse(response)
        let chat = await prisma.chat.findFirst({ where: { userId } });
    if (!chat) chat = await prisma.chat.create({ data: { userId, title: "Untitled Chat" } });
        await prisma.message.create({
            data: {
                chatId: chat.id,
                senderType: "USER",
                promptText: prompt,
                userImage: upload||'',
            },
          });
        await prisma.message.create({
            data: {
                chatId: chat.id,
                senderType: "AI",
                promptText: decrypted.reply,
                aiImage: decrypted.imageUrl,
            },
          });
        return  NextResponse.json(decrypted);
    } catch (error:any) {
        console.log('error posting',error)
        logger.error('erorr posting to python at js route',{custom:error})
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}