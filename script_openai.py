import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_openai_connection():
    # Get API key
    api_key = os.environ.get('OPENAI_API_KEY')
    
    print("=" * 60)
    print("OPENAI CONNECTION TEST")
    print("=" * 60)
    
    if not api_key:
        print("[-] Error: OPENAI_API_KEY not found in environment variables.")
        return
    
    # Mask key for display
    masked_key = f"{api_key[:8]}...{api_key[-4:]}"
    print(f"[+] API Key found: {masked_key}")
    
    # Initialize client
    client = openai.OpenAI(api_key=api_key)
    
    try:
        print("[*] Sending test request to GPT-3.5-Turbo...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Hello! Just testing the connection. Please reply with 'Connection Successful'."}
            ],
            max_tokens=20
        )
        
        reply = response.choices[0].message.content.strip()
        print(f"[+] Response received: {reply}")
        
        if "Successful" in reply:
            print("\n!!! OPENAI CONNECTION IS WORKING!")
        else:
            print("\nWARNING: OpenAI responded, but message was unexpected.")
            
    except Exception as e:
        print(f"\n[-] Error during API call: {str(e)}")

        print("\nTip: Troubleshooting tips:")
        print("1. Check if your API key is valid and has credits (Error 429 means quota exceeded).")
        print("2. Check your internet connection.")
        print("3. Ensure the 'openai' package is updated (pip install --upgrade openai).")

if __name__ == "__main__":
    test_openai_connection()
