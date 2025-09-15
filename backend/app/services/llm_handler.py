import os
import openai
from system_prompts.prompts import build_system_prompt

# Set your OpenAI API key
openai.api_key = os.getenv("GEMINI_API_KEY")

def generate_image_task(user_prompt: str, platform: str, image_url: str = None):

    try:
        # Build the system prompt (strict instructions + few-shot examples)
        system_prompt = build_system_prompt(user_prompt, platform, has_image=bool(image_url))

        # Build the user content
        user_content = f"User Prompt: {user_prompt}\nPlatform: {platform}"
        if image_url:
            user_content += f"\nReference Image URL: {image_url}"

        response = openai.ChatCompletion.create(
            model="gemini-2.5-flash-image-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.8,
            max_tokens=4096
        )

        # Gemini returns content in choices[0].message.content
        llm_output = response.choices[0].message["content"].strip()
        return llm_output

    except Exception as e:
        print(f"[LLM ERROR]: {e}")
        return None
