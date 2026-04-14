#!/bin/bash
# NeuroMatrix Biosystems — Render Build Script
# Builds React frontend then Flask serves it

echo "=== NeuroMatrix Build Script ==="
echo "[1/3] Installing Python dependencies..."
pip install flask flask-cors opencv-python-headless numpy gunicorn

echo "[2/3] Installing Node dependencies..."
npm install

echo "[3/3] Building React app..."
npm run build

echo "=== Build complete! React build is in ./build/ ==="
echo "Flask will serve it via server.py"
