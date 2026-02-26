
from db import db

print("Testing add_message...")
# Try adding a message to 'general' (lowercase)
result = db.add_message('test@example.com', 'Debug User', 'general', 'Test message from script')
print(f"Result for 'general': {result}")

# Try adding a message to 'General' (capitalized)
result = db.add_message('test@example.com', 'Debug User', 'General', 'Test message to General')
print(f"Result for 'General': {result}")

# Verify messages
messages = db.get_room_messages('general', limit=5)
print(f"Messages in 'general': {len(messages)}")
for msg in messages:
    print(f" - {msg['message']} (RoomId: {msg.get('room_id')})") # verify if room_id is returned or not

messages = db.get_room_messages('General', limit=5)
print(f"Messages in 'General': {len(messages)}")
for msg in messages:
     print(f" - {msg['message']}")
