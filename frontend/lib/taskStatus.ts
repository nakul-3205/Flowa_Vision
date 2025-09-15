import axios from "axios";
import crypto from "crypto";

const SECRET = process.env.PYTHON_BACKEND_SECRET!;
const ENC_KEY = process.env.PYTHON_BACKEND_ENC_KEY!;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL!;

function generateHmac(payloadStr: string, timestamp: string) {
return crypto.createHmac("sha256", SECRET).update(`${timestamp}.${payloadStr}`).digest("hex");
}

export async function fetchTaskStatusFromPython(taskId: string, userId: string) {
const timestamp = Date.now().toString();
const payloadStr = JSON.stringify({ userId });

const signature = generateHmac(payloadStr, timestamp);

const response = await axios.get(`${PYTHON_BACKEND_URL}/task-status/${taskId}`, {
headers: {
    "x-signature": signature,
    "x-timestamp": timestamp,
    "Content-Type": "application/json",
},
});

return response.data;
}
