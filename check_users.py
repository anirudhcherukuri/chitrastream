import pyodbc

conn_str = (
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=VAMSHI\\SQLEXPRESS;'
    'DATABASE=signinuser;'
    'Trusted_Connection=yes;'
)

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("USERS TABLE STRUCTURE")
    print("=" * 60)
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Users'
        ORDER BY ORDINAL_POSITION
    """)
    
    for row in cursor.fetchall():
        print(f"Column: {row[0]:<20} Type: {row[1]:<15} Length: {str(row[2]):<10} Nullable: {row[3]}")
    
    print("\n" + "=" * 60)
    print("SAMPLE USER DATA (REDACTED PASSWORDS)")
    print("=" * 60)
    cursor.execute("SELECT Email, FirstName, LastName, CreatedAt FROM Users")
    rows = cursor.fetchall()
    if rows:
        for row in rows:
            print(f"Email: {row[0]}, Name: {row[1]} {row[2]}, Created: {row[3]}")
    else:
        print("(No users found)")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
