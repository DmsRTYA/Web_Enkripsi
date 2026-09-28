import requests
import json

payload = {
    "teks": "hello world",
    "password_kripto": "testpass",
    "algo": "AES-GCM"
}

try:
    response = requests.post("http://localhost:8000/api/enkripsi/teks", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
