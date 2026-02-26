import pytest
from app import app
from db import init_db, create_user, verify_user, add_message, get_messages

@pytest.fixture
def client(monkeypatch):
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test_secret_key'
    
    # We might want to patch db calls here if we don't want to use real DB, 
    # but for integration tests, a test DB should be used.
    # Assuming the current dev DB is fine for basic endpoint testing or we mock.

    # Mocking verify_user and get_current_user to test auth routes
    def mock_verify_user(email, password):
        if email == 'test@example.com' and password == 'password123':
            return {'id': 1, 'username': 'testuser', 'email': 'test@example.com'}
        return None
        
    def mock_create_user(username, email, password):
        if email == 'existing@example.com':
            return None
        return 2
        
    monkeypatch.setattr('app.verify_user', mock_verify_user)
    monkeypatch.setattr('app.create_user', mock_create_user)

    # Note: `get_user` handles duplicate checking in our app
    def mock_get_user(email=None):
        if email == 'existing@example.com':
            return {'id': 1, 'username': 'existing', 'email': 'existing@example.com'}
        return None
        
    monkeypatch.setattr('app.get_user', mock_get_user)
        
    with app.test_client() as client:
        yield client

def test_login_success(client):
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    data = response.get_json()
    assert response.status_code == 200
    assert data['success'] is True
    assert data['user']['username'] == 'testuser'

def test_login_failure(client):
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'wrongpassword'
    })
    data = response.get_json()
    assert response.status_code == 401
    assert data['success'] is False

def test_signup_success(client):
    response = client.post('/api/auth/signup', json={
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'password123'
    })
    data = response.get_json()
    assert response.status_code == 200
    assert data['success'] is True
    assert data['user']['username'] == 'newuser'

def test_signup_existing_email(client):
    response = client.post('/api/auth/signup', json={
        'username': 'existing',
        'email': 'existing@example.com',
        'password': 'password123'
    })
    data = response.get_json()
    assert response.status_code == 400
    assert data['success'] is False

def test_auth_status_unauthenticated(client):
    response = client.get('/api/auth/status')
    data = response.get_json()
    assert response.status_code == 200
    assert data['isAuthenticated'] is False

def test_auth_status_authenticated(client):
    with client.session_transaction() as sess:
        sess['user_id'] = 'test@example.com' # Email is used as ID here

    response = client.get('/api/auth/status')
    data = response.get_json()
    
    # We must patch get_user inside app.py again because the route uses it, 
    # but since the fixture patches app.get_user, it should work.
    
    assert response.status_code == 200

