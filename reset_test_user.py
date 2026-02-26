import pyodbc
import bcrypt

conn_str = (
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=VAMSHI\\SQLEXPRESS;'
    'DATABASE=signinuser;'
    'Trusted_Connection=yes;'
)

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    password = "Test123!"
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    print(f"Updating password for test@example.com to {password}...")
    cursor.execute("UPDATE Users SET PasswordHash = ? WHERE Email = ?", (password_hash, 'test@example.com'))
    
    if cursor.rowcount == 0:
        print("User test@example.com not found, inserting...")
        cursor.execute("""
            INSERT INTO Users (Email, PasswordHash, FirstName, LastName, SignupSource, SignupIP, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME())
        """, ('test@example.com', password_hash, 'Test', 'User', 'Manual', '127.0.0.1'))
    
    conn.commit()
    print("✓ Done!")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
