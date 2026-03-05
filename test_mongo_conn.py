import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

def test_mongo():
    uri = os.environ.get('MONGODB_URI')
    print(f"Testing Mongo: {uri[:30]}...")
    try:
        client = pymongo.MongoClient(uri)
        client.admin.command('ping')
        print("Success! MongoDB is reachable.")
        db = client['chitrastream']
        count = db.movies.count_documents({})
        print(f"Found {count} movies in MongoDB.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_mongo()
