from datetime import timedelta

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["JWT_SECRET_KEY"] = "super-secret-key"  # change par un secret réel
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)

    jwt.init_app(app)  # ← ⚠ important

    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app
