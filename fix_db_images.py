import pyodbc
from db import Database
import urllib.parse
import re

try:
    db = Database()
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # We will grab all movies, re-encode their titles for dummyimage.com, and update
    cursor.execute("SELECT MovieID, Title, PosterURL FROM Movies WHERE PosterURL LIKE '%dummyimage.com%' OR PosterURL LIKE '%placehold.co%' OR PosterURL LIKE '%via.placeholder.com%'")
    movies = cursor.fetchall()
    
    count = 0
    for movie in movies:
        movie_id, title, url = movie
        clean_name = title[:20].replace(' ', '+')
        # URL encode the string except for the plus signs
        safe_text = urllib.parse.quote(title[:20])
        new_url = f"https://dummyimage.com/300x450/1a1a1a/f4a300.png?text={safe_text}"
        
        cursor.execute("UPDATE Movies SET PosterURL = ? WHERE MovieID = ?", (new_url, movie_id))
        count += 1
        
    conn.commit()
    conn.close()
    print(f"Updated {count} movies to use dummyimage.com!")
except Exception as e:
    print(f"Error: {e}")

