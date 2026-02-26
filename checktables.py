import pyodbc

# Connection string - update with your details
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
    print("CHATROOMS TABLE STRUCTURE")
    print("=" * 60)
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'ChatRooms'
        ORDER BY ORDINAL_POSITION
    """)
    
    for row in cursor.fetchall():
        print(f"Column: {row[0]:<20} Type: {row[1]:<15} Length: {str(row[2]):<10} Nullable: {row[3]}")
    
    print("\n" + "=" * 60)
    print("CHATMESSAGES TABLE STRUCTURE")
    print("=" * 60)
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'ChatMessages'
        ORDER BY ORDINAL_POSITION
    """)
    
    for row in cursor.fetchall():
        print(f"Column: {row[0]:<20} Type: {row[1]:<15} Length: {str(row[2]):<10} Nullable: {row[3]}")
    
    print("\n" + "=" * 60)
    print("SAMPLE DATA FROM CHATROOMS")
    print("=" * 60)
    cursor.execute("SELECT TOP 5 * FROM ChatRooms")
    rows = cursor.fetchall()
    if rows:
        for row in rows:
            print(row)
    else:
        print("(No data)")
    
    cursor.close()
    conn.close()
    
    print("\n✓ Check completed successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}")