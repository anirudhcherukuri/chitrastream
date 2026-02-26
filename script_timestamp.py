
from db import db
from datetime import datetime

print("Testing add_message with timestamp...")
timestamp = datetime.now().isoformat()
print(f"Timestamp str: {timestamp}")

try:
    result = db.add_message('test@example.com', 'Debug User', 'general', 'Test message with timestamp', timestamp)
    print(f"Result for 'general' with timestamp: {result}")
except Exception as e:
    print(f"Error: {e}")

# Verify messages
messages = db.get_room_messages('general', limit=5)
print(f"Messages in 'general': {len(messages)}")
for msg in messages:
     print(f" - {msg['message']} (Time: {msg.get('timestamp')})")
