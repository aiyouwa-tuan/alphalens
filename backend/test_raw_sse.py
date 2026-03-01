import urllib.request
import json
req = urllib.request.Request("http://localhost:8000/api/debate", data=b'{"ticker":"AAPL","provider":"google","model":"gemini-3-pro-preview"}', headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as response:
    print(repr(response.read(100)))
