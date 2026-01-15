# Jette's AI App 🤖

A modern AI assistant application powered by Google Gemini, designed to be deployed on Google Cloud Run with optional OAuth authentication.

## Features

- 💬 **AI Chat Interface**: Interactive chat powered by Google Gemini Pro
- 🔐 **Google OAuth**: Optional authentication support
- ☁️ **Cloud-Ready**: Optimized for Google Cloud Run deployment
- 🎨 **Modern UI**: Clean, responsive web interface
- 📊 **Health Monitoring**: Built-in health check endpoints
- 🚀 **Easy Deployment**: One-command deployment to Cloud Run

## Quick Start

### Prerequisites

- Python 3.11+
- Google Cloud SDK (gcloud CLI)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Docker (optional, for local container testing)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lia--jette-s-ai-app-20260115T071224Z-3-001
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## Deployment to Google Cloud Run

### Option 1: Using gcloud CLI (Recommended)

1. **Set up Google Cloud**
   ```bash
   # Login to Google Cloud
   gcloud auth login
   
   # Set your project
   gcloud config set project YOUR_PROJECT_ID
   
   # Enable required APIs
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Deploy the application**
   ```bash
   # Deploy to Cloud Run
   gcloud run deploy jettes-ai-app \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=your-api-key-here
   ```

3. **Access your app**
   After deployment, Cloud Run will provide a URL like:
   `https://jettes-ai-app-xxx-uc.a.run.app`

### Option 2: Using Cloud Build (CI/CD)

1. **Set up substitution variables**
   ```bash
   gcloud builds submit \
     --config cloudbuild.yaml \
     --substitutions _GEMINI_API_KEY=your-api-key-here
   ```

### Option 3: Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t jettes-ai-app .
   ```

2. **Run locally**
   ```bash
   docker run -p 8080:8080 \
     -e GEMINI_API_KEY=your-api-key-here \
     jettes-ai-app
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `SECRET_KEY` | Flask session secret key | No | `dev-secret-key-change-in-production` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | - |
| `REQUIRE_AUTH` | Enable authentication requirement | No | `false` |
| `PORT` | Server port | No | `8080` |
| `FLASK_ENV` | Flask environment (development/production) | No | `production` |

### Setting Secrets in Cloud Run

For production, use Google Secret Manager:

```bash
# Create a secret
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member=serviceAccount:YOUR-PROJECT-NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Update Cloud Run service
gcloud run services update jettes-ai-app \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status and configuration.

### Chat
```
POST /api/chat
Content-Type: application/json

{
  "message": "Your question here"
}
```
Returns AI-generated response.

### Authentication (Optional)
```
POST /api/auth/verify
POST /api/auth/logout
```

## Project Structure

```
.
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
├── cloudbuild.yaml        # Cloud Build CI/CD config
├── app.yaml              # App Engine config (alternative)
├── .env.example          # Environment variables template
├── templates/
│   └── index.html        # Web UI
└── static/              # Static assets (if needed)
```

## Development

### Running Tests

```bash
# Install development dependencies
pip install pytest pytest-cov

# Run tests
pytest
```

### Code Quality

```bash
# Format code
pip install black
black .

# Lint code
pip install flake8
flake8 app.py
```

## Security Considerations

- Always use Secret Manager for production credentials
- Enable authentication (`REQUIRE_AUTH=true`) for sensitive deployments
- Use HTTPS (automatically provided by Cloud Run)
- Keep dependencies updated: `pip install --upgrade -r requirements.txt`

## Troubleshooting

### Issue: "GEMINI_API_KEY not set"
**Solution**: Make sure you've set the `GEMINI_API_KEY` environment variable in your `.env` file or Cloud Run configuration.

### Issue: "Authentication required"
**Solution**: Either:
- Set `REQUIRE_AUTH=false` in environment variables, or
- Implement Google OAuth authentication

### Issue: Container fails to start
**Solution**: Check logs:
```bash
gcloud run logs read --service jettes-ai-app --limit 50
```

### Issue: Port binding error
**Solution**: Cloud Run automatically sets the `PORT` environment variable. Make sure your app listens on `$PORT`.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Apache License 2.0 - See [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [Troubleshooting](#troubleshooting) section

## Acknowledgments

- Powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Built with [Flask](https://flask.palletsprojects.com/)
- Deployed on [Google Cloud Run](https://cloud.google.com/run)