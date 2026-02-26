
import pyodbc

SERVER = 'VAMSHI\\SQLEXPRESS'
DATABASE = 'signinuser'

conn_str = (
    f'DRIVER={{ODBC Driver 17 for SQL Server}};'
    f'SERVER={SERVER};'
    f'DATABASE={DATABASE};'
    f'Trusted_Connection=yes;'
    f'TrustServerCertificate=yes;'
)

try:
    print("Connecting to database...")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print("\n--- Recent Messages ---")
    cursor.execute("""
        SELECT TOP 10 m.MessageId, m.RoomId, r.RoomName, m.UserEmail, m.Message, m.CreatedAt
        FROM ChatMessages m
        LEFT JOIN ChatRooms r ON m.RoomId = r.RoomId
        ORDER BY m.CreatedAt DESC
    """)
    
    messages = cursor.fetchall()
    if not messages:
        print("No messages found.")
    else:
        for msg in messages:
            print(f"ID: {msg[0]}, Room: {msg[1]} ({msg[2]}), User: {msg[3]}, Msg: {msg[4][:30]}..., Time: {msg[5]}")

    print("\n--- Room List ---")
    cursor.execute("SELECT RoomId, RoomName FROM ChatRooms")
    rooms = cursor.fetchall()
    for room in rooms:
        print(f"ID: {room[0]}, Name: {room[1]}")
            
except Exception as e:
    print(f"\n❌ Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
