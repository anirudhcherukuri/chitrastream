import requests
import socketio
import time
import json
from threading import Thread

# Helper to encrypt messages (JS uses CryptoJS.AES)
# But wait, AES encryption with CryptoJS might be hard to exactly replicate in Python simply.
# Let's check Community.jsx:
# const SHARED_SECRET = "ChitraStream_E2EE_Alpha_2026"
# If we just send plaintext, we can see if it decrypts or just falls back.
# `decryptMessage` returns the original text if decryption fails, so we can just send plaintext!

def simulate_user(email, username, password, room, messages, delay):
    time.sleep(delay)
    print(f"[{username}] Starting...")
    
    # 1. Login to get session cookie
    session = requests.Session()
    session.post('http://localhost:3000/api/auth/signup', json={
        'username': username,
        'email': email,
        'password': password
    })
    res = session.post('http://localhost:3000/api/auth/login', json={
        'email': email,
        'password': password
    })
    
    if not res.json().get('success'):
        print(f"[{username}] Login failed:", res.json())
        return
        
    cookies = session.cookies.get_dict()
    cookie_str = "; ".join([f"{k}={v}" for k, v in cookies.items()])
    
    # 2. Connect to SocketIO
    sio = socketio.Client()
    
    @sio.event
    def connect():
        print(f"[{username}] Connected to Socket.IO")
        sio.emit('join_room', {'room': room})
        
    sio.connect('http://localhost:3000', 
                headers={'Cookie': cookie_str}, 
                transports=['polling', 'websocket'])
    
    # 3. Send messages repeatedly for a minute
    for step in range(30):
        for msg in messages:
            time.sleep(2)
            print(f"[{username}] Sending: {msg} (Step {step})")
            sio.emit('send_message', {'room': room, 'message': msg})
        
    time.sleep(2)
    sio.disconnect()
    print(f"[{username}] Done.")

if __name__ == "__main__":
    threads = []
    
    t1 = Thread(target=simulate_user, args=("user1@chat.com", "ChatUser1", "pass123", "general", [
        "Hey everyone! How's the new Community Chat?",
        "It looks really premium with this dark glass theme!"
    ], 0))
    
    t2 = Thread(target=simulate_user, args=("user2@chat.com", "MovieBuff", "pass123", "general", [
        "I just noticed the new watermark background, so cool.",
        "And we have Filmography and Budget rooms now!"
    ], 3))
    
    t3 = Thread(target=simulate_user, args=("user3@chat.com", "DirectorX", "pass123", "filmography", [
        "Let's discuss Christopher Nolan's filmography here.",
        "I still think Interstellar is his best work."
    ], 1))
    
    threads.extend([t1, t2, t3])
    
    for t in threads:
        t.start()
        
    for t in threads:
        t.join()
    
    print("All simulated chats completed.")
