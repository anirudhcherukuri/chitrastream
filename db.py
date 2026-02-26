import pymongo
import bcrypt
import re
from datetime import datetime
import os
from bson import ObjectId

class Database:
    def __init__(self):
        """Initialize MongoDB connection"""
        self.uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
        self.db_name = os.environ.get('DB_NAME', 'chitrastream')
        self.db = None
        self.client = None
        
        try:
            self.client = pymongo.MongoClient(self.uri, serverSelectionTimeoutMS=10000)
            self.db = self.client[self.db_name]
            self.client.admin.command('ping')
            print(f"[OK] Connected to MongoDB: {self.db_name}")
        except Exception as e:
            print(f"[ERROR] MongoDB connection failed: {e}")
            self.db = None

    def get_collection(self, name):
        if self.db is None:
            return None
        return self.db[name]

    def validate_email(self, email):
        if not email:
            return False
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
                return False, "Database connection error - please try again"
            
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
                return None
            
            user = users.find_one({'email': email})
            if user and self.verify_password(password, user.get('password_hash', '')):
                first = user.get('first_name', '')
                last = user.get('last_name', '')
                username = f"{first} {last}".strip() or user.get('username', email)
                return {
                    'id': user['email'],
                    'username': username,
                    'email': user['email']
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
                return None
            
            created_at = user.get('created_at', datetime.now())
            return {
                'id': user['email'],
                'email': user['email'],
                'username': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or email,
                'firstname': user.get('first_name', ''),
                'lastname': user.get('last_name', ''),
                'mobile': user.get('mobile', ''),
                'full_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or email,
                'member_since': created_at.strftime('%B %d, %Y') if isinstance(created_at, datetime) else str(created_at)
            }
        except Exception as e:
            print(f"[ERROR] get_user_profile: {e}")
            return None

    def update_user_profile(self, email, **kwargs):
        try:
            if not email:
                return False
            email = email.strip().lower()
            users = self.get_collection('users')
            if users is None:
                return False
            update_data = {}
            field_map = {'first_name': 'first_name', 'last_name': 'last_name', 'mobile': 'mobile'}
            for k, v in kwargs.items():
                if k in field_map:
                    update_data[field_map[k]] = v
                else:
                    update_data[k] = v
            users.update_one({'email': email}, {'$set': update_data})
            return True
        except Exception as e:
            print(f"[ERROR] update_user_profile: {e}")
            return False

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
                del doc['_id']
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
                del movie['_id']
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
            users = self.get_collection('users')
            if users is not None:
                users.create_index('email', unique=True)
            
            messages = self.get_collection('chat_messages')
            if messages is not None:
                messages.create_index([('room', 1), ('timestamp', -1)])
            
            movies = self.get_collection('movies')
            if movies is not None:
                movies.create_index('title')
            
            print("[OK] MongoDB indexes initialized.")
            return True
        except Exception as e:
            print(f"[ERROR] init_chat_tables: {e}")
            return False


# Initialize database instance
db_instance = Database()

# Export functions for app.py compatibility
def init_db(): return db_instance.init_chat_tables()
def get_user(email): return db_instance.get_user_profile(email)
def create_user(username, email, password):
    if not username:
        return None, "Username is required"
    parts = username.strip().split()
    first = parts[0] if parts else ''
    last = ' '.join(parts[1:]) if len(parts) > 1 else ''
    success, msg = db_instance.register_user(email, password, first, last, '', 'Web', '127.0.0.1')
    return (email.strip().lower() if success else None), msg

def verify_user(email, password): return db_instance.authenticate_user(email, password)
def add_message(email, name, room, msg, time=None): return db_instance.add_message(email, name, room, msg, time)
def get_room_messages(room, limit=50): return db_instance.get_room_messages(room, limit)
def get_messages(room): return get_room_messages(room)
def create_stream(*args, **kwargs): return True
def get_active_streams(): return []
def update_stream_viewers(*args): return True
def verify_user_email(e): return True
def save_private_message(*args): return True
def get_private_messages(*args): return []
def get_user_conversations(e): return []
db = db_instance  # Export the instance
