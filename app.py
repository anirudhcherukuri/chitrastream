from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from functools import wraps
import os
import secrets

# Load environment variables from .env file (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, use system environment variables

# Import database functions
from db import (
    init_db, get_user, create_user, verify_user, 
    add_message, get_messages, get_room_messages,
    create_stream, get_active_streams, update_stream_viewers,
    verify_user_email, save_private_message, get_private_messages,
    get_user_conversations, db
)

app = Flask(__name__, 
            static_folder='frontend/dist',
            static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Enable CORS for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:5173"])

# Initialize Socket.IO with threading mode (FIXED)
socketio = SocketIO(app, 
                   cors_allowed_origins="*",
                   async_mode='threading',
                   ping_timeout=60,
                   ping_interval=25,
                   logger=True,
                   engineio_logger=True)


# Store active users and their current rooms/streams
active_users = {}
active_streams = {}
typing_users = {}

# ==================== Helper Functions ====================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session and 'guest_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    if 'user_id' in session:
        return get_user(email=session['user_id'])
    
    # Check for guest session
    if 'guest_id' in session:
        return {
            'id': session['guest_id'],
            'username': session.get('guest_name', 'Guest'),
            'email': session['guest_id']
        }
        
    return None

# ==================== Authentication Routes ====================

# ==================== Authentication Routes (Redundant for React) ====================
# These are kept commented for reference but could be removed as we use /api/* routes now.

from flask import send_from_directory

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# ==================== Main Routes (React will handle these via routing) ====================
# We keep these only if we want Flask to serve the React index.html in production.
# For now, we are using Vite for frontend development.

# ==================== API Routes ====================

@app.route('/api/auth/signup', methods=['POST'])
def api_signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'All fields are required!'}), 400
    
    # Check if user exists
    existing_user = get_user(email=email)
    if existing_user:
        return jsonify({'success': False, 'message': 'Email already registered!'}), 400
    
    # Create user
    user_id = create_user(username, email, password)
    if user_id:
        session['user_id'] = user_id
        session['username'] = username
        session.permanent = True
        return jsonify({'success': True, 'user': {'id': user_id, 'username': username, 'email': email}})
    else:
        return jsonify({'success': False, 'message': 'Error creating account. Try again.'}), 500

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = verify_user(email, password)
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session.permanent = True
        return jsonify({'success': True, 'user': {'id': user['id'], 'username': user['username'], 'email': user['email']}})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password!'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/status')
def api_auth_status():
    user = get_current_user()
    if user:
        return jsonify({
            'isAuthenticated': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        })
    return jsonify({'isAuthenticated': False})

@app.route('/api/profile')
def api_profile():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    from db import db as database
    profile_data = database.get_user_profile(user['email'])
    
    return jsonify({
        'success': True,
        'full_name': profile_data.get('full_name', user['username']),
        'email': user['email'],
        'mobile': profile_data.get('mobile'),
        'member_since': profile_data.get('member_since'),
        'days_member': profile_data.get('days_member', 0)
    })

@app.route('/api/profile/update', methods=['POST'])
def api_profile_update():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    mobile = data.get('mobile')
    
    from db import db as database
    success, message = database.update_user_profile(
        user['email'], 
        first_name, 
        last_name, 
        mobile
    )
    
    return jsonify({'success': success, 'message': message})

@app.route('/api/change-password', methods=['POST'])
def api_change_password():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.json
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    from db import db as database
    success, message = database.change_user_password(
        user['email'],
        current_password,
        new_password
    )
    
    return jsonify({'success': success, 'message': message})



@app.route('/api/current_user')
def current_user():
    user = get_current_user()
    if user:
        return jsonify({
            'username': user['username'],
            'user_id': user['id'],
            'email': user['email'],
            'is_authenticated': True
        })
    return jsonify({'is_authenticated': False})

@app.route('/api/movies')
@login_required
def get_movies():
    print(f"DEBUG: Fetching movies for user: {session.get('user_id') or session.get('guest_id')}")
    try:
        movies = db.get_all_movies(limit=3000)
        print(f"DEBUG: Found {len(movies)} movies")
        return jsonify(movies)
    except Exception as e:
        print(f"ERROR fetching movies: {e}")
        return jsonify([]), 500

@app.route('/api/movies/<int:movie_id>')
@login_required
def get_movie(movie_id):
    from db import (
        increment_view_count, get_movie_platforms_v2, 
        get_movie_reviews, get_movie_discussions, get_recommendations
    )
    
    movie = db.get_movie_details(movie_id)
    if movie:
        # Increment view count for trending logic
        increment_view_count(movie_id)
        
        # Get advanced movie features
        movie['platforms'] = get_movie_platforms_v2(movie_id)
        
        # MOCK PLATFORMS if empty (for demonstration)
        if not movie['platforms']:
            movie['platforms'] = [
                {'name': 'Netflix', 'url': 'https://www.netflix.com', 'price': 'Subscription'},
                {'name': 'Amazon Prime', 'url': 'https://www.primevideo.com', 'price': 'Rent ₹149'}
            ]
            
        movie['reviews'] = get_movie_reviews(movie_id)
        movie['discussions'] = get_movie_discussions(movie_id)
        movie['recommendations'] = get_recommendations(movie_id)
        
        # Calculate "Is It Worth Watching?" Score
        movie_rating = float(movie.get('rating') or 0)
        user_ratings = [float(r.get('Rating') or 0) for r in movie.get('reviews', [])]
        avg_user = sum(user_ratings)/len(user_ratings) if user_ratings else movie_rating
        
        # Discussion bonus (max 10 points)
        discussions = movie.get('discussions', [])
        bonus = min(10, len(discussions) * 1)
        
        # Formula: 45% IMDb, 45% Users, 10% Discussion activity
        worth_score = (movie_rating * 4.5) + (avg_user * 4.5) + bonus
        movie['worth_score'] = min(100, int(worth_score))
        
        # Check if in user watchlist
        user = get_current_user()
        from db import db as database
        movie['in_watchlist'] = False
        if user:
            conn = database.get_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1 FROM UserWatchlist WHERE UserEmail = ? AND MovieId = ?", (user['email'], movie_id))
                if cursor.fetchone():
                    movie['in_watchlist'] = True
                conn.close()
        
        return jsonify(movie)
    return jsonify({'success': False, 'message': 'Movie not found'}), 404

@app.route('/api/watchlist', methods=['GET', 'POST'])
@login_required
def api_watchlist():
    user = get_current_user()
    from db import get_user_watchlist, toggle_watchlist
    
    if request.method == 'GET':
        watchlist = get_user_watchlist(user['email'])
        return jsonify(watchlist)
    
    data = request.json
    movie_id = data.get('movie_id')
    if not movie_id:
        return jsonify({'success': False, 'message': 'Movie ID required'}), 400
        
    success, action = toggle_watchlist(user['email'], movie_id)
    return jsonify({'success': success, 'action': action})

@app.route('/api/movies/trending')
@login_required
def api_trending():
    from db import get_trending_movies
    trending = get_trending_movies()
    return jsonify(trending)

@app.route('/api/movies/<int:movie_id>/reviews', methods=['POST'])
@login_required
def api_add_review(movie_id):
    user = get_current_user()
    data = request.json
    rating = data.get('rating')
    text = data.get('review_text')
    
    from db import add_review
    success = add_review(user['email'], user['username'], movie_id, rating, text)
    return jsonify({'success': success})

@app.route('/api/movies/<int:movie_id>/discussions', methods=['POST'])
@login_required
def api_add_discussion(movie_id):
    user = get_current_user()
    data = request.json
    comment = data.get('comment')
    parent_id = data.get('parent_id')
    
    from db import add_discussion
    success = add_discussion(user['email'], user['username'], movie_id, comment, parent_id)
    return jsonify({'success': success})

@app.route('/api/production-assistant', methods=['POST'])
def production_assistant():
    """AI Production Assistant - Suggests budget and locations based on plot using OpenAI"""
    data = request.json
    plot = data.get('plot', '')
    
    if not plot:
        return jsonify({'success': False, 'error': 'Plot is required'})
    
    # Try OpenAI first, fallback to keyword-based if it fails
    try:
        # Try to import and use OpenAI
        from openai import OpenAI
        
        # Get API key from environment variable
        api_key = os.environ.get('OPENAI_API_KEY')
        print(f"DEBUG: API Key found: {'Yes' if api_key else 'No'}") # Debug log
        
        if not api_key:
            raise ValueError("No API key found, using fallback")
        
        client = OpenAI(api_key=api_key)
        
        # Use OpenAI ChatGPT (gpt-4o-mini) for superior intelligence
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are 'ChatGPT Cinema Assistant', a professional film production consultant. You specialize in analyzing movie plots and providing highly realistic, detailed budget estimates (in Crores INR and USD) and specific Indian filming location suggestions with justification."},
                {"role": "user", "content": f"""As my Film Production Consultant, analyze this movie plot and provide a detailed feasibility report:
                
Plot: {plot}

Please include:
1. BUDGET: Detailed budget range in INR (Crores) and USD.
2. LOCATIONS: 3-5 specific Indian cities/states best suited for this story.
"""}
            ],
            temperature=0.8,
            max_tokens=600
        )
        
        ai_response = response.choices[0].message.content
        budget, locations = parse_ai_response(ai_response)
        
        return jsonify({
            'success': True,
            'estimated_budget': budget,
            'filing_locations': locations,
            'production_strategy': "Utilize local incentives and focus on realistic set design to optimize the projected budget."
        })
        
    except Exception as e:
        # Any error (no OpenAI, no API key, network issue, etc.) - use fallback
        print(f"Using fallback system. Reason: {e}")
        budget = estimate_budget_fallback(plot)
        locations = suggest_locations_fallback(plot)
        
        return jsonify({
            'success': True,
            'estimated_budget': budget,
            'filing_locations': locations,
            'production_strategy': "Review plot density and consider shooting in tax-rebate friendly states like Uttarakhand or Uttar Pradesh."
        })

def parse_ai_response(response):
    """Parse OpenAI response into budget and locations"""
    lines = response.strip().split('\n')
    budget = ""
    locations = ""
    
    current_section = None
    for line in lines:
        line = line.strip()
        if line.startswith('BUDGET:'):
            current_section = 'budget'
            budget = line.replace('BUDGET:', '').strip()
        elif line.startswith('LOCATIONS:'):
            current_section = 'locations'
            locations = line.replace('LOCATIONS:', '').strip()
        elif current_section == 'budget' and line:
            budget += '\n' + line
        elif current_section == 'locations' and line:
            locations += '\n' + line
    
    # Fallback if no tags are found
    if not budget and not locations:
        return "", response.strip()
    
    return budget, locations

def estimate_budget_fallback(plot):
    """Fallback: Estimate budget based on plot keywords"""
    plot_lower = plot.lower()
    
    high_budget_keywords = ['superhero', 'space', 'alien', 'war', 'battle', 'explosion', 'cgi', 'visual effects', 
                           'blockbuster', 'epic', 'international', 'historical epic', 'sci-fi', 'fantasy', 
                           'dragon', 'monster', 'apocalypse', 'destruction', 'army']
    
    medium_budget_keywords = ['mystery', 'thriller', 'detective', 'crime', 'action', 'adventure', 'heist',
                             'chase', 'investigation', 'suspense', 'spy', 'supernatural']
    
    low_budget_keywords = ['drama', 'romance', 'indie', 'documentary', 'conversation', 'relationship',
                          'family', 'small town', 'intimate', 'character study', 'dialogue']
    
    high_count = sum(1 for keyword in high_budget_keywords if keyword in plot_lower)
    medium_count = sum(1 for keyword in medium_budget_keywords if keyword in plot_lower)
    
    if high_count >= 2 or 'blockbuster' in plot_lower:
        return "₹50 Crores - ₹200 Crores+ ($6M - $25M+)\nLarge scale production with extensive VFX, multiple locations, and star cast"
    elif high_count >= 1 or medium_count >= 3:
        return "₹10 Crores - ₹50 Crores ($1.2M - $6M)\nMedium scale production with good production values and moderate VFX"
    elif medium_count >= 1:
        return "₹2 Crores - ₹10 Crores ($250K - $1.2M)\nMid-budget production focusing on story and performances"
    else:
        return "₹20 Lakhs - ₹2 Crores ($25K - $250K)\nIndependent/low-budget production with minimal crew and locations"

def suggest_locations_fallback(plot):
    """Fallback: Suggest filming locations based on plot keywords"""
    plot_lower = plot.lower()
    suggestions = []
    
    location_keywords = {
        'coastal|beach|ocean|sea|port': '🏖️ Coastal Areas: Goa, Kerala backwaters, Andaman Islands, Mumbai beaches',
        'mountain|himalaya|snow|peak|trek': '⛰️ Mountains: Himachal Pradesh, Uttarakhand, Kashmir, Ladakh',
        'desert|sand|arid|rajasthan': '🏜️ Deserts: Rajasthan (Jaisalmer, Bikaner), Gujarat (Rann of Kutch)',
        'urban|city|metropolitan|modern': '🏙️ Urban: Mumbai, Delhi, Bangalore, Hyderabad studios and streets',
        'village|rural|countryside|farm': '🌾 Rural: Punjab villages, Maharashtra countryside, Tamil Nadu villages',
        'palace|royal|kingdom|fort': '🏰 Historical: Rajasthan palaces, Mysore Palace, Red Fort Delhi',
        'forest|jungle|wildlife|nature': '🌳 Forests: Kerala forests, Jim Corbett, Western Ghats',
        'spiritual|temple|religious|ashram': '🛕 Spiritual: Varanasi, Rishikesh, Tirupati, Amritsar',
        'college|university|school|campus': '🎓 Educational: DU campus Delhi, IIT campuses, Pune universities',
        'slum|poverty|struggle': '🏘️ Urban Poor: Dharavi Mumbai, Delhi slums (with permissions)'
    }
    
    for keywords, location in location_keywords.items():
        if any(kw in plot_lower for kw in keywords.split('|')):
            suggestions.append(location)
    
    if not suggestions:
        suggestions = [
            '🎬 Film Cities: Ramoji Film City (Hyderabad), Film City Mumbai',
            '🏙️ Major Cities: Mumbai, Delhi, Bangalore for urban scenes',
            '🌄 Versatile Locations: Goa, Kerala for diverse settings'
        ]
    
    return '\n'.join(suggestions[:5])

@app.route('/api/messages/<room>')
@login_required
def api_get_messages(room):
    messages = get_room_messages(room, limit=50)
    return jsonify(messages)

@app.route('/api/streams')
@login_required
def api_get_streams():
    streams = get_active_streams()
    return jsonify(streams)

@app.route('/api/create_stream', methods=['POST'])
@login_required
def api_create_stream():
    data = request.json
    user = get_current_user()
    
    stream_id = create_stream(
        host_id=user['id'],
        host_name=user['username'],
        title=data.get('title'),
        movie_id=data.get('movie_id'),
        description=data.get('description', '')
    )
    
    if stream_id:
        return jsonify({'success': True, 'stream_id': stream_id})
    return jsonify({'success': False}), 400

# ==================== Socket.IO Events ====================

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    user = get_current_user()
    
    if user:
        # Store user connection
        active_users[request.sid] = {
            'user_id': user['id'],
            'username': user['username'],
            'connected_at': datetime.now().isoformat()
        }
            
        # Send connection confirmation
        emit('connection_success', {
            'user_id': user['id'],
            'username': user['username']
        })
        
        # Broadcast online user count
        emit('online_users_update', {
            'count': len(active_users)
        }, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    
    if request.sid in active_users:
        user_info = active_users[request.sid]
        
        # Remove from typing users
        for room in list(typing_users.keys()):
            if request.sid in typing_users[room]:
                typing_users[room].discard(request.sid)
                emit('user_stop_typing', {
                    'username': user_info['username']
                }, room=room)
        
        # Remove from active users
        del active_users[request.sid]
        
        # Update online count
        emit('online_users_update', {
            'count': len(active_users)
        }, broadcast=True)

# ==================== Chat Room Events ====================

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room', 'general')
    user = get_current_user()
    
    if not user:
        emit('error', {'message': 'Not authenticated'})
        return
    
    # Join the Socket.IO room
    join_room(room)
    
    # Update user's current room
    if request.sid in active_users:
        active_users[request.sid]['current_room'] = room
    
    # Get recent messages
    messages = get_room_messages(room, limit=5000)
    emit('room_history', {'messages': messages})
    
    # Notify room members
    emit('user_joined', {
        'username': user['username'],
        'user_id': user['id'],
        'timestamp': datetime.now().isoformat()
    }, room=room)
    
    # Send user list
    room_users = [
        {
            'username': active_users[sid]['username'],
            'email': active_users[sid]['user_id']
        }
        for sid in active_users 
        if active_users[sid].get('current_room') == room
    ]
    emit('room_users_update', {
        'users': room_users,
        'count': len(room_users)
    }, room=room)
    
    print(f"{user['username']} joined room: {room}")

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('room', 'general')
    user = get_current_user()
    
    if not user:
        return
    
    leave_room(room)
    
    # Update user's current room
    if request.sid in active_users:
        active_users[request.sid]['current_room'] = None
    
    # Notify room members
    emit('user_left', {
        'username': user['username'],
        'timestamp': datetime.now().isoformat()
    }, room=room)
    
    # Update room user count
    room_users = [
        {
            'username': active_users[sid]['username'],
            'email': active_users[sid]['user_id']
        }
        for sid in active_users 
        if active_users[sid].get('current_room') == room
    ]
    emit('room_users_update', {
        'users': room_users,
        'count': len(room_users)
    }, room=room)
    
    print(f"{user['username']} left room: {room}")

@socketio.on('send_message')
def handle_send_message(data):
    room = data.get('room') or 'general'
    message = data.get('message', '').strip()
    user = get_current_user()
    
    if not user or not message:
        return
    
    # Validate message length
    if len(message) > 5000:
        emit('error', {'message': 'Message too long (max 5000 characters)'})
        return
    
    # Create message object
    timestamp = datetime.now().isoformat()
    message_data = {
        'id': secrets.token_hex(8),
        'user_id': user['id'],
        'username': user['username'],
        'message': message,
        'room': room,
        'timestamp': timestamp
    }
    
    # Save to database
    add_message(user['id'], user['username'], room, message, timestamp)
    
    # Broadcast to room
    emit('receive_message', message_data, room=room)
    
    # Clear typing indicator
    if room in typing_users and request.sid in typing_users[room]:
        typing_users[room].discard(request.sid)
        emit('user_stop_typing', {
            'username': user['username']
        }, room=room)

@socketio.on('ask_ai')
def handle_ask_ai(data):
    room = data.get('room', 'general')
    query = data.get('query', '')
    user = get_current_user()
    
    if not user or not query:
        return
        
    emit('user_typing', {'username': 'Chitra AI', 'user_id': 'ai@chitrastream.com'}, room=room)
    
    def generate_and_send():
        try:
            from openai import OpenAI
            api_key = os.environ.get('OPENAI_API_KEY')
            if api_key:
                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are Chitra AI, an elite cinema and movie expert participating in a community chat room. Keep your answers engaging, insightful, incredibly cinematic, and brief (1-3 short blocks max). Respond directly to the user's movie query."},
                        {"role": "user", "content": query}
                    ],
                    temperature=0.7,
                    max_tokens=250
                )
                ai_text = response.choices[0].message.content
            else:
                ai_text = "I'm Chitra AI! I stand ready to discuss the greatest cinema in history. What film shall we explore today?"
        except Exception as e:
            ai_text = "Ah, it seems the projection reel snapped. Let me gather my cinematic thoughts... try asking again!"
            
        timestamp = datetime.now().isoformat()
        msg_data = {
            'id': secrets.token_hex(8),
            'user_id': 'ai@chitrastream.com',
            'username': 'Chitra AI ✨',
            'message': ai_text,
            'room': room,
            'timestamp': timestamp
        }
        
        from db import add_message
        add_message('ai@chitrastream.com', 'Chitra AI ✨', room, ai_text, timestamp)
        
        socketio.emit('receive_message', msg_data, room=room)
        socketio.emit('user_stop_typing', {'username': 'Chitra AI'}, room=room)
        
    socketio.start_background_task(generate_and_send)

@socketio.on('typing_start')
def handle_typing_start(data):
    room = data.get('room', 'general')
    user = get_current_user()
    
    if not user:
        return
    
    if room not in typing_users:
        typing_users[room] = set()
    
    typing_users[room].add(request.sid)
    
    emit('user_typing', {
        'username': user['username'],
        'user_id': user['id']
    }, room=room, include_self=False)

@socketio.on('typing_stop')
def handle_typing_stop(data):
    room = data.get('room', 'general')
    user = get_current_user()
    
    if not user:
        return
    
    if room in typing_users and request.sid in typing_users[room]:
        typing_users[room].discard(request.sid)
    
    emit('user_stop_typing', {
        'username': user['username']
    }, room=room, include_self=False)

# ==================== Private Chat Events ====================

@socketio.on('join_private_chat')
def handle_join_private_chat(data):
    target_email = data.get('target_email')
    user = get_current_user()
    
    if not user or not target_email:
        return
    
    # Verify target user exists
    if not verify_user_email(target_email):
        emit('error', {'message': 'User not found'})
        return
        
    # Create consistent room name
    emails = sorted([user['email'], target_email])
    room = f"dm_{emails[0]}_{emails[1]}"
    
    join_room(room)
    
    # Get conversation history
    messages = get_private_messages(user['email'], target_email, limit=50)
    emit('private_history', {
        'messages': messages,
        'room': room,
        'target_email': target_email
    })

@socketio.on('send_private_message')
def handle_send_private_message(data):
    target_email = data.get('target_email')
    message = data.get('message', '').strip()
    user = get_current_user()
    
    if not user or not message or not target_email:
        return
        
    if len(message) > 2000:
        emit('error', {'message': 'Message too long'})
        return
        
    # Create consistent room name
    emails = sorted([user['email'], target_email])
    room = f"dm_{emails[0]}_{emails[1]}"
    
    # Save message
    save_private_message(user['email'], target_email, message)
    
    # Broadcast to room (both users should be in it)
    timestamp = datetime.now().isoformat()
    message_data = {
        'id': secrets.token_hex(8),
        'sender_email': user['email'],
        'receiver_email': target_email,
        'sender_name': user['username'],
        'message': message,
        'timestamp': timestamp,
        'room': room
    }
    
    emit('receive_private_message', message_data, room=room)

@socketio.on('typing_private_start')
def handle_typing_private_start(data):
    target_email = data.get('target_email')
    user = get_current_user()
    
    if not user or not target_email:
        return
        
    emails = sorted([user['email'], target_email])
    room = f"dm_{emails[0]}_{emails[1]}"
    
    emit('user_typing_private', {
        'username': user['username'],
        'email': user['email']
    }, room=room, include_self=False)

@socketio.on('typing_private_stop')
def handle_typing_private_stop(data):
    target_email = data.get('target_email')
    user = get_current_user()
    
    if not user or not target_email:
        return
        
    emails = sorted([user['email'], target_email])
    room = f"dm_{emails[0]}_{emails[1]}"
    
    emit('user_stop_typing_private', {
        'username': user['username'],
        'email': user['email']
    }, room=room, include_self=False)

# ==================== Stream Events ====================

@socketio.on('create_stream')
def handle_create_stream(data):
    user = get_current_user()
    
    if not user:
        emit('error', {'message': 'Not authenticated'})
        return
    
    stream_id = secrets.token_hex(16)
    
    stream_data = {
        'id': stream_id,
        'host_id': user['id'],
        'host_name': user['username'],
        'title': data.get('title', 'Untitled Stream'),
        'movie_id': data.get('movie_id'),
        'movie_title': data.get('movie_title'),
        'description': data.get('description', ''),
        'viewers': [],
        'viewer_count': 0,
        'started_at': datetime.now().isoformat(),
        'is_live': True
    }
    
    # Store stream
    active_streams[stream_id] = stream_data
    
    # Save to database
    create_stream(
        host_id=user['id'],
        host_name=user['username'],
        title=stream_data['title'],
        movie_id=stream_data.get('movie_id'),
        description=stream_data['description']
    )
    
    # Notify all users
    emit('stream_created', stream_data, broadcast=True)
    emit('stream_created_success', {'stream_id': stream_id})
    
    print(f"Stream created: {stream_id} by {user['username']}")

@socketio.on('join_stream')
def handle_join_stream(data):
    stream_id = data.get('stream_id')
    user = get_current_user()
    
    if not user or stream_id not in active_streams:
        emit('error', {'message': 'Stream not found'})
        return
    
    stream = active_streams[stream_id]
    
    # Add user to stream viewers
    viewer_info = {
        'user_id': user['id'],
        'username': user['username'],
        'sid': request.sid
    }
    
    if viewer_info not in stream['viewers']:
        stream['viewers'].append(viewer_info)
        stream['viewer_count'] = len(stream['viewers'])
    
    # Join stream room
    join_room(f"stream_{stream_id}")
    
    # Update user's current stream
    if request.sid in active_users:
        active_users[request.sid]['current_stream'] = stream_id
    
    # Notify stream participants
    emit('viewer_joined', {
        'username': user['username'],
        'viewer_count': stream['viewer_count']
    }, room=f"stream_{stream_id}")
    
    # Send stream info to joiner
    emit('stream_joined', {
        'stream': stream,
        'viewer_count': stream['viewer_count']
    })
    
    # Update database
    update_stream_viewers(stream_id, stream['viewer_count'])
    
    print(f"{user['username']} joined stream: {stream_id}")

@socketio.on('leave_stream')
def handle_leave_stream(data):
    stream_id = data.get('stream_id')
    user = get_current_user()
    
    if not user or stream_id not in active_streams:
        return
    
    stream = active_streams[stream_id]
    
    # Remove user from viewers
    stream['viewers'] = [
        v for v in stream['viewers'] 
        if v['sid'] != request.sid
    ]
    stream['viewer_count'] = len(stream['viewers'])
    
    # Leave stream room
    leave_room(f"stream_{stream_id}")
    
    # Update user's current stream
    if request.sid in active_users:
        active_users[request.sid]['current_stream'] = None
    
    # Notify remaining viewers
    emit('viewer_left', {
        'username': user['username'],
        'viewer_count': stream['viewer_count']
    }, room=f"stream_{stream_id}")
    
    # Update database
    update_stream_viewers(stream_id, stream['viewer_count'])
    
    print(f"{user['username']} left stream: {stream_id}")

@socketio.on('end_stream')
def handle_end_stream(data):
    stream_id = data.get('stream_id')
    user = get_current_user()
    
    if not user or stream_id not in active_streams:
        return
    
    stream = active_streams[stream_id]
    
    # Check if user is the host
    if stream['host_id'] != user['id']:
        emit('error', {'message': 'Only the host can end the stream'})
        return
    
    # Mark stream as ended
    stream['is_live'] = False
    stream['ended_at'] = datetime.now().isoformat()
    
    # Notify all viewers
    emit('stream_ended', {
        'stream_id': stream_id,
        'message': 'Stream has ended'
    }, room=f"stream_{stream_id}")
    
    # Remove stream after 5 seconds
    socketio.start_background_task(remove_stream_delayed, stream_id)
    
    print(f"Stream ended: {stream_id}")

def remove_stream_delayed(stream_id):
    import time
    time.sleep(5)
    if stream_id in active_streams:
        del active_streams[stream_id]
        socketio.emit('stream_removed', {'stream_id': stream_id}, broadcast=True)

@socketio.on('stream_message')
def handle_stream_message(data):
    stream_id = data.get('stream_id')
    message = data.get('message', '').strip()
    user = get_current_user()
    
    if not user or not message or stream_id not in active_streams:
        return
    
    message_data = {
        'id': secrets.token_hex(8),
        'user_id': user['id'],
        'username': user['username'],
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    
    # Broadcast to stream room
    emit('stream_chat_message', message_data, room=f"stream_{stream_id}")

@socketio.on('stream_reaction')
def handle_stream_reaction(data):
    stream_id = data.get('stream_id')
    reaction = data.get('reaction')
    user = get_current_user()
    
    if not user or stream_id not in active_streams:
        return
    
    # Broadcast reaction
    emit('stream_reaction_received', {
        'username': user['username'],
        'reaction': reaction,
        'timestamp': datetime.now().isoformat()
    }, room=f"stream_{stream_id}")

# ==================== Error Handlers ====================

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

# ==================== Run Application ====================

if __name__ == '__main__':
    try:
        print("Initializing database...")
        init_db()
        print("[OK] Database initialized successfully!")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        print("Continuing with server startup...")

    print("Starting server on http://0.0.0.0:5000...")
    socketio.run(app, 
                host='0.0.0.0', 
                port=5000,
                debug=True)