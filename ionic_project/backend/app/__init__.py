from datetime import timedelta
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from dotenv import load_dotenv

from app.routes.auth_routes import auth_bp
from app.routes.job_routes import job_bp
from app.routes.proposal_routes import proposal_bp
from app.extension import init_db  # ton init_db existant si tu as des helpers

load_dotenv()

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # ── JWT config ─────────────────────────────────────────────
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
    jwt.init_app(app)

    # ── MongoDB ───────────────────────────────────────────────
    mongo_uri = os.getenv("MONGO_URI")
    client = MongoClient(mongo_uri)

    # récupère le nom de la DB depuis l’URI
    db_name = mongo_uri.split("/")[-1].split("?")[0]
    app.db = client[db_name]  # ← on peut accéder avec app.db partout

    

    # ── Blueprints ────────────────────────────────────────────
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(job_bp, url_prefix="/api/jobs")
    app.register_blueprint(proposal_bp, url_prefix="/api/proposals")
   

    return app