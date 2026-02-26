import os
import glob
import pandas as pd
from db import Database
import urllib.parse
import re
import ast
import traceback

def clean_title(title):
    if isinstance(title, str):
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

def parse_votes(votes_str):
    if not isinstance(votes_str, str): return 0
    votes_str = str(votes_str).upper().replace(',', '')
    if 'K' in votes_str:
        return int(float(votes_str.replace('K', '')) * 1000)
    if 'M' in votes_str:
        return int(float(votes_str.replace('M', '')) * 1000000)
    try:
        return int(votes_str)
    except:
        return 0

def clean_database(cursor):
    print("Cleaning existing movies and related data...")
    tables_to_clean = [
        'Watchlist', 'MovieDiscussions', 'Streams'
    ]
    for table in tables_to_clean:
        try:
            cursor.execute(f"DELETE FROM {table}")
        except Exception as e:
            print(f"Skipping table {table} due to error or doesn't exist: {e}")
    try:
        cursor.execute("DELETE FROM Movies")
        print("Movies table cleaned!")
    except Exception as e:
        print(f"Error cleaning Movies table: {e}")

def import_movies(base_dir):
    db = Database()
    conn = db.get_connection()
    cursor = conn.cursor()
    
    clean_database(cursor)
    conn.commit()
    
    # We will process all years
    years = sorted([d for d in os.listdir(base_dir) if d.isdigit()], reverse=True)
    total_added = 0
    
    print(f"Starting import for {len(years)} years...")
    
    for year in years:
        csv_file = os.path.join(base_dir, year, f"merged_movies_data_{year}.csv")
        if not os.path.exists(csv_file):
            continue
            
        print(f"Processing Year {year}...")
        try:
            df = pd.read_csv(csv_file)
            
            df = df.dropna(subset=['Rating'])
            
            # Sort by rating and popularity to get the best ones, limit to 100 per year
            df['ParsedVotes'] = df['Votes'].apply(parse_votes)
            df = df.sort_values(by=['Rating', 'ParsedVotes'], ascending=[False, False]).head(100)
            
            for _, row in df.iterrows():
                title = clean_title(row.get('Title', 'Unknown'))
                if not title: continue
                
                # Deduplicate by Title + Year within our script
                cursor.execute("SELECT 1 FROM Movies WHERE Title = ? AND Year = ?", (title, int(row.get('Year', year))))
                if cursor.fetchone():
                    continue
                    
                runtime = parse_runtime(row.get('Duration', ''))
                genre = safe_eval(row.get('genres', 'Drama'))[:100]
                director = safe_eval(row.get('directors', 'Unknown'))[:255]
                cast = safe_eval(row.get('stars', 'Unknown'))
                plot = str(row.get('description', ''))
                if pd.isna(plot): plot = ''
                
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
                
                # Fetching real posters is complex without an API or the main dataset, 
                # but we'll try to find if there's an image link in the csv
                # The schema showed no obvious image link aside from poster placeholder
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
            print(f" => Added {len(df)} movies for {year}.")
        except Exception as e:
            print(f"Error processing {year}: {e}")
            traceback.print_exc()
        
    conn.close()
    print(f"Successfully added {total_added} movies to the database!")

if __name__ == "__main__":
    import_movies(r"C:\Users\vamsh\Downloads\archive (1)\Data")
