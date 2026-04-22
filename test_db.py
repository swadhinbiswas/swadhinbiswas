import os
import requests
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ.get("TURSO_DATABASE_URL")
DB_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")

query = {
    "requests": [
        {"type": "execute", "stmt": {"sql": "SELECT * FROM site_settings WHERE key = 'github_update_secret'", "args": []}}
    ]
}

if DB_URL.startswith("libsql://"):
    DB_URL = DB_URL.replace("libsql://", "https://")

res = requests.post(
    f"{DB_URL}/v2/pipeline",
    json=query,
    headers={"Authorization": f"Bearer {DB_TOKEN}"}
)
print("Status:", res.status_code)
print("Response:", res.json())
