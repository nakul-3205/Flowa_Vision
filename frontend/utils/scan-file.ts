// utils/scan-file.ts
import axios from "axios";

const VIRUSTOTAL_API = "https://www.virustotal.com/api/v3";

export async function scanFileWithVirusTotal(fileBuffer: Buffer): Promise<boolean> {
try {
// Upload file buffer directly
const uploadResponse = await axios.post(`${VIRUSTOTAL_API}/files`, fileBuffer, {
    headers: {
    "x-apikey": process.env.VIRUSTOTAL_API_KEY!,
    "Content-Type": "application/octet-stream",
    },
});

const analysisId = uploadResponse.data.data.id;

let scanResult = null;
for (let i = 0; i < 10; i++) {
    const status = await axios.get(`${VIRUSTOTAL_API}/analyses/${analysisId}`, {
    headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY! },
    });

    const { attributes } = status.data.data;

    if (attributes.status === "completed") {
    scanResult = attributes.stats;
    break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2 seconds
}

if (!scanResult) throw new Error("VirusTotal scan timeout");

// Returns TRUE if malicious or suspicious
return scanResult.malicious > 0 || scanResult.suspicious > 0;
} catch (error: any) {
console.error("VirusTotal Scan Error:", error.message);
throw new Error("VirusTotal scanning failed");
}
}
