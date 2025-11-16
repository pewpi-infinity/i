#!/usr/bin/env python3
"""
Simple Flask server that:
- Serves the repo index.html at /
- Accepts POST /log with JSON { "text": "..."}
- Appends logs to logs/txt.log with a timestamp
- Adds CORS headers so the page can post from a browser

Usage:
  pip install flask flask-cors
  python3 log_server.py
Then open http://127.0.0.1:5050/
"""
import os
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS

APP_PORT = int(os.environ.get("PORT", 5050))
ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
LOG_DIR = os.path.join(ROOT_DIR, "logs")
LOG_FILE = os.path.join(LOG_DIR, "txt.log")

app = Flask(__name__, static_folder=ROOT_DIR, static_url_path='')
CORS(app)

# Ensure logs directory exists
os.makedirs(LOG_DIR, exist_ok=True)

@app.route("/", methods=["GET"])
def index():
    # Serve index.html from repo root
    index_path = os.path.join(ROOT_DIR, "index.html")
    if not os.path.exists(index_path):
        return "<h3>index.html not found in repo root</h3>", 404
    return send_from_directory(ROOT_DIR, "index.html")

@app.route("/log", methods=["POST"])
def log_text():
    if not request.is_json:
        return jsonify(status="error", message="Expected JSON"), 400
    payload = request.get_json()
    text = payload.get("text", "")
    if text is None:
        text = ""
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " UTC"
    entry = f"[{ts}] {text}\n"
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(entry)
        return jsonify(status="ok"), 200
    except Exception as e:
        return jsonify(status="error", message=str(e)), 500

if __name__ == "__main__":
    print(f"Starting log server on http://127.0.0.1:{APP_PORT}")
    print(f"Logs will be appended to: {LOG_FILE}")
    app.run(host="127.0.0.1", port=APP_PORT, debug=False)