import requests
import json
import time

BASE_URL = "https://chitrastream.onrender.com"

def test_signup_login():
    print(f"Testing signup on {BASE_URL}...")
    timestamp = int(time.time())
    email = f"tester_{timestamp}@chitrastream.com"
    payload = {
        "username": f"AI Tester {timestamp}",
        "email": email,
        "password": "Password123!"
    }
    
    # 1. Signup
    res = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
    print(f"Signup Result: {res.status_code}, {res.json()}")
    if res.status_code != 200:
        return None
    
    cookies = res.cookies
    
    # 2. Login (optional, as signup logs in)
    print("Testing login...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": "Password123!"
    }, cookies=cookies)
    print(f"Login Result: {res.status_code}, {res.json()}")
    
    # 3. Check movies
    print("Testing movies API...")
    res = requests.get(f"{BASE_URL}/api/movies", cookies=cookies)
    print(f"Movies API Result: {res.status_code}, Found {len(res.json())} movies.")
    return cookies

if __name__ == "__main__":
    test_signup_login()
