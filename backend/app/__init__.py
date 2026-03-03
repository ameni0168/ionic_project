from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from app.routes.auth_routes import auth_bp
import os
from dotenv import load_dotenv

mongo = PyMongo()

def create_app():
    app = Flask(__name__)
    CORS(app)

    load_dotenv()
    app.config["MONGO_URI"] = os.getenv("MONGO_URI")

    mongo.init_app(app)

    # passer mongo à auth_bp via app.config (ou autre)
    app.mongo = mongo

    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app