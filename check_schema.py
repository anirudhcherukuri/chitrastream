import pyodbc
from db import Database

def check_schema():
    db = Database()
    conn = db.get_connection()
    if conn:
        cursor = conn.cursor()
        print("Checking tables and keys...")
        
        # Check Users table
        cursor.execute("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users'")
        columns = cursor.fetchall()
        print("\nColumns in Users:")
        for col in columns:
            print(f"  {col[0]} ({col[1]}, nullable: {col[2]})")
            
        # Check Primary Key of Users
        cursor.execute("""
            SELECT cu.COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE cu
            JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ON cu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'Users' AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        """)
        pks = cursor.fetchall()
        print(f"\nPrimary Key of Users: {[pk[0] for pk in pks]}")
        
        conn.close()

if __name__ == "__main__":
    check_schema()
