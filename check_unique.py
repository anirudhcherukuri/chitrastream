import pyodbc
from db import Database

def check_unique():
    db = Database()
    conn = db.get_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT tc.CONSTRAINT_TYPE, cu.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE cu ON tc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'Users' AND cu.COLUMN_NAME = 'Email'
        """)
        constraints = cursor.fetchall()
        print(f"Constraints on Users.Email: {constraints}")
        conn.close()

if __name__ == "__main__":
    check_unique()
