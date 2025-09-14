import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
try {
const userId = req.nextUrl.searchParams.get("userId");
if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
}

const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
    messages: {
        orderBy: { createdAt: "asc" }, 
    },
    },
});

return NextResponse.json({ chats });
} catch (error: any) {
console.error("Error fetching chat history:", error);
return NextResponse.json({ error: error.message }, { status: 500 });
}
}
