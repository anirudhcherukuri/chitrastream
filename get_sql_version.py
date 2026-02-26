import pyodbc
from db import Database

def get_version():
    db = Database()
    conn = db.get_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"SQL Server Version:\n{version}")
        conn.close()

if __name__ == "__main__":
    get_version()
