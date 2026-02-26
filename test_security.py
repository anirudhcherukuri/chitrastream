import unittest
import json
from app import app
from db import db

class SecurityAndErrorTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        import os
        if 'OPENAI_API_KEY' in os.environ:
            del os.environ['OPENAI_API_KEY']
        # Create a test client
        self.client = app.test_client()
        
    def test_signup_missing_fields(self):
        """Test signup endpoint with missing fields"""
        response = self.client.post('/api/auth/signup', 
            data=json.dumps({'email': 'test@example.com'}),
            content_type='application/json')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'All fields are required!')

    def test_sql_injection_login(self):
        """Test authentication with SQL injection attempt"""
        injection_payload = "' OR 1=1; --"
        response = self.client.post('/api/auth/login', 
            data=json.dumps({
                'email': injection_payload,
                'password': 'password123'
            }),
            content_type='application/json')
        data = json.loads(response.data)
        
        # Should not be authorized
        self.assertEqual(response.status_code, 401)
        self.assertFalse(data['success'])

    def test_xss_payload_in_production_assistant(self):
        """Test XSS or weird payloads in production assistant plot"""
        xss_payload = "<script>alert(1)</script> OR 1=1"
        response = self.client.post('/api/production-assistant', 
            data=json.dumps({'plot': xss_payload}),
            content_type='application/json')
        data = json.loads(response.data)
        
        # Expecting normal fallback to return values, no crash
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])

    def test_missing_plot_production_assistant(self):
        """Test production assistant with no plot"""
        response = self.client.post('/api/production-assistant', 
            data=json.dumps({}),
            content_type='application/json')
        data = json.loads(response.data)
        
        self.assertFalse(data['success'])
        self.assertEqual(data['error'], 'Plot is required')

    def test_unauthenticated_movie_access(self):
        """Test access to restricted route without authentication"""
        response = self.client.get('/api/movies')
        
        # Expected either 401 or redirect depending on login_required impl
        # In app.py, login_required returns 401 JSON if not logged in
        data = json.loads(response.data)
        self.assertEqual(response.status_code, 401)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Authentication required')

if __name__ == '__main__':
    unittest.main()
