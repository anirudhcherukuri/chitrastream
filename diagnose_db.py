import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

uri = os.environ.get('MONGODB_URI')
print(f"Testing URI: {uri}")

try:
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client[os.environ.get('DB_NAME', 'chitrastream')]
    client.admin.command('ping')
    print("[SUCCESS] MongoDB Ping successful!")
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"[FAILURE] MongoDB Error: {e}")
