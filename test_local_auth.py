import requests
import time

BASE_URL = "http://localhost:5000" # Local test
timestamp = int(time.time())
email = f"test_{timestamp}@gmail.com"

data = {
    "username": "Tester AI",
    "email": email,
    "password": "Password123"
}

print(f"Testing signup with {email}...")
try:
    r = requests.post(f"{BASE_URL}/api/auth/signup", json=data)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.json()}")
    
    if r.status_code == 200:
        print("Signup Successful! Testing Login...")
        r2 = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "Password123"})
        print(f"Login Status: {r2.status_code}")
        print(f"Login Response: {r2.json()}")
except Exception as e:
    print(f"Error: {e}")
