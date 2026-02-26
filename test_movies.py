import pytest
from app import app
from db import init_db

@pytest.fixture
def client(monkeypatch):
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test_secret_key'

    def mock_get_movie_details(movie_id):
        if movie_id == 1:
            return {'MovieID': 1, 'Title': 'Test Movie', 'Rating': 8.5}
        return None

    def mock_get_all_movies(limit=100, offset=0):
        return [{'MovieID': 1, 'Title': 'Test Movie'}]
        
    def mock_get_movie_platforms_v2(movie_id):
        return [{'name': 'Netflix', 'url': 'http://netflix.com', 'price': 'Free'}]
        
    def mock_get_movie_reviews(movie_id):
        return []

    def mock_get_movie_discussions(movie_id):
        return []
        
    def mock_get_recommendations(movie_id):
        return []
        
    def mock_increment_view_count(movie_id):
        pass

    monkeypatch.setattr('app.db.get_movie_details', mock_get_movie_details)
    monkeypatch.setattr('app.db.get_all_movies', mock_get_all_movies)
    monkeypatch.setattr('db.get_movie_platforms_v2', mock_get_movie_platforms_v2)
    monkeypatch.setattr('db.get_movie_reviews', mock_get_movie_reviews)
    monkeypatch.setattr('db.get_movie_discussions', mock_get_movie_discussions)
    monkeypatch.setattr('db.get_recommendations', mock_get_recommendations)
    monkeypatch.setattr('db.increment_view_count', mock_increment_view_count)

    with app.test_client() as client:
        # Mock logged in session
        with client.session_transaction() as sess:
            sess['user_id'] = 'test@example.com'
        yield client

def test_api_get_all_movies(client):
    res = client.get('/api/movies')
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 1
    assert data[0]['Title'] == 'Test Movie'

def test_api_get_movie_details(client):
    res = client.get('/api/movies/1')
    assert res.status_code == 200
    data = res.get_json()
    assert data['Title'] == 'Test Movie'
    assert data['worth_score'] > 0 # Computed worth_score
    assert len(data['platforms']) == 1

def test_api_get_movie_details_not_found(client):
    res = client.get('/api/movies/999')
    assert res.status_code == 404
