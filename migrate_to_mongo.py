import pyodbc
from pymongo import MongoClient
import os
from datetime import datetime
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

# SQL Config
SERVER = 'VAMSHI\\SQLEXPRESS'
DATABASE = 'signinuser'
conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};Trusted_Connection=yes;TrustServerCertificate=yes;'

# Mongo Config
MONGO_URI = os.environ.get('MONGODB_URI')
client = MongoClient(MONGO_URI)
db = client['chitrastream']

def clean_document(doc):
    """Convert Decimal to float and perform other cleanups"""
    cleaned = {}
    for k, v in doc.items():
        key = k.lower()
        if isinstance(v, Decimal):
            cleaned[key] = float(v)
        else:
            cleaned[key] = v
    return cleaned

def migrate():
    try:
        sql_conn = pyodbc.connect(conn_str)
        cursor = sql_conn.cursor()
        
        # 1. Migrate Movies
        print("Fetching movies from SQL Server...")
        cursor.execute("SELECT * FROM Movies")
        columns = [column[0] for column in cursor.description]
        movies_data = [clean_document(dict(zip(columns, row))) for row in cursor.fetchall()]
        
        if movies_data:
            print(f"Migrating {len(movies_data)} movies to MongoDB...")
            db.movies.delete_many({}) 
            db.movies.insert_many(movies_data)
            print(f"✓ Migrated {len(movies_data)} movies.")

        # 2. Migrate Users
        print("\nFetching users from SQL Server...")
        cursor.execute("SELECT * FROM Users")
        columns = [column[0] for column in cursor.description]
        users_data = []
        for row in cursor.fetchall():
            user_doc = clean_document(dict(zip(columns, row)))
            if 'passwordhash' in user_doc:
                user_doc['password_hash'] = user_doc.pop('passwordhash')
            users_data.append(user_doc)
            
        if users_data:
            print(f"Migrating {len(users_data)} users to MongoDB...")
            db.users.delete_many({})
            db.users.insert_many(users_data)
            print(f"✓ Migrated {len(users_data)} users.")

        sql_conn.close()
        print("\n[SUCCESS] Migration complete!")
        
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")

if __name__ == "__main__":
    migrate()
