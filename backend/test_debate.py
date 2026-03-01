import requests
import json

url = "http://localhost:8000/api/debate"
payload = {
    "ticker": "AAPL",
    "provider": "google",
    "model": "gemini-3-pro-preview"
}
headers = {
    "Content-Type": "application/json"
}

try:
    with requests.post(url, json=payload, headers=headers, stream=True) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if line:
                print(line.decode('utf-8'))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
