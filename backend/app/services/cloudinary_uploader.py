import os
import base64
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import uuid

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image_to_cloudinary(image_base64: str, public_id: str = None):
    """
    Uploads a base64 image to Cloudinary.
    Returns the secure URL of the uploaded image.
    """
    try:
        # If no public_id provided, generate a unique one
        if not public_id:
            public_id = f"flowa_{uuid.uuid4()}"

        # Ensure base64 string is properly formatted
        if image_base64.startswith("data:image"):
            # Remove data URL header if exists
            image_base64 = image_base64.split(",")[1]

        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_base64)

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            image_bytes,
            folder="flowa_generated",
            public_id=public_id
        )

        return result.get("secure_url")
    except Exception as e:
        print(f"[CLOUDINARY UPLOAD ERROR]: {e}")
        return None
