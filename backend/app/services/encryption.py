import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

load_dotenv()

ENC_KEY = base64.b64decode(os.getenv("PYTHON_BACKEND_ENC_KEY"))

def encrypt_data(plaintext: str) -> str:
    """
    Encrypt a string using AES-GCM and return base64-encoded ciphertext.
    """
    try:
        aesgcm = AESGCM(ENC_KEY)
        iv = os.urandom(12)  # 96-bit IV
        ciphertext = aesgcm.encrypt(iv, plaintext.encode(), None)
        return base64.b64encode(iv + ciphertext).decode()
    except Exception as e:
        print(f"[ENCRYPTION ERROR]: {e}")
        return None

def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt base64-encoded AES-GCM ciphertext and return plaintext string.
    """
    try:
        raw = base64.b64decode(encrypted_data)
        iv, ciphertext = raw[:12], raw[12:]
        aesgcm = AESGCM(ENC_KEY)
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
        return plaintext.decode()
    except Exception as e:
        print(f"[DECRYPTION ERROR]: {e}")
        return None
