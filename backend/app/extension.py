# app/extension.py
from pymongo import MongoClient
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*")

load_dotenv()

# ── MongoDB direct (ton style) ────────────────────────────────────
client = MongoClient(os.getenv("MONGO_URI"))
db     = client["freelancerDB"]

# ── Extensions Flask ──────────────────────────────────────────────
jwt    = JWTManager()
bcrypt = Bcrypt()
cors   = CORS()