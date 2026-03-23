# app/__init__.py
import os
from flask import Flask, jsonify, request, Response
from dotenv import load_dotenv
from app.extension import jwt, bcrypt, db

load_dotenv()


def create_app():
    app = Flask(__name__)

    # ── Config ────────────────────────────────────────────────────
    app.config["SECRET_KEY"]                = os.getenv("SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"]            = os.getenv("JWT_SECRET_KEY", "jwt-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"]  = _parse_duration(os.getenv("JWT_ACCESS_TOKEN_EXPIRES",  "86400"))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = _parse_duration(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "2592000"))

    # ── Extensions ────────────────────────────────────────────────
    jwt.init_app(app)
    bcrypt.init_app(app)

    # ── CORS sur toutes les réponses ──────────────────────────────
    @app.after_request
    def add_cors(response):
        response.headers["Access-Control-Allow-Origin"]  = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            res = Response()
            res.headers["Access-Control-Allow-Origin"]  = "*"
            res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            res.status_code = 200
            return res

    # ── Test MongoDB ──────────────────────────────────────────────
    try:
        db.command("ping")
        print("OK Connecte a MongoDB Atlas")
        _create_indexes()
    except Exception as e:
        raise RuntimeError(f"MongoDB connexion echouee : {e}")

    # ── Blueprints ────────────────────────────────────────────────
    from app.routes.auth_routes    import auth_bp
    from app.routes.client_routes  import client_bp
    from app.routes.talent_routes  import talent_bp   

    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(client_bp,  url_prefix="/api/client")
    app.register_blueprint(talent_bp,  url_prefix="/api/talents")  

    # ── Error handlers ────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Route introuvable"}), 404

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({"error": "Token JWT invalide ou expire"}), 422

    @app.errorhandler(500)
    def server_error(e):
        print(f"[500] {e}")
        return jsonify({"error": "Erreur interne du serveur"}), 500

    return app


def _parse_duration(value: str) -> int:
    value = str(value).strip().lower()
    if value.endswith("d"): return int(value[:-1]) * 86400
    if value.endswith("h"): return int(value[:-1]) * 3600
    if value.endswith("m"): return int(value[:-1]) * 60
    return int(value)


def _create_indexes():
    db.users.create_index("email",    unique=True, sparse=True)
    db.users.create_index("username", unique=True, sparse=True)
    db.clients.create_index("user_id",      unique=True, sparse=True)
    db.freelancers.create_index("user_id",  unique=True, sparse=True)
    # Index pour la recherche de talents
    db.freelancers.create_index([("stats.rating",     -1)])
    db.freelancers.create_index([("stats.job_success",-1)])
    db.freelancers.create_index([("hourly_rate",       1)])
    db.freelancers.create_index([("category",          1)])
    db.freelancers.create_index([("location",          1)])
    db.freelancers.create_index([("skills",            1)])
    db.freelancers.create_index([("created_at",       -1)])
    print("OK Index MongoDB crees")