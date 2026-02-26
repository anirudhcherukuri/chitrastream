import pymongo
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.environ.get('MONGODB_URI')
print(f"Testing connection to: {uri.split('@')[1]}")

try:
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("[OK] Connection successful!")
    
    db = client['chitrastream']
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"[ERROR] Connection failed: {e}")
