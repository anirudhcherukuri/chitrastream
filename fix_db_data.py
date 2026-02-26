import pyodbc
from db import Database

try:
    db = Database()
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # 1. Fix placeholder URLs
    # Format for placehold.co is: https://placehold.co/300x450/1a1a1a/f4a300?text=Hello+World
    # For via.placeholder it was https://via.placeholder.com/300x450/1a1a1a/f4a300?text=Hello%20World
    # placehold.co also supports %20, so just replacing the domain is enough
    cursor.execute("UPDATE Movies SET PosterURL = REPLACE(PosterURL, 'via.placeholder.com', 'placehold.co') WHERE PosterURL LIKE '%via.placeholder.com%'")
    print(f"Updated {cursor.rowcount} image URLs to use placehold.co")
    
    # 2. Fix 'nan' plots
    cursor.execute("UPDATE Movies SET Plot = '' WHERE Plot = 'nan' OR Plot = 'NaN' OR Plot IS NULL")
    print(f"Cleared {cursor.rowcount} nan plots")
    
    conn.commit()
    conn.close()
    print("Database data repaired successfully.")
except Exception as e:
    print(f"Error: {e}")
