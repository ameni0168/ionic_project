from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from app.extension import init_db

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["MONGO_URI"] = os.getenv("MONGO_URI")

    # Initialize MongoDB
    init_db(app)

    from app.routes.auth_routes import auth_bp
    from app.routes.job_routes import job_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(job_bp, url_prefix="/api/jobs")

    return app