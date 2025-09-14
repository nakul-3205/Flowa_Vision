import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma'; // import singleton
import { LogLevel } from '@/lib/generated/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Flowa_Webhook');

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
const payload = await req.text();

const svix_id = req.headers.get('svix-id')!;
const svix_timestamp = req.headers.get('svix-timestamp')!;
const svix_signature = req.headers.get('svix-signature')!;

const wh = new Webhook(webhookSecret);

let evt: any;
try {
evt = wh.verify(payload, {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
});
} catch (err) {
console.error('Webhook verification failed:', err);
return new NextResponse('Webhook Error', { status: 400 });
}

const { id: clerkId, email_addresses, first_name, last_name } = evt.data;

if (!clerkId) {
return new NextResponse('Missing clerkId', { status: 400 });
}

try {
const userExists = await prisma.user.findUnique({
    where: { id: clerkId },
});

if (!userExists) {
    const newUser = await prisma.user.create({
    data: {
        clerkId: clerkId,
        firstName: first_name || '',
        lastName: last_name || '',
        email: email_addresses?.[0]?.email_address || '',
    },
    });
    logger.log('user created sucessfully',LogLevel.INFO,{custom:newUser.clerkId})
} else {
    console.log('User already exists:', userExists);
}

return NextResponse.json({ success: true });
} catch (err) {
console.error('Database error:', err);
return new NextResponse('Database Error', { status: 500 });
}
}
