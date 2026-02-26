from db import Database
import json

db = Database()
conn = db.get_connection()
cursor = conn.cursor()

cursor.execute("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Movies'")
cols = [dict(zip([column[0] for column in cursor.description], row)) for row in cursor.fetchall()]

with open('schema_len.json', 'w') as f:
    json.dump(cols, f, indent=2)
