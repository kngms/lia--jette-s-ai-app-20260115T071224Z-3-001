# Contributing to Jette's AI App

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Issues

- Check if the issue already exists in the issue tracker
- Use a clear and descriptive title
- Include detailed steps to reproduce the issue
- Specify your environment (OS, Python version, etc.)
- Include relevant logs or error messages

### Submitting Pull Requests

1. **Fork the repository** and create a new branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run tests
   pytest test_app.py -v
   
   # Check code style
   flake8 app.py --max-line-length=100
   
   # Test locally
   ./run-local.sh
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lia--jette-s-ai-app-20260115T071224Z-3-001
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

## Code Style Guidelines

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings for functions and classes
- Keep functions focused and small
- Write self-documenting code

## Testing Guidelines

- Write tests for all new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Test edge cases and error conditions

## Documentation

- Update README.md if adding new features
- Add inline comments for complex logic
- Update API documentation if changing endpoints
- Include examples in docstrings

## Feature Requests

- Open an issue with the "enhancement" label
- Clearly describe the feature and its benefits
- Discuss the implementation approach
- Be open to feedback and alternative solutions

## Code Review Process

- All submissions require review
- Address reviewer feedback promptly
- Keep discussions professional and constructive
- Be patient - reviews may take time

## Questions?

Feel free to open an issue for questions or discussion.

Thank you for contributing to Jette's AI App! 🚀
