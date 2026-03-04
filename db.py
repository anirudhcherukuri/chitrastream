import bcrypt
import re
import json
import os
from datetime import datetime

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore

class Database:
    def __init__(self):
        """Initialize Firebase Firestore connection"""
        self.db = None
        
        try:
            # Check if Firebase app already initialized
            try:
                self.app = firebase_admin.get_app()
            except ValueError:
                # Initialize Firebase with service account
                firebase_creds = os.environ.get('FIREBASE_CREDENTIALS', '')
                
                if firebase_creds:
                    # Parse JSON from environment variable
                    cred_dict = json.loads(firebase_creds)
                    cred = credentials.Certificate(cred_dict)
                else:
                    # Try loading from file (local development)
                    cred_file = os.environ.get('FIREBASE_CREDENTIALS_FILE', 'firebase-credentials.json')
                    if os.path.exists(cred_file):
                        cred = credentials.Certificate(cred_file)
                    else:
                        print("[ERROR] No Firebase credentials found!")
                        print("  Set FIREBASE_CREDENTIALS env var (JSON string)")
                        print("  Or place firebase-credentials.json in project root")
                        self.db = None
                        return
                
                self.app = firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            print("[INFO] Firebase Firestore initialized successfully!")
            
        except Exception as e:
            print(f"[ERROR] Firebase initialization failed: {e}")
            self.db = None

    def get_collection(self, name):
        """Get a Firestore collection reference"""
        if self.db is None:
            return None
        return self.db.collection(name)

    # ==================== Password Hashing ====================
    
    def hash_password(self, password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password, password_hash):
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception:
            return False

    # ==================== User Authentication ====================
    
    def register_user(self, email, password, first_name, last_name, mobile, signup_method='Web', ip_address=''):
        try:
            if not email or not password:
                return False, "Email and password are required"
            
            email = email.strip().lower()
            
            # Validate email format
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                return False, "Invalid email format"
            
            users = self.get_collection('users')
            if users is None:
                return False, "Database connection error"
            
            # Check if user already exists
            existing = users.where('email', '==', email).limit(1).get()
            if len(list(existing)) > 0:
                return False, "Email already registered"
            
            # Create user document
            password_hash = self.hash_password(password)
            user_data = {
                'email': email,
                'password_hash': password_hash,
                'first_name': first_name or '',
                'last_name': last_name or '',
                'mobile': mobile or '',
                'signup_method': signup_method,
                'ip_address': ip_address,
                'created_at': datetime.now().strftime('%B %d, %Y'),
                'is_active': True
            }
            
            users.document(email).set(user_data)
            print(f"[OK] User registered: {email}")
            return True, "Registration successful"
            
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
                return None
            
            doc = users.document(email).get()
            if not doc.exists:
                return None
            
            user = doc.to_dict()
            if self.verify_password(password, user.get('password_hash', '')):
                return {
                    'id': email,
                    'email': user.get('email', email),
                    'username': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or email,
                    'first_name': user.get('first_name', ''),
                    'last_name': user.get('last_name', '')
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
            
            doc = users.document(email).get()
            if not doc.exists:
                return None
            
            user = doc.to_dict()
            full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            
            # Safe member_since handling
            ms = user.get('created_at', 'Unknown')
            if hasattr(ms, 'strftime'):
                ms = ms.strftime('%B %d, %Y')
            elif hasattr(ms, 'isoformat'):
                ms = ms.isoformat()
            
            return {
                'id': email,
                'email': user.get('email', email),
                'full_name': full_name or email,
                'first_name': user.get('first_name', ''),
                'last_name': user.get('last_name', ''),
                'mobile': user.get('mobile', ''),
                'member_since': str(ms),
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
                users.document(email).update(update_data)
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
            
            doc = users.document(email).get()
            if not doc.exists:
                return False, "User not found"
            
            user = doc.to_dict()
            if not self.verify_password(current_password, user.get('password_hash', '')):
                return False, "Current password is incorrect"
            
            if not new_password or len(new_password) < 6:
                return False, "New password must be at least 6 characters"
            
            new_hash = self.hash_password(new_password)
            users.document(email).update({'password_hash': new_hash})
            return True, "Password changed successfully"
        except Exception as e:
            print(f"[ERROR] change_user_password: {e}")
            return False, f"Password change failed: {str(e)}"

    def get_connection(self):
        """Legacy compatibility stub"""
        return None

    def _normalize_movie(self, movie_dict, doc_id):
        if not movie_dict:
            return None
        # Ensure ID always exists
        movie_dict['id'] = str(doc_id)
        
        # Normalize fields for frontend (lowercase from migration to casing expected by app)
        if 'title' in movie_dict and 'Title' not in movie_dict:
            movie_dict['Title'] = movie_dict['title']
        if 'year' in movie_dict and 'Year' not in movie_dict:
            movie_dict['Year'] = movie_dict['year']
        if 'plot' in movie_dict and 'Plot' not in movie_dict:
            movie_dict['Plot'] = movie_dict['plot']
        if 'genre' in movie_dict and 'Genre' not in movie_dict:
            movie_dict['Genre'] = movie_dict['genre']
        if 'director' in movie_dict and 'Director' not in movie_dict:
            movie_dict['Director'] = movie_dict['director']
        if 'cast' in movie_dict and 'Cast' not in movie_dict:
            movie_dict['Cast'] = movie_dict['cast']
        if 'rating' in movie_dict and 'Rating' not in movie_dict:
            movie_dict['Rating'] = movie_dict['rating']
        
        # Consistent IDs
        movie_dict['MovieID'] = str(doc_id)
        movie_dict['id'] = str(doc_id)

        # Poster logic
        p = movie_dict.get('poster') or movie_dict.get('PosterURL') or movie_dict.get('posterurl')
        if p:
            movie_dict['PosterURL'] = p
            movie_dict['poster'] = p
        
        return movie_dict

    # ==================== Movies ====================
    
    def get_all_movies(self, limit=100, offset=0):
        try:
            movies = self.get_collection('movies')
            if movies is None:
                return []
            docs = movies.limit(limit).offset(offset).get()
            results = []
            for doc in docs:
                movie = self._normalize_movie(doc.to_dict(), doc.id)
                if movie:
                    results.append(movie)
            return results
        except Exception as e:
            print(f"[ERROR] get_all_movies: {e}")
            return []

    def get_movie_details(self, movie_id):
        try:
            movies = self.get_collection('movies')
            if movies is None:
                return None
            doc = movies.document(str(movie_id)).get()
            if doc.exists:
                return self._normalize_movie(doc.to_dict(), doc.id)
            return None
        except Exception as e:
            print(f"[ERROR] get_movie_details: {e}")
            return None

    # ==================== Chat ====================
    
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
            messages.add(msg_data)
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
            docs = messages.where('room', '==', room_query).order_by('timestamp').limit(limit).get()
            results = []
            for doc in docs:
                data = doc.to_dict()
                ts = data.get('timestamp', datetime.now())
                if hasattr(ts, 'isoformat'):
                    ts = ts.isoformat()
                results.append({
                    'id': doc.id,
                    'user_email': data.get('user_email', ''),
                    'username': data.get('username', 'Unknown'),
                    'message': data.get('message', ''),
                    'timestamp': str(ts)
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
            docs = streams.where('is_live', '==', True).get()
            results = []
            for doc in docs:
                s = doc.to_dict()
                s['id'] = doc.id
                results.append(s)
            return results
        except Exception as e:
            print(f"[ERROR] get_active_streams: {e}")
            return []

    def init_chat_tables(self):
        """No explicit index creation needed for Firestore - indexes are automatic"""
        print("[OK] Firebase Firestore ready (indexes are automatic)")
        return True


# ==================== Initialize Database ====================
try:
    db_instance = Database()
except Exception as e:
    print(f"[CRITICAL] Database Instance Creation Failed: {e}")
    db_instance = None

# ==================== Export Functions for app.py ====================

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

# ==================== Movie & Watchlist Functions ====================

def get_user_watchlist(email):
    if not db_instance:
        return []
    try:
        watchlist = db_instance.get_collection('watchlist')
        if watchlist is None:
            return []
        docs = watchlist.where('user_email', '==', email.strip().lower()).order_by('added_at', direction=firestore.Query.DESCENDING).get()
        movies_col = db_instance.get_collection('movies')
        results = []
        for entry in docs:
            data = entry.to_dict()
            movie_id = data.get('movie_id')
            if movie_id and movies_col:
                movie_doc = movies_col.document(str(movie_id)).get()
                if movie_doc.exists:
                    movie = db_instance._normalize_movie(movie_doc.to_dict(), movie_doc.id)
                    if movie:
                        results.append(movie)
        return results
    except Exception as e:
        print(f"[ERROR] get_user_watchlist: {e}")
        return []

def toggle_watchlist(email, movie_id):
    if not db_instance:
        return False, 'removed'
    try:
        watchlist = db_instance.get_collection('watchlist')
        if watchlist is None:
            return False, 'removed'
        email = email.strip().lower()
        
        # Check if already in watchlist
        existing = watchlist.where('user_email', '==', email).where('movie_id', '==', str(movie_id)).limit(1).get()
        existing_list = list(existing)
        
        if len(existing_list) > 0:
            # Remove from watchlist
            watchlist.document(existing_list[0].id).delete()
            return True, 'removed'
        else:
            # Add to watchlist
            watchlist.add({
                'user_email': email,
                'movie_id': str(movie_id),
                'added_at': datetime.now()
            })
            return True, 'added'
    except Exception as e:
        print(f"[ERROR] toggle_watchlist: {e}")
        return False, 'error'

def increment_view_count(movie_id):
    if not db_instance:
        return
    try:
        movies = db_instance.get_collection('movies')
        if movies is None:
            return
        doc_ref = movies.document(str(movie_id))
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            # Handle possible field name variations
            current = data.get('view_count') or data.get('viewcount') or 0
            if not isinstance(current, (int, float)): current = 0
            doc_ref.update({
                'view_count': int(current) + 1,
                'viewcount': int(current) + 1 # sync both for safety
            })
    except Exception as e:
        print(f"[ERROR] increment_view_count: {e}")

def get_movie_platforms_v2(movie_id):
    try:
        if not db_instance:
            return []
        platforms = db_instance.get_collection('movie_platforms')
        if platforms is None:
            return []
        docs = platforms.where('movie_id', '==', str(movie_id)).get()
        results = []
        for doc in docs:
            data = doc.to_dict()
            results.append({
                'name': data.get('platform_name', ''),
                'url': data.get('url', ''),
                'price': data.get('price', '')
            })
        return results
    except Exception as e:
        print(f"[ERROR] get_movie_platforms_v2: {e}")
        return []

def get_movie_reviews(movie_id):
    try:
        if not db_instance:
            return []
        reviews = db_instance.get_collection('reviews')
        if reviews is None:
            return []
        docs = reviews.where('movie_id', '==', str(movie_id)).order_by('created_at', direction=firestore.Query.DESCENDING).limit(20).get()
        results = []
        for doc in docs:
            data = doc.to_dict()
            ts = data.get('created_at', datetime.now())
            if hasattr(ts, 'isoformat'):
                ts = ts.isoformat()
            results.append({
                'id': doc.id,
                'UserEmail': data.get('user_email', ''),
                'Username': data.get('username', ''),
                'Rating': data.get('rating', 0),
                'ReviewText': data.get('review_text', ''),
                'CreatedAt': str(ts)
            })
        return results
    except Exception as e:
        print(f"[ERROR] get_movie_reviews: {e}")
        return []

def get_movie_discussions(movie_id):
    try:
        if not db_instance:
            return []
        discussions = db_instance.get_collection('discussions')
        if discussions is None:
            return []
        docs = discussions.where('movie_id', '==', str(movie_id)).order_by('created_at', direction=firestore.Query.DESCENDING).limit(20).get()
        results = []
        for doc in docs:
            data = doc.to_dict()
            ts = data.get('created_at', datetime.now())
            if hasattr(ts, 'isoformat'):
                ts = ts.isoformat()
            results.append({
                'id': doc.id,
                'UserEmail': data.get('user_email', ''),
                'Username': data.get('username', ''),
                'Comment': data.get('comment', ''),
                'ParentId': data.get('parent_id'),
                'CreatedAt': str(ts)
            })
        return results
    except Exception as e:
        print(f"[ERROR] get_movie_discussions: {e}")
        return []

def get_recommendations(movie_id):
    try:
        if not db_instance:
            return []
        movies = db_instance.get_collection('movies')
        if movies is None:
            return []
        # Get random movies as recommendations (Firestore doesn't support regex)
        docs = movies.limit(10).get()
        results = []
        for doc in docs:
            if doc.id != str(movie_id):
                movie = db_instance._normalize_movie(doc.to_dict(), doc.id)
                if movie:
                    results.append(movie)
        return results
    except Exception as e:
        print(f"[ERROR] get_recommendations: {e}")
        return []

def get_trending_movies():
    try:
        if not db_instance:
            return []
        movies = db_instance.get_collection('movies')
        if movies is None:
            return []
        docs = movies.order_by('view_count', direction=firestore.Query.DESCENDING).limit(15).get()
        results = []
        for doc in docs:
            movie = db_instance._normalize_movie(doc.to_dict(), doc.id)
            if movie:
                results.append(movie)
        return results
    except Exception as e:
        print(f"[ERROR] get_trending_movies: {e}")
        return []

def add_review(user_email, username, movie_id, rating, review_text):
    try:
        if not db_instance:
            return False
        reviews = db_instance.get_collection('reviews')
        if reviews is None:
            return False
        reviews.add({
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
    try:
        if not db_instance:
            return False
        discussions = db_instance.get_collection('discussions')
        if discussions is None:
            return False
        discussions.add({
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

db = db_instance

def get_all_movies(limit=100, offset=0):
    return db_instance.get_all_movies(limit, offset)

def get_movie_details(movie_id):
    return db_instance.get_movie_details(movie_id)
