import os
import glob
import pandas as pd
from db import Database
import urllib.parse
import re
import ast

def clean_title(title):
    if isinstance(title, str):
        # Removing leading numbers like "1. ", "500.", etc.
        return re.sub(r'^\d+\.\s*', '', title).strip()
    return ""

def parse_runtime(duration):
    if not isinstance(duration, str):
        return 120
    minutes = 0
    h_match = re.search(r'(\d+)h', duration)
    m_match = re.search(r'(\d+)m', duration)
    if h_match: minutes += int(h_match.group(1)) * 60
    if m_match: minutes += int(m_match.group(1))
    return minutes if minutes > 0 else 120
    
def safe_eval(val):
    try:
        if pd.isna(val) or not val: return ''
        lst = ast.literal_eval(val)
        if isinstance(lst, list): return ', '.join([str(x) for x in lst])
    except:
        pass
    return str(val) if not pd.isna(val) else ''

def import_movies(base_dir, max_years=10):
    db = Database()
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # We'll take the most recent years first
    years = sorted([d for d in os.listdir(base_dir) if d.isdigit()], reverse=True)[:max_years]
    total_added = 0
    
    for year in years:
        csv_file = os.path.join(base_dir, year, f"merged_movies_data_{year}.csv")
        if not os.path.exists(csv_file):
            continue
            
        print(f"Processing {year}...")
        df = pd.read_csv(csv_file)
        
        # Take top 50 highly rated movies per year to not overwhelm the database
        df = df.dropna(subset=['Rating'])
        df = df.sort_values(by='Rating', ascending=False).head(50)
        
        for _, row in df.iterrows():
            title = clean_title(row.get('Title', 'Unknown'))
            if not title: continue
            
            # Check if exists
            cursor.execute("SELECT 1 FROM Movies WHERE Title = ? AND Year = ?", (title, int(row.get('Year', year))))
            if cursor.fetchone():
                continue
                
            runtime = parse_runtime(row.get('Duration', ''))
            genre = safe_eval(row.get('genres', 'Drama'))[:100]
            director = safe_eval(row.get('directors', 'Unknown'))[:255]
            cast = safe_eval(row.get('stars', 'Unknown'))
            plot = str(row.get('description', ''))
            if pd.isna(plot): plot = ''
            
            # Extract IMDb ID if found
            link = str(row.get('Movie Link', ''))
            imdb_id = ''
            match = re.search(r'title/(tt\d+)', link)
            if match: imdb_id = match.group(1)[:20]
            
            rating = 5.0
            try: rating = float(row.get('Rating', 5.0))
            except: pass
            
            language = safe_eval(row.get('Languages', 'English'))[:100]
            country = safe_eval(row.get('countries_origin', 'United States'))[:100]
            
            text_param = urllib.parse.quote(title[:20])
            title = title[:255]
            poster_url = f"https://via.placeholder.com/300x450/1a1a1a/f4a300?text={text_param}"
            
            sql = """
                INSERT INTO Movies (IMDbID, Title, Year, Genre, Director, Cast, Rating, Plot, PosterURL, Runtime, Language, Country, ViewCount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            cursor.execute(sql, (
                imdb_id, title, int(row.get('Year', year)), genre, director, cast, rating, plot, poster_url, runtime, language, country, 0
            ))
            total_added += 1
            
        conn.commit()
        
    conn.close()
    print(f"Successfully added {total_added} non-duplicate movies to the database!")

if __name__ == "__main__":
    import_movies(r"C:\Users\vamsh\Downloads\archive (1)\Data")
