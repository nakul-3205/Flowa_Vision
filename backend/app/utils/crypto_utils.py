import base64
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv
import os


load_dotenv()

ENC_KEY = os.getenv("PYTHON_BACKEND_ENC_KEY")

if not ENC_KEY:
    raise ValueError("PYTHON_BACKEND_ENC_KEY is not set in environment variables")

# Convert base64 key to bytes
ENC_KEY_BYTES = base64.b64decode(ENC_KEY)

def decrypt_payload(encrypted_payload: str) -> dict:

    try:
        # Decode the base64 encrypted data
        raw_data = base64.b64decode(encrypted_payload)

        # Extract IV (first 12 bytes), TAG (next 16 bytes), and encrypted message
        iv = raw_data[:12]
        tag = raw_data[12:28]
        encrypted_message = raw_data[28:]

        # AES-GCM decryption
        aesgcm = AESGCM(ENC_KEY_BYTES)
        decrypted_bytes = aesgcm.decrypt(iv, encrypted_message + tag, None)

        # Convert decrypted bytes to JSON
        decrypted_data = json.loads(decrypted_bytes.decode("utf-8"))
        return decrypted_data

    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}")
