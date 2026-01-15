"""
Jette's AI App - A Google Gemini-powered AI assistant
Deployable on Google Cloud Run with OAuth authentication
"""

import os
import logging
from flask import Flask, request, jsonify, render_template, session
from functools import wraps
import google.generativeai as genai
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configure Google Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    logger.warning("GEMINI_API_KEY not set. AI features will be limited.")
    model = None

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')


def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session and os.environ.get('REQUIRE_AUTH', 'false').lower() == 'true':
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function


@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')


@app.route('/health')
def health():
    """Health check endpoint for Cloud Run"""
    return jsonify({
        'status': 'healthy',
        'service': 'jettes-ai-app',
        'gemini_configured': model is not None
    }), 200


@app.route('/api/chat', methods=['POST'])
@require_auth
def chat():
    """Chat endpoint for AI interactions"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400

        user_message = data['message']

        if not model:
            return jsonify({
                'error': 'AI service not configured. Please set GEMINI_API_KEY.'
            }), 503

        # Generate response using Gemini
        logger.info(f"Processing message: {user_message[:50]}...")
        response = model.generate_content(user_message)

        return jsonify({
            'response': response.text,
            'model': 'gemini-pro'
        }), 200

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': 'Failed to process request'}), 500


@app.route('/api/auth/verify', methods=['POST'])
def verify_token():
    """Verify Google OAuth token"""
    try:
        data = request.get_json()
        token = data.get('token')

        if not token or not GOOGLE_CLIENT_ID:
            return jsonify({'error': 'Invalid request'}), 400

        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Store user info in session
        session['user'] = {
            'email': idinfo.get('email'),
            'name': idinfo.get('name'),
            'picture': idinfo.get('picture')
        }

        return jsonify({
            'success': True,
            'user': session['user']
        }), 200

    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        return jsonify({'error': 'Authentication failed'}), 401


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    session.pop('user', None)
    return jsonify({'success': True}), 200


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    logger.error(f"Server error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
