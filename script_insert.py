import pyodbc
import bcrypt

SERVER = 'VAMSHI\\SQLEXPRESS'
DATABASE = 'signinuser'

try:
    # Connect
    conn_str = (
        f'DRIVER={{ODBC Driver 17 for SQL Server}};'
        f'SERVER={SERVER};'
        f'DATABASE={DATABASE};'
        f'Trusted_Connection=yes;'
        f'TrustServerCertificate=yes;'
    )
    
    conn = pyodbc.connect(conn_str)
    print("✓ Connected successfully!")
    
    # Hash a test password
    password = "Test123!"
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    # Insert test user
    cursor = conn.cursor()
    query = """
        INSERT INTO dbo.Users 
        (Email, PasswordHash, FirstName, LastName, SignupSource, SignupIP, CreatedAt)
        VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME())
    """
    
    cursor.execute(query, (
        'test@example.com',
        password_hash,
        'Test',
        'User',
        'Web',
        '127.0.0.1'
    ))
    
    conn.commit()
    print("✓ Test user inserted successfully!")
    
    # Verify
    cursor.execute("SELECT * FROM dbo.Users")
    rows = cursor.fetchall()
    print(f"\n✓ Total users in database: {len(rows)}")
    
    for row in rows:
        print(f"  - {row.Email} | {row.FirstName} {row.LastName}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()