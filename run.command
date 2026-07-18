#!/bin/bash
cd "$(dirname "$0")"
echo "==================================================="
echo "  Starting Bravin Transport Web App Simulator..."
echo "==================================================="
echo ""

if command -v python3 &>/dev/null; then
    echo "[OK] Python 3 detected. Starting server on http://localhost:8000..."
    open "http://localhost:8000/bravin-transport.html"
    python3 -m http.server 8000
elif command -v python &>/dev/null; then
    echo "[OK] Python detected. Starting server on http://localhost:8000..."
    open "http://localhost:8000/bravin-transport.html"
    python -m http.server 8000
elif command -v npx &>/dev/null; then
    echo "[OK] Node/npx detected. Starting server on http://localhost:8080..."
    open "http://localhost:8080/bravin-transport.html"
    npx http-server -p 8080
else
    echo "[WARNING] No local server detected. Opening directly..."
    open "bravin-transport.html"
fi
