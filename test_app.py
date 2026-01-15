"""
Basic tests for Jette's AI App
"""

import os
import pytest
from app import app


@pytest.fixture
def client():
    """Create a test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    """Test the health check endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert 'status' in data
    assert data['status'] == 'healthy'
    assert 'service' in data
    assert data['service'] == 'jettes-ai-app'


def test_index_page(client):
    """Test the main page loads"""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Jette\'s AI App' in response.data or b"Jette's AI App" in response.data


def test_chat_endpoint_requires_message(client):
    """Test that chat endpoint requires a message"""
    response = client.post('/api/chat', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data


def test_chat_endpoint_with_message(client):
    """Test chat endpoint with a message"""
    # This will fail if GEMINI_API_KEY is not set, which is expected
    response = client.post('/api/chat', json={'message': 'Hello'})
    # Either success (200) or service unavailable (503) is acceptable
    assert response.status_code in [200, 503]


def test_404_handler(client):
    """Test 404 error handler"""
    response = client.get('/nonexistent-route')
    assert response.status_code == 404
    data = response.get_json()
    assert 'error' in data


def test_logout_endpoint(client):
    """Test logout endpoint"""
    response = client.post('/api/auth/logout')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
