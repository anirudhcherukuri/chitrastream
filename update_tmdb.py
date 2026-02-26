import pyodbc
from db import Database
import urllib.request
import json
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

TMDB_API_KEY = "4e44d9029b1270a757cddc766a1bcb63"

def fetch_tmdb_poster(title, year):
    try:
        query = urllib.parse.quote(title)
        url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={query}"
        if year: url += f"&year={year}"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode())
        
        if data.get('results') and len(data['results']) > 0:
            poster_path = data['results'][0].get('poster_path')
            if poster_path:
                return f"https://image.tmdb.org/t/p/w500{poster_path}"
    except Exception as e:
        pass
    return None

def update_db():
    try:
        db = Database()
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Select movies that have dummy or missing posters, prioritizing high rating
        cursor.execute("""
            SELECT MovieID, Title, Year, PosterURL 
            FROM Movies 
            WHERE PosterURL LIKE '%dummyimage.com%' OR PosterURL LIKE '%placehold%' OR PosterURL LIKE '%via.placeholder%' OR PosterURL = ''
            ORDER BY Rating DESC, ViewCount DESC
        """)
        movies = cursor.fetchall()
        
        print(f"Found {len(movies)} movies without real posters. Updating via TMDB API...")
        
        updated = 0
        def process_movie(movie):
            nonlocal updated
            mid, title, year, old_url = movie
            
            poster = fetch_tmdb_poster(title, year)
            if not poster:
                # Fallback to no year if year search failed
                poster = fetch_tmdb_poster(title, None)
                
            if poster:
                try:
                    # Update each row directly in its own short-lived connection to avoid driver issues inside threads,
                    # or better: we just collect them and update synchronously
                    return (poster, mid)
                except:
                    return None
            return None

        # Fetch in parallel
        results = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            for result in executor.map(process_movie, movies[:400]): # Limit to Top 400 immediately to show user fix quickly
                if result:
                    results.append(result)
        
        # Batch update
        for poster_url, mid in results:
            cursor.execute("UPDATE Movies SET PosterURL = ? WHERE MovieID = ?", (poster_url, mid))
            updated += 1
            
        conn.commit()
        conn.close()
        print(f"Successfully fetched and updated {updated} real movie posters from TMDB!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_db()
