import crypto from "crypto";
import axios from "axios";
import { createLogger } from "./logger";


const logger=createLogger('Flowa_SecureForward')
const SECRET = process.env.PYTHON_BACKEND_SECRET!;
const ENC_KEY = process.env.PYTHON_BACKEND_ENC_KEY!; // 32-byte base64

interface ForwardOptions {
endpoint: string;
payload: { prompt: string; imageUrl?: string };
}

function encrypt(text: string) {
const iv = crypto.randomBytes(12); // 12 bytes for GCM
const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENC_KEY, "base64"), iv);

const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();


return Buffer.concat([iv, tag, encrypted]).toString("base64");
}


function generateHmac(payloadStr: string, timestamp: string) {
return crypto.createHmac("sha256", SECRET).update(`${timestamp}.${payloadStr}`).digest("hex");
}


export async function forwardSecureToPython({ endpoint, payload }: ForwardOptions) {
const timestamp = Date.now().toString();


const encryptedPayload = {
...payload,
imageUrl: payload.imageUrl ? encrypt(payload.imageUrl) : undefined,
};

const payloadStr = JSON.stringify(encryptedPayload);

const signature = generateHmac(payloadStr, timestamp);

try {
const response = await axios.post(
`${process.env.PYTHON_BACKEND_URL}${endpoint}`,
encryptedPayload,
{
headers: {
    "x-signature": signature,
    "x-timestamp": timestamp,
    "Content-Type": "application/json",
},
}
);

return response.data;
} catch (err: any) {
console.error("Error forwarding to Python backend:", err.message);
logger.error('error sending request to python',{custom:err})
throw new Error("Failed to reach Python backend");
}
}
