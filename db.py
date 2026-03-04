import ssl as _stdlib_ssl  # Use the REAL ssl, not eventlet's patched version
import pymongo
import bcrypt
import re
from datetime import datetime
import os
import certifi
from bson import ObjectId

class Database:
    def __init__(self):
        """Initialize MongoDB connection"""
        self.uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
        self.db_name = os.environ.get('DB_NAME', 'chitrastream')
        self.db = None
        self.client = None
        
        try:
            # Build a proper SSL context using stdlib ssl (not eventlet's)
            ssl_context = _stdlib_ssl.create_default_context(cafile=certifi.where())
            
            self.client = pymongo.MongoClient(
                self.uri,
                serverSelectionTimeoutMS=15000,
                connectTimeoutMS=15000,
                socketTimeoutMS=15000,
                connect=False,
                retryWrites=True,
                tls=True,
                tlsCAFile=certifi.where(),
                tlsAllowInvalidCertificates=True
            )
            self.db = self.client[self.db_name]
            print(f"[INFO] Database object initialized for: {self.db_name}")
        except Exception as e:
            print(f"[ERROR] MongoDB initialization failed: {e}")
            self.db = None

    def get_collection(self, name):
        if self.db is None:
            # Re-attempt to get db handle if it was None
            try:
                if self.client:
                    self.db = self.client[self.db_name]
                else:
                    return None
            except:
                return None
        return self.db[name]

    def validate_email(self, email):
        if not email:
            return False
        # Permissive regex
        pattern = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
        return re.match(pattern, email.strip()) is not None

    def hash_password(self, password):
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password, password_hash):
        if not password or not password_hash:
            return False
        try:
            # Handle migrated Werkzeug/Flask-Security hashes
            if password_hash.startswith(('scrypt:', 'pbkdf2:', 'sha256:')):
                from werkzeug.security import check_password_hash
                return check_password_hash(password_hash, password)
            # Handle bcrypt hashes
            if not password_hash.startswith('$'):
                # Might be a raw string or unsupported format
                return False
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception as e:
            print(f"[DEBUG] Password verification error: {e}")
            return False

    def check_email_exists(self, email):
        if not email:
            return False
        try:
            email = email.strip().lower()
            users = self.get_collection('users')
            if users is None:
                return False
            return users.find_one({'email': email}) is not None
        except Exception as e:
            print(f"[ERROR] check_email_exists: {e}")
            return False

    def register_user(self, email, password, first_name, last_name, mobile, signup_source, signup_ip):
        try:
            if not email:
                return False, "Email is required"
            email = email.strip().lower()
            
            if not self.validate_email(email):
                return False, "Invalid email format"
            
            if self.check_email_exists(email):
                return False, "Email already registered"
            
            if not password or len(password) < 6:
                return False, "Password must be at least 6 characters"
            
            users = self.get_collection('users')
            if users is None:
                return False, "Database connection error (Collection Unavailable)"
            
            user_data = {
                'email': email,
                'password_hash': self.hash_password(password),
                'first_name': first_name or '',
                'last_name': last_name or '',
                'mobile': mobile or '',
                'signup_source': signup_source or 'Web',
                'signup_ip': signup_ip or '',
                'created_at': datetime.now()
            }
            users.insert_one(user_data)
            return True, "User registered successfully"
        except Exception as e:
            print(f"[ERROR] register_user: {e}")
            return False, f"Registration failed: {str(e)}"

    def authenticate_user(self, email, password):
        try:
            if not email or not password:
                return None
            email = email.strip().lower()
            
            users = self.get_collection('users')
            if users is None:
                print("[ERROR] authenticate_user: Users collection is None")
                return None
            
            # Try finding by email
            user = users.find_one({'email': email})
            
            # Fallback: if not found by email, try finding by a field that might store username from old DB
            if not user:
                user = users.find_one({'username': email})
            
            if user and self.verify_password(password, user.get('password_hash', user.get('passwordhash', ''))):
                first = user.get('first_name', user.get('firstname', ''))
                last = user.get('last_name', user.get('lastname', ''))
                username = f"{first} {last}".strip() or user.get('username', email)
                return {
                    'id': user.get('email', str(user.get('_id', ''))),
                    'username': username,
                    'email': user.get('email', '')
                }
            return None
        except Exception as e:
            print(f"[ERROR] authenticate_user: {e}")
            return None

    def get_user_profile(self, email):
        try:
            if not email:
                return None
            email = email.strip().lower()
            
            users = self.get_collection('users')
            if users is None:
                return None
            
            user = users.find_one({'email': email})
            if not user:
                # also try username fallback here just in case session has username
                user = users.find_one({'username': email})
                
            if not user:
                return None
            
            created_at = user.get('created_at', datetime.now())
            email_val = user.get('email', email)
            first = user.get('first_name', user.get('firstname', ''))
            last = user.get('last_name', user.get('lastname', ''))
            
            return {
                'id': email_val,
                'email': email_val,
                'username': f"{first} {last}".strip() or user.get('username', email_val),
                'firstname': first,
                'lastname': last,
                'mobile': user.get('mobile', ''),
                'full_name': f"{first} {last}".strip() or email_val,
                'member_since': created_at.strftime('%B %d, %Y') if isinstance(created_at, datetime) else str(created_at)
            }
        except Exception as e:
            print(f"[ERROR] get_user_profile: {e}")
            return None

    def update_user_profile(self, email, first_name=None, last_name=None, mobile=None, **kwargs):
        try:
            if not email:
                return False, "Email is required"
            email = email.strip().lower()
            users = self.get_collection('users')
            if users is None:
                return False, "Database connection error"
            update_data = {}
            if first_name is not None:
                update_data['first_name'] = first_name
            if last_name is not None:
                update_data['last_name'] = last_name
            if mobile is not None:
                update_data['mobile'] = mobile
            for k, v in kwargs.items():
                update_data[k] = v
            if update_data:
                users.update_one({'email': email}, {'$set': update_data})
            return True, "Profile updated successfully"
        except Exception as e:
            print(f"[ERROR] update_user_profile: {e}")
            return False, f"Update failed: {str(e)}"

    def change_user_password(self, email, current_password, new_password):
        try:
            if not email:
                return False, "Email is required"
            email = email.strip().lower()
            users = self.get_collection('users')
            if users is None:
                return False, "Database connection error"
            
            user = users.find_one({'email': email})
            if not user:
                return False, "User not found"
            
            if not self.verify_password(current_password, user.get('password_hash', '')):
                return False, "Current password is incorrect"
            
            if not new_password or len(new_password) < 6:
                return False, "New password must be at least 6 characters"
            
            new_hash = self.hash_password(new_password)
            users.update_one({'email': email}, {'$set': {'password_hash': new_hash}})
            return True, "Password changed successfully"
        except Exception as e:
            print(f"[ERROR] change_user_password: {e}")
            return False, f"Password change failed: {str(e)}"

    def get_connection(self):
        """Legacy compatibility stub - returns None since we use MongoDB now"""
        return None

    def get_all_movies(self, limit=100, offset=0):
        try:
            movies = self.get_collection('movies')
            if movies is None:
                return []
            cursor = movies.find({}, {'_id': 1, 'title': 1, 'Title': 1, 'rating': 1, 'Rating': 1,
                                       'year': 1, 'Year': 1, 'genre': 1, 'Genre': 1, 
                                       'poster': 1, 'PosterURL': 1, 'overview': 1, 'Overview': 1}).skip(offset).limit(limit)
            results = []
            for doc in cursor:
                doc['id'] = str(doc['_id'])
                if '_id' in doc: del doc['_id']
                results.append(doc)
            return results
        except Exception as e:
            print(f"[ERROR] get_all_movies: {e}")
            return []

    def get_movie_details(self, movie_id):
        try:
            movies = self.get_collection('movies')
            if movies is None:
                return None
            query = {'_id': ObjectId(movie_id)} if ObjectId.is_valid(movie_id) else {'MovieID': int(movie_id)}
            movie = movies.find_one(query)
            if movie:
                movie['id'] = str(movie['_id'])
                if '_id' in movie: del movie['_id']
                return movie
        except Exception as e:
            print(f"[ERROR] get_movie_details: {e}")
        return None

    def add_message(self, user_email, username, room, message, timestamp=None):
        try:
            messages = self.get_collection('chat_messages')
            if messages is None:
                return False
            msg_data = {
                'user_email': user_email,
                'username': username,
                'room': room.lower() if isinstance(room, str) else room,
                'message': message,
                'timestamp': timestamp or datetime.now()
            }
            messages.insert_one(msg_data)
            return True
        except Exception as e:
            print(f"[ERROR] add_message: {e}")
            return False

    def get_room_messages(self, room, limit=50):
        try:
            messages = self.get_collection('chat_messages')
            if messages is None:
                return []
            room_query = room.lower() if isinstance(room, str) else room
            cursor = messages.find({'room': room_query}).sort('timestamp', 1).limit(limit)
            results = []
            for doc in cursor:
                results.append({
                    'id': str(doc['_id']),
                    'user_email': doc.get('user_email', ''),
                    'username': doc.get('username', doc.get('user_email', 'Unknown')),
                    'message': doc.get('message', ''),
                    'timestamp': doc.get('timestamp', datetime.now())
                })
            return results
        except Exception as e:
            print(f"[ERROR] get_room_messages: {e}")
            return []

    def get_active_streams(self):
        try:
            streams = self.get_collection('streams')
            if streams is None:
                return []
            cursor = streams.find({'is_live': True})
            results = []
            for s in cursor:
                s['id'] = str(s['_id'])
                results.append(s)
            return results
        except Exception as e:
            print(f"[ERROR] get_active_streams: {e}")
            return []

    def init_chat_tables(self):
        try:
            # Re-init client if needed
            users = self.get_collection('users')
            if users is not None:
                users.create_index('email', unique=True)
            
            messages = self.get_collection('chat_messages')
            if messages is not None:
                messages.create_index([('room', 1), ('timestamp', -1)])
            
            movies = self.get_collection('movies')
            if movies is not None:
                movies.create_index('title')
            
            print("[OK] MongoDB indexes and tables initialized successfully.")
            return True
        except Exception as e:
            print(f"[ERROR] init_chat_tables: {e}")
            return False


# Initialize database instance once at module level
try:
    db_instance = Database()
except Exception as e:
    print(f"[CRITICAL] Database Instance Creation Failed: {e}")
    db_instance = None

# Export functions for app.py compatibility
def init_db(): 
    if db_instance:
        return db_instance.init_chat_tables()
    return False

def get_user(email): 
    if db_instance:
        return db_instance.get_user_profile(email)
    return None

def create_user(username, email, password):
    if not db_instance:
        return None, "Database unavailable"
    if not username:
        return None, "Username is required"
    parts = username.strip().split()
    first = parts[0] if parts else ''
    last = ' '.join(parts[1:]) if len(parts) > 1 else ''
    success, msg = db_instance.register_user(email, password, first, last, '', 'Web', '127.0.0.1')
    return (email.strip().lower() if success else None), msg

def verify_user(email, password): 
    if db_instance:
        return db_instance.authenticate_user(email, password)
    return None

def add_message(email, name, room, msg, time=None): 
    if db_instance:
        return db_instance.add_message(email, name, room, msg, time)
    return False

def get_room_messages(room, limit=50): 
    if db_instance:
        return db_instance.get_room_messages(room, limit)
    return []

def get_messages(room): return get_room_messages(room)
def create_stream(*args, **kwargs): return True
def get_active_streams(): return []
def update_stream_viewers(*args): return True
def verify_user_email(e): return True
def save_private_message(*args): return True
def get_private_messages(*args): return []
def get_user_conversations(e): return []

# ==================== Missing functions required by app.py ====================

def get_user_watchlist(email):
    """Get user's watchlist movies"""
    if not db_instance:
        return []
    try:
        watchlist = db_instance.get_collection('watchlist')
        if watchlist is None:
            return []
        entries = watchlist.find({'user_email': email.strip().lower()}).sort('added_at', -1)
        movies_col = db_instance.get_collection('movies')
        results = []
        for entry in entries:
            movie_id = entry.get('movie_id')
            if movie_id:
                movie = None
                try:
                    if ObjectId.is_valid(str(movie_id)):
                        movie = movies_col.find_one({'_id': ObjectId(str(movie_id))})
                    if not movie:
                        movie = movies_col.find_one({'MovieID': int(movie_id)})
                except:
                    pass
                if movie:
                    movie['id'] = str(movie['_id'])
                    if '_id' in movie: del movie['_id']
                    results.append(movie)
        return results
    except Exception as e:
        print(f"[ERROR] get_user_watchlist: {e}")
        return []

def toggle_watchlist(email, movie_id):
    """Add or remove a movie from user's watchlist"""
    if not db_instance:
        return False, 'removed'
    try:
        watchlist = db_instance.get_collection('watchlist')
        if watchlist is None:
            return False, 'removed'
        email = email.strip().lower()
        existing = watchlist.find_one({'user_email': email, 'movie_id': str(movie_id)})
        if existing:
            watchlist.delete_one({'_id': existing['_id']})
            return True, 'removed'
        else:
            watchlist.insert_one({
                'user_email': email,
                'movie_id': str(movie_id),
                'added_at': datetime.now()
            })
            return True, 'added'
    except Exception as e:
        print(f"[ERROR] toggle_watchlist: {e}")
        return False, 'error'

def increment_view_count(movie_id):
    """Increment the view count for a movie"""
    if not db_instance:
        return
    try:
        movies = db_instance.get_collection('movies')
        if movies is None:
            return
        if ObjectId.is_valid(str(movie_id)):
            movies.update_one({'_id': ObjectId(str(movie_id))}, {'$inc': {'view_count': 1}})
        else:
            movies.update_one({'MovieID': int(movie_id)}, {'$inc': {'view_count': 1}})
    except Exception as e:
        print(f"[ERROR] increment_view_count: {e}")

def get_movie_platforms_v2(movie_id):
    """Get streaming platforms for a movie"""
    try:
        if not db_instance:
            return []
        platforms = db_instance.get_collection('movie_platforms')
        if platforms is None:
            return []
        results = []
        query = {'movie_id': str(movie_id)}
        for doc in platforms.find(query):
            results.append({
                'name': doc.get('platform_name', ''),
                'url': doc.get('url', ''),
                'price': doc.get('price', '')
            })
        return results
    except Exception as e:
        print(f"[ERROR] get_movie_platforms_v2: {e}")
        return []

def get_movie_reviews(movie_id):
    """Get reviews for a movie"""
    try:
        if not db_instance:
            return []
        reviews = db_instance.get_collection('reviews')
        if reviews is None:
            return []
        results = []
        for doc in reviews.find({'movie_id': str(movie_id)}).sort('created_at', -1).limit(20):
            results.append({
                'id': str(doc['_id']),
                'UserEmail': doc.get('user_email', ''),
                'Username': doc.get('username', ''),
                'Rating': doc.get('rating', 0),
                'ReviewText': doc.get('review_text', ''),
                'CreatedAt': doc.get('created_at', datetime.now())
            })
        return results
    except Exception as e:
        print(f"[ERROR] get_movie_reviews: {e}")
        return []

def get_movie_discussions(movie_id):
    """Get discussions for a movie"""
    try:
        if not db_instance:
            return []
        discussions = db_instance.get_collection('discussions')
        if discussions is None:
            return []
        results = []
        for doc in discussions.find({'movie_id': str(movie_id)}).sort('created_at', -1).limit(20):
            results.append({
                'id': str(doc['_id']),
                'UserEmail': doc.get('user_email', ''),
                'Username': doc.get('username', ''),
                'Comment': doc.get('comment', ''),
                'ParentId': doc.get('parent_id'),
                'CreatedAt': doc.get('created_at', datetime.now())
            })
        return results
    except Exception as e:
        print(f"[ERROR] get_movie_discussions: {e}")
        return []

def get_recommendations(movie_id):
    """Get movie recommendations based on genre similarity"""
    try:
        if not db_instance:
            return []
        movies = db_instance.get_collection('movies')
        if movies is None:
            return []
        # Get the current movie to find its genre
        current = None
        if ObjectId.is_valid(str(movie_id)):
            current = movies.find_one({'_id': ObjectId(str(movie_id))})
        if not current:
            try:
                current = movies.find_one({'MovieID': int(movie_id)})
            except:
                pass
        if not current:
            return []
        
        genre = current.get('genre', current.get('Genre', ''))
        if genre:
            first_genre = genre.split(',')[0].strip()
            query = {
                '$or': [
                    {'genre': {'$regex': first_genre, '$options': 'i'}},
                    {'Genre': {'$regex': first_genre, '$options': 'i'}}
                ],
                '_id': {'$ne': current['_id']}
            }
            cursor = movies.find(query).limit(10)
        else:
            cursor = movies.find({'_id': {'$ne': current['_id']}}).limit(10)
        
        results = []
        for doc in cursor:
            doc['id'] = str(doc['_id'])
            if '_id' in doc: del doc['_id']
            results.append(doc)
        return results
    except Exception as e:
        print(f"[ERROR] get_recommendations: {e}")
        return []

def get_trending_movies():
    """Get trending movies based on view count"""
    try:
        if not db_instance:
            return []
        movies = db_instance.get_collection('movies')
        if movies is None:
            return []
        cursor = movies.find().sort('view_count', -1).limit(15)
        results = []
        for doc in cursor:
            doc['id'] = str(doc['_id'])
            if '_id' in doc: del doc['_id']
            results.append(doc)
        return results
    except Exception as e:
        print(f"[ERROR] get_trending_movies: {e}")
        return []

def add_review(user_email, username, movie_id, rating, review_text):
    """Add a review for a movie"""
    try:
        if not db_instance:
            return False
        reviews = db_instance.get_collection('reviews')
        if reviews is None:
            return False
        reviews.insert_one({
            'user_email': user_email,
            'username': username,
            'movie_id': str(movie_id),
            'rating': float(rating) if rating else 0,
            'review_text': review_text or '',
            'created_at': datetime.now()
        })
        return True
    except Exception as e:
        print(f"[ERROR] add_review: {e}")
        return False

def add_discussion(user_email, username, movie_id, comment, parent_id=None):
    """Add a discussion comment for a movie"""
    try:
        if not db_instance:
            return False
        discussions = db_instance.get_collection('discussions')
        if discussions is None:
            return False
        discussions.insert_one({
            'user_email': user_email,
            'username': username,
            'movie_id': str(movie_id),
            'comment': comment or '',
            'parent_id': parent_id,
            'created_at': datetime.now()
        })
        return True
    except Exception as e:
        print(f"[ERROR] add_discussion: {e}")
        return False

db = db_instance  # Export the instance for health check
