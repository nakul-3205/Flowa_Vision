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
    import { fetchTaskStatusFromPython } from '@/lib/taskStatus';
    const logger=createLogger('Post_route at js')

    export async function POST(req: NextRequest) {
    try {
    const body = await req.json();
    const { userId, prompt, file, platform } = body;

    if (!userId || !prompt) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const check = isMaliciousPrompt(prompt);
    if (check.isMalicious)
    return NextResponse.json(
    { 
    error: 'Your prompt seems to be malicious, please use the system responsibly', 
    reason: check.reason 
    },
    { status: 400 }
    );

    let uploadUrl: string | undefined;

    if (file) {
    const isValid = validateFile(file);
    if (!isValid)
    return NextResponse.json(
    { error: 'File must be jpeg/png and <8MB' },
    { status: 400 }
    );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}-${file.name}`;

    const virus = await scanFileWithVirusTotal(buffer);
    if (virus) return NextResponse.json({ error: "Malicious file detected." }, { status: 400 });

    uploadUrl = await uploadToCloudinary(buffer, fileName);
    if (!uploadUrl) return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }

    // Forward to Python backend
    const pythonResponse = await forwardSecureToPython({
    endpoint: '/process',
    payload: {
    prompt,
    imageUrl: uploadUrl || '',
    userId,
    platform
    }
    });

    // pythonResponse now contains only { taskId: string }
    const taskId = pythonResponse.taskId;
    if (!taskId) throw new Error("No taskId returned from Python backend");

    // Save user's input in DB (optional)
    let chat = await prisma.chat.findFirst({ where: { userId } });
    if (!chat) chat = await prisma.chat.create({ data: { userId, title: "Untitled Chat" } });

    await prisma.message.create({
    data: {
    chatId: chat.id,
    senderType: "USER",
    promptText: prompt,
    userImage: uploadUrl || ''
    },
    });

    // Return the taskId to frontend
    return NextResponse.json({ taskId });

    } catch (error: any) {
    console.error('Error in POST route', error);
    logger.error('Error posting to Python backend', { custom: error });
    return NextResponse.json({ error: error.message }, { status: 500 });
    }
    }


    export async function GET(req: NextRequest) {
        try {
        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('taskId');
        const userId = searchParams.get('userId');

        if (!taskId || !userId) {
            return NextResponse.json({ error: 'Missing taskId or userId' }, { status: 400 });
        }

        // Fetch status from Python backend
        const pyResponse = await fetchTaskStatusFromPython(taskId,userId);

        // If still pending
        if (pyResponse.status === 'pending') {
            return NextResponse.json({ status: 'pending' });
        }

        // Completed: decrypt and map to user chat
        const decrypted = await processAIResponse(pyResponse.data);

        // Find or create chat
        let chat = await prisma.chat.findFirst({ where: { userId } });
        if (!chat) chat = await prisma.chat.create({ data: { userId, title: 'Untitled Chat' } });

        // Store AI message
        await prisma.message.create({
            data: {
            chatId: chat.id,
            senderType: 'AI',
            promptText: decrypted.reply,
            aiImage: decrypted.imageUrl,
            },
        });

        return NextResponse.json({
            status: 'completed',
            data: decrypted,
            chatId: chat.id,
        });
        } catch (err: any) {
        logger.error('Error fetching task status', { custom: err });
        return NextResponse.json({ error: err.message }, { status: 500 });
        }
    }