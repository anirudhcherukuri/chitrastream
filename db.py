import pymongo
import bcrypt
import re
from datetime import datetime
import secrets
import os
from bson import ObjectId

class Database:
    def __init__(self):
        """Initialize MongoDB connection"""
        # Default to local if no URI provided
        self.uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
        self.db_name = os.environ.get('DB_NAME', 'chitrastream')
        
        try:
            self.client = pymongo.MongoClient(self.uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[self.db_name]
            # Verify connection
            self.client.admin.command('ping')
            print(f"[OK] Connected to MongoDB: {self.db_name}")
        except Exception as e:
            print(f"[ERROR] MongoDB connection failed: {e}")
            self.db = None

    def get_collection(self, name):
        if self.db is None: return None
        return self.db[name]

    def validate_email(self, email):
        # Relaxed regex to be more permissive but still catch obvious errors
        pattern = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
        return re.match(pattern, email.strip()) is not None

    def validate_mobile(self, mobile):
        if not mobile: return True
        pattern = r'^\+?[0-9]{10,15}$'
        return re.match(pattern, mobile) is not None

    def hash_password(self, password):
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password, password_hash):
        if not password or not password_hash: return False
        try:
            # Handle migrated Werkzeug/Flask-Security hashes
            if password_hash.startswith(('scrypt:', 'pbkdf2:', 'sha256:')):
                from werkzeug.security import check_password_hash
                return check_password_hash(password_hash, password)
            
            # Handle new Bcrypt hashes
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception as e:
            print(f"[DEBUG] Password verification error: {e}")
            return False

    def check_email_exists(self, email):
        if not email: return False
        email = email.strip().lower()
        users = self.get_collection('users')
        if users is None: return False
        return users.find_one({'email': email}) is not None

    def register_user(self, email, password, first_name, last_name, mobile, signup_source, signup_ip):
        if not email: return False, "Email required"
        email = email.strip().lower()
        if not self.validate_email(email): return False, "Invalid email format"
        if self.check_email_exists(email): return False, "Email already registered"
        
        users = self.get_collection('users')
        if users is None: return False, "Database connection error"
        user_data = {
            'email': email,
            'password_hash': self.hash_password(password),
            'first_name': first_name,
            'last_name': last_name,
            'mobile': mobile,
            'signup_source': signup_source,
            'signup_ip': signup_ip,
            'created_at': datetime.now()
        }
        users.insert_one(user_data)
        return True, "User registered successfully"

    def authenticate_user(self, email, password):
        if not email: return None
        email = email.strip().lower()
        users = self.get_collection('users')
        if users is None: return None
        user = users.find_one({'email': email})
        if user and self.verify_password(password, user['password_hash']):
            return {
                'id': user['email'],
                'username': f"{user['first_name']} {user['last_name']}".strip() or user['email'],
                'email': user['email']
            }
        return None

    def get_user_profile(self, email):
        if not email: return None
        email = email.strip().lower()
        users = self.get_collection('users')
        user = users.find_one({'email': email})
        if not user: return None
        
        profile = {
            'email': user['email'],
            'firstname': user.get('first_name'),
            'lastname': user.get('last_name'),
            'mobile': user.get('mobile'),
            'full_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or email,
            'member_since': user.get('created_at', datetime.now()).strftime('%B %d, %Y')
        }
        return profile

    def update_user_profile(self, email, **kwargs):
        email = email.strip().lower()
        users = self.get_collection('users')
        # Map fields to match document structure
        update_data = {}
        field_map = {'first_name': 'first_name', 'last_name': 'last_name', 'mobile': 'mobile'}
        for k, v in kwargs.items():
            if k in field_map: update_data[field_map[k]] = v
            else: update_data[k] = v
        
        users.update_one({'email': email}, {'$set': update_data})
        return True

    def get_all_movies(self, limit=100, offset=0):
        movies = self.get_collection('movies')
        if movies is None: return []
        cursor = movies.find().skip(offset).limit(limit)
        results = []
        for doc in cursor:
            doc['id'] = str(doc['_id'])
            results.append(doc)
        return results

    def get_movie_details(self, movie_id):
        movies = self.get_collection('movies')
        if movies is None: return None
        try:
            query = {'_id': ObjectId(movie_id)} if ObjectId.is_valid(movie_id) else {'MovieID': int(movie_id)}
            movie = movies.find_one(query)
            if movie:
                movie['id'] = str(movie['_id'])
                return movie
        except: pass
        return None

    def add_message(self, user_email, username, room, message, timestamp=None):
        messages = self.get_collection('chat_messages')
        if messages is None: return False
        msg_data = {
            'user_email': user_email,
            'username': username,
            'room': room.lower() if isinstance(room, str) else room,
            'message': message,
            'timestamp': timestamp or datetime.now()
        }
        messages.insert_one(msg_data)
        return True

    def get_room_messages(self, room, limit=50):
        messages = self.get_collection('chat_messages')
        room_query = room.lower() if isinstance(room, str) else room
        cursor = messages.find({'room': room_query}).sort('timestamp', -1).limit(limit)
        
        results = []
        for doc in cursor:
            results.append({
                'id': str(doc['_id']),
                'user_email': doc['user_email'],
                'username': doc.get('username', doc['user_email']),
                'message': doc['message'],
                'timestamp': doc['timestamp']
            })
        return results

    def get_active_streams(self):
        streams = self.get_collection('streams')
        cursor = streams.find({'is_live': True})
        results = []
        for s in cursor:
            s['id'] = str(s['_id'])
            results.append(s)
        return results

    def init_chat_tables(self):
        # Mongo creates collections on first insert, but we can create indexes
        users = self.get_collection('users')
        users.create_index('email', unique=True)
        
        messages = self.get_collection('chat_messages')
        messages.create_index([('room', 1), ('timestamp', -1)])
        
        movies = self.get_collection('movies')
        movies.create_index('title')
        print("[OK] MongoDB indexes initialized.")
        return True

# Initialize database instance
db_instance = Database()

# Export functions for app.py compatibility
def init_db(): return db_instance.init_chat_tables()
def get_user(email): return db_instance.get_user_profile(email)
def create_user(username, email, password):
    if not username: return None, "Username required"
    parts = username.split()
    first = parts[0]; last = ' '.join(parts[1:]) if len(parts) > 1 else ''
    success, msg = db_instance.register_user(email, password, first, last, '', 'Web', '127.0.0.1')
    return (email if success else None), msg

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
db = db_instance # Export the instance
