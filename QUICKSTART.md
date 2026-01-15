# Quick Start Guide - Jette's AI App

Get Jette's AI App running in 5 minutes! 🚀

## Prerequisites

- Python 3.11 or higher
- A Google Gemini API key ([Get one free here](https://makersuite.google.com/app/apikey))

## Steps

### 1. Get the Code

```bash
git clone <repository-url>
cd lia--jette-s-ai-app-20260115T071224Z-3-001
```

### 2. Set Up Environment

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure API Key

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your-actual-api-key-here
```

Or use the provided script:
```bash
./run-local.sh
```

### 4. Run the App

```bash
python app.py
```

### 5. Open Your Browser

Navigate to: `http://localhost:8080`

You should see Jette's AI App interface! 🎉

## Testing the App

1. Type a message in the input box: "What is artificial intelligence?"
2. Click "Send" or press Enter
3. Watch as the AI responds!

## Quick Deploy to Cloud Run

Want to deploy to the cloud? It's just as easy:

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Deploy (the script will guide you)
./deploy.sh
```

## Common Issues

### "GEMINI_API_KEY not set"
**Solution**: Make sure you've created a `.env` file and added your API key.

### "Port already in use"
**Solution**: Change the port in `.env`:
```
PORT=8081
```

### "Module not found"
**Solution**: Make sure you've activated the virtual environment and installed dependencies:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## What's Next?

- Check out the full [README.md](README.md) for advanced features
- Read [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute
- Deploy to Google Cloud Run for production use

## Need Help?

- Open an issue on GitHub
- Check the [Troubleshooting section](README.md#troubleshooting) in the README

Happy chatting with Jette's AI! 🤖✨
