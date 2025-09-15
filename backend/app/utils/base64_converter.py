import requests
import base64
from io import BytesIO

def fetch_file_from_url(url: str, return_type: str = "buffer"):

    try:

        response = requests.get(url, stream=True)
        response.raise_for_status()


        file_bytes = BytesIO(response.content)

        if return_type == "buffer":
            return file_bytes.getvalue()

        elif return_type == "base64":
            encoded = base64.b64encode(file_bytes.getvalue()).decode('utf-8')
            return encoded

        else:
            raise ValueError("Invalid return_type. Use 'buffer' or 'base64'.")

    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to fetch file from URL: {str(e)}")
