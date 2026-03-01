import requests
import json
import sys

def main():
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/debate",
            json={"ticker": "NVDA", "provider": "google", "model": "gemini-3-pro-preview"},
            stream=True
        )
        print(f"Status: {response.status_code}")
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                print(decoded)
                if "error" in decoded.lower():
                    print("got error!")
                    sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
