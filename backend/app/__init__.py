from datetime import timedelta
import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

from app.routes.auth_routes import auth_bp
from app.routes.freelancer_routes import freelancer_bp   # NOUVEAU
from app.routes.gig_routes import gig_bp                 # NOUVEAU

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
    db_name = mongo_uri.split("/")[-1].split("?")[0]
    app.db = client[db_name]

    # Blueprints
    app.register_blueprint(auth_bp,        url_prefix="/api/auth")
    app.register_blueprint(freelancer_bp,  url_prefix="/api/freelancer")  # NOUVEAU
    app.register_blueprint(gig_bp,         url_prefix="/api/gigs")        # NOUVEAU

    return app