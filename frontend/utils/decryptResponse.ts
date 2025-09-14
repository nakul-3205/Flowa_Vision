import crypto from "crypto";

const ENC_KEY = Buffer.from(process.env.PYTHON_BACKEND_ENC_KEY!, "base64"); // 32 bytes AES-256

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param encryptedB64 - Base64 encrypted string (iv + tag + ciphertext)
 */
export function decryptAES(encryptedB64: string) {
try {
const data = Buffer.from(encryptedB64, "base64");

// Extract IV (12 bytes), Tag (16 bytes), Ciphertext
const iv = data.slice(0, 12);
const tag = data.slice(12, 28);
const ciphertext = data.slice(28);

const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
decipher.setAuthTag(tag);

const decrypted = decipher.update(ciphertext) + decipher.final("utf8");
return decrypted;
} catch (err) {
console.error("AES decryption failed:", err);
return null;
}
}

/**
 * Process backend response and decrypt fields
 * @param response - Backend response object
 */
export function processAIResponse(response: any) {
const decryptedResponse: any = { ...response };

// Decrypt Cloudinary URL if exists
if (response.imageUrl) {
decryptedResponse.imageUrl = decryptAES(response.imageUrl);
}

// Decrypt AI reply if encrypted
if (response.reply) {
decryptedResponse.reply = decryptAES(response.reply);
}

return decryptedResponse;
}
