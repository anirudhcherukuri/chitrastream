import pyodbc
from db import Database

db = Database()
print("Attempting to connect...")
conn = db.get_connection()
if conn:
    print("Connected successfully!")
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 * FROM Users")
    row = cursor.fetchone()
    print("User row:", row)
    conn.close()
else:
    print("Connection failed.")
