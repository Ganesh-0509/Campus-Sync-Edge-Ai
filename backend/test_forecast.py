import requests
import json

url = "http://localhost:8000/ai/market-forecast"
data = {
    "role": "Software Developer",
    "missing_skills": ["C++", "Qt"]
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
