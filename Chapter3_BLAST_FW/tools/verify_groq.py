import os
import urllib.request
import urllib.error
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

GROQ_KEY   = os.getenv('VITE_GROQ_API_KEY', '')
GROQ_MODEL = os.getenv('VITE_GROQ_MODEL', 'openai/gpt-oss-120b')

def verify():
    payload = json.dumps({
        "model":    GROQ_MODEL,
        "messages": [{"role": "user", "content": "Respond with: GROQ_OK"}],
        "temperature": 0,
        "max_tokens": 10
    }).encode()

    req = urllib.request.Request(
        'https://api.groq.com/openai/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {GROQ_KEY}',
            'Content-Type':  'application/json'
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body    = json.loads(resp.read().decode())
            content = body['choices'][0]['message']['content'].strip()
            print(f"[PASS] GROQ handshake OK — model: {GROQ_MODEL}")
            print(f"       Response: {content}")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"[FAIL] GROQ HTTP {e.code}: {error_body}")
        return False
    except Exception as e:
        print(f"[FAIL] GROQ connection error: {e}")
        return False

if __name__ == '__main__':
    verify()
