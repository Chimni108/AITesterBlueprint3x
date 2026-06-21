import os
import base64
import urllib.request
import urllib.error
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

BASE_URL  = os.getenv('VITE_JIRA_BASE_URL', '').replace('VITE_', '')
EMAIL     = os.getenv('VITE_JIRA_EMAIL', '')
TOKEN     = os.getenv('VITE_JIRA_TOKEN', '')
ISSUE_ID  = 'SCRUM-5'

def verify():
    creds   = base64.b64encode(f"{EMAIL}:{TOKEN}".encode()).decode()
    url     = f"{BASE_URL}/rest/api/3/issue/{ISSUE_ID}"
    req     = urllib.request.Request(url, headers={
        'Authorization': f'Basic {creds}',
        'Accept':        'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body   = json.loads(resp.read().decode())
            fields = body.get('fields', {})
            print(f"[PASS] JIRA handshake OK — {ISSUE_ID}")
            print(f"       Summary     : {fields.get('summary', 'N/A')}")
            print(f"       Issue Type  : {fields.get('issuetype', {}).get('name', 'N/A')}")
            print(f"       Priority    : {fields.get('priority', {}).get('name', 'N/A')}")
            print(f"       Labels      : {fields.get('labels', [])}")
            return True
    except urllib.error.HTTPError as e:
        print(f"[FAIL] JIRA HTTP {e.code}: {e.reason}")
        return False
    except Exception as e:
        print(f"[FAIL] JIRA connection error: {e}")
        return False

if __name__ == '__main__':
    verify()
