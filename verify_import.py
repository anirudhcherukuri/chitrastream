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
    
    cursor.execute("SELECT COUNT(*) FROM dbo.Movies")
    movie_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM dbo.OTTPlatforms")
    platform_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM dbo.MoviePlatforms")
    mapping_count = cursor.fetchone()[0]
    
    print(f"Movies: {movie_count}")
    print(f"Platforms: {platform_count}")
    print(f"Mappings: {mapping_count}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
