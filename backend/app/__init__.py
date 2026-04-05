from datetime import timedelta
import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from app.routes.auth_routes import auth_bp

load_dotenv()

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
    jwt.init_app(app)

    mongo_uri = os.getenv("MONGO_URI")
    client = MongoClient(mongo_uri)
    db_name = mongo_uri.split("/")[-1].split("?")[0]  # récupère mydatabase
    app.db = client[db_name]

    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app