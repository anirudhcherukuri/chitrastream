
import pandas as pd
import pyodbc
import re
import sys

class IMDbTop1000Importer:
    def __init__(self):
        # Database configuration
        self.SERVER = 'VAMSHI\\SQLEXPRESS'  # Change this to your SQL Server name
        self.DATABASE = 'signinuser'
        
        self.conn_str = (
            f'DRIVER={{ODBC Driver 17 for SQL Server}};'
            f'SERVER={self.SERVER};'
            f'DATABASE={self.DATABASE};'
            f'Trusted_Connection=yes;'
            f'TrustServerCertificate=yes;'
        )
        
        # Platform assignment based on genre
        # Customize these as you like!
        self.platform_mapping = {
            'Drama': ['Netflix', 'Amazon Prime'],
            'Action': ['Disney+', 'HBO Max'],
            'Comedy': ['Netflix', 'Hulu'],
            'Thriller': ['Amazon Prime', 'Netflix'],
            'Crime': ['HBO Max', 'Amazon Prime'],
            'Adventure': ['Disney+', 'Amazon Prime'],
            'Sci-Fi': ['Netflix', 'HBO Max'],
            'Romance': ['Amazon Prime', 'Netflix'],
            'Fantasy': ['Disney+', 'HBO Max'],
            'Horror': ['Netflix', 'Hulu'],
            'Mystery': ['HBO Max', 'Amazon Prime'],
            'Biography': ['Netflix', 'Amazon Prime'],
            'Animation': ['Disney+', 'Netflix'],
            'Family': ['Disney+', 'Amazon Prime'],
            'War': ['HBO Max', 'Amazon Prime'],
            'Western': ['Amazon Prime', 'HBO Max'],
            'Musical': ['Disney+', 'Netflix'],
            'Sport': ['Amazon Prime', 'Disney+'],
            'History': ['Netflix', 'Amazon Prime'],
        }
    
    def get_connection(self):
        """Get database connection"""
        try:
            return pyodbc.connect(self.conn_str)
        except pyodbc.Error as e:
            print(f"\n❌ DATABASE CONNECTION ERROR:")
            print(f"   {str(e)}")
            print(f"\n💡 TROUBLESHOOTING:")
            print(f"   1. Make sure SQL Server is running")
            print(f"   2. Check server name: {self.SERVER}")
            print(f"   3. Verify database exists: {self.DATABASE}")
            print(f"   4. Run the database schema SQL script first")
            return None
    
    def generate_imdb_id(self, title, year):
        """Generate a unique placeholder IMDb ID"""
        # Create hash from title and year
        sanitized = re.sub(r'[^a-zA-Z0-9]', '', title.lower())
        hash_value = hash(sanitized + str(year if year else 0))
        # Format as IMDb ID (tt followed by 7 digits)
        return f"tt{abs(hash_value) % 10000000:07d}"
    
    def extract_runtime(self, runtime_str):
        """Extract runtime in minutes from string like '142 min'"""
        if pd.isna(runtime_str):
            return None
        match = re.search(r'(\d+)', str(runtime_str))
        return int(match.group(1)) if match else None
    
    def get_platforms_for_genre(self, genre_str):
        """Assign platforms based on primary genre"""
        if pd.isna(genre_str) or not genre_str:
            return ['Netflix', 'Amazon Prime']  # Default
        
        # Split genres and get first one
        genres = [g.strip() for g in str(genre_str).split(',')]
        primary_genre = genres[0] if genres else 'Drama'
        
        # Return platforms for that genre
        return self.platform_mapping.get(primary_genre, ['Netflix', 'Amazon Prime'])
    
    def import_csv(self, csv_file_path='imdb_top_1000.csv'):
        """Main import function"""
        
        print("\n" + "="*80)
        print("🎬 CHITRASTREAM - IMDB TOP 1000 MOVIE IMPORTER")
        print("="*80)
        
        # Step 1: Read CSV
        try:
            print(f"\n📊 Step 1: Reading CSV file...")
            print(f"   File: {csv_file_path}")
            df = pd.read_csv(csv_file_path)
            print(f"   ✅ Successfully read {len(df)} movies from CSV")
        except FileNotFoundError:
            print(f"\n❌ ERROR: File '{csv_file_path}' not found!")
            print(f"\n💡 Make sure:")
            print(f"   1. The file is in the same folder as this script")
            print(f"   2. The filename is correct (case-sensitive)")
            return
        except Exception as e:
            print(f"\n❌ ERROR reading CSV: {str(e)}")
            return
        
        # Step 2: Connect to database
        print(f"\n🔌 Step 2: Connecting to database...")
        print(f"   Server: {self.SERVER}")
        print(f"   Database: {self.DATABASE}")
        
        conn = self.get_connection()
        if not conn:
            return
        
        print(f"   ✅ Database connected successfully")
        
        cursor = conn.cursor()
        
        # Counters
        movies_added = 0
        movies_updated = 0
        movies_skipped = 0
        platforms_mapped = 0
        
        print(f"\n🚀 Step 3: Importing movies...")
        print(f"   This may take 2-3 minutes for 1000 movies...")
        print()
        
        # Step 3: Process each movie
        for index, row in df.iterrows():
            try:
                # Extract data from CSV
                title = str(row.get('Series_Title', '')).strip()
                year_str = str(row.get('Released_Year', '')).strip()
                
                # Parse year
                try:
                    year = int(year_str) if year_str.isdigit() else None
                except:
                    year = None
                
                genre = str(row.get('Genre', '')).strip() if pd.notna(row.get('Genre')) else None
                director = str(row.get('Director', '')).strip() if pd.notna(row.get('Director')) else None
                
                # Combine all stars into cast
                stars = []
                for i in range(1, 5):
                    star = row.get(f'Star{i}')
                    if pd.notna(star) and str(star).strip():
                        stars.append(str(star).strip())
                cast = ', '.join(stars) if stars else None
                
                rating = float(row.get('IMDB_Rating', 0)) if pd.notna(row.get('IMDB_Rating')) else None
                plot = str(row.get('Overview', '')).strip() if pd.notna(row.get('Overview')) else None
                poster_url = str(row.get('Poster_Link', '')).strip() if pd.notna(row.get('Poster_Link')) else None
                runtime = self.extract_runtime(row.get('Runtime'))
                
                # Default language and country
                language = 'English'
                country = 'USA'
                
                # Generate IMDb ID
                imdb_id = self.generate_imdb_id(title, year or 0)
                
                # Skip if no title
                if not title:
                    movies_skipped += 1
                    continue
                
                # Get platforms for this genre
                platforms = self.get_platforms_for_genre(genre)
                
                # Check if movie exists
                cursor.execute("SELECT MovieID FROM dbo.Movies WHERE IMDbID = ?", (imdb_id,))
                existing = cursor.fetchone()
                
                if existing:
                    # Update existing movie
                    movie_id = existing[0]
                    
                    update_query = """
                        UPDATE dbo.Movies 
                        SET Title = ?, Year = ?, Genre = ?, Director = ?, Cast = ?,
                            Rating = ?, Plot = ?, PosterURL = ?, Runtime = ?,
                            Language = ?, Country = ?, UpdatedAt = SYSUTCDATETIME()
                        WHERE MovieID = ?
                    """
                    cursor.execute(update_query, (
                        title, year, genre, director, cast, rating, plot,
                        poster_url, runtime, language, country, movie_id
                    ))
                    movies_updated += 1
                    
                else:
                    # Insert new movie
                    insert_query = """
                        INSERT INTO dbo.Movies 
                        (IMDbID, Title, Year, Genre, Director, Cast, Rating, Plot, 
                         PosterURL, Runtime, Language, Country, CreatedAt, UpdatedAt)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME(), SYSUTCDATETIME())
                    """
                    cursor.execute(insert_query, (
                        imdb_id, title, year, genre, director, cast, rating, plot,
                        poster_url, runtime, language, country
                    ))
                    
                    # Get new movie ID
                    cursor.execute("SELECT @@IDENTITY")
                    movie_id = cursor.fetchone()[0]
                    movies_added += 1
                
                # Add platform mappings
                for platform_name in platforms:
                    # Get or create platform
                    cursor.execute(
                        "SELECT PlatformID FROM dbo.OTTPlatforms WHERE PlatformName = ?", 
                        (platform_name,)
                    )
                    platform = cursor.fetchone()
                    
                    if not platform:
                        cursor.execute(
                            "INSERT INTO dbo.OTTPlatforms (PlatformName) VALUES (?)", 
                            (platform_name,)
                        )
                        cursor.execute("SELECT @@IDENTITY")
                        platform_id = cursor.fetchone()[0]
                    else:
                        platform_id = platform[0]
                    
                    # Create mapping if doesn't exist
                    cursor.execute("""
                        SELECT MoviePlatformID FROM dbo.MoviePlatforms 
                        WHERE MovieID = ? AND PlatformID = ?
                    """, (movie_id, platform_id))
                    
                    if not cursor.fetchone():
                        cursor.execute("""
                            INSERT INTO dbo.MoviePlatforms 
                            (MovieID, PlatformID, AvailableDate, IsActive)
                            VALUES (?, ?, SYSUTCDATETIME(), 1)
                        """, (movie_id, platform_id))
                        platforms_mapped += 1
                
                # Show progress every 50 movies
                if (index + 1) % 50 == 0:
                    print(f"   [{index + 1}/{len(df)}] Processed: {title[:45]}{'...' if len(title) > 45 else ''} (⭐ {rating})")
                
                # Commit every 100 movies
                if (index + 1) % 100 == 0:
                    conn.commit()
                    
            except Exception as e:
                print(f"   ⚠️  Error on row {index + 1}: {str(e)}")
                movies_skipped += 1
                continue
        
        # Final commit
        conn.commit()
        cursor.close()
        conn.close()
        
        # Print summary
        print("\n" + "="*80)
        print("✨ IMPORT COMPLETED SUCCESSFULLY!")
        print("="*80)
        print(f"📊 Summary:")
        print(f"   ✅ Movies added:        {movies_added}")
        print(f"   🔄 Movies updated:      {movies_updated}")
        print(f"   ⚠️  Movies skipped:      {movies_skipped}")
        print(f"   📺 Platform mappings:   {platforms_mapped}")
        print(f"   📈 Total in database:   {movies_added + movies_updated}")
        print("="*80)
        
        print("\n🎉 Success! Your movies are ready!")
        print("\n📝 Next steps:")
        print("   1. Start your Flask app: python app.py")
        print("   2. Open browser: http://localhost:5000/movies")
        print("   3. Browse your 1000 movies!")
        print("\n" + "="*80 + "\n")


def main():
    """Main function"""
    print("\n" + "="*80)
    print(" "*25 + "🎬 CHITRASTREAM 🎬")
    print(" "*20 + "IMDb Top 1000 Movie Importer")
    print("="*80)
    
    # Get CSV file path
    print("\n📁 CSV File Location:")
    csv_file = input("   Enter CSV file path (or press Enter for 'imdb_top_1000.csv'): ").strip()
    
    if not csv_file:
        csv_file = 'imdb_top_1000.csv'
    
    print(f"\n   Using: {csv_file}")
    
    # Confirm before proceeding
    print("\n⚠️  This will import movies into your database.")
    confirm = input("   Continue? (y/n): ").strip().lower()
    
    if confirm != 'y':
        print("\n❌ Import cancelled.")
        return
    
    # Create importer and run
    importer = IMDbTop1000Importer()
    importer.import_csv(csv_file)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Import cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)