# api/index.py
import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your Flask app
from server import app

# Vercel serverless handler
def handler(request, context):
    return app(request.environ, lambda status, headers: None)
