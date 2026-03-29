from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.extension import db
from app.services.auth_service import register_client
from app.services.auth_freelancer import register_freelancer
from werkzeug.security import check_password_hash
import traceback

auth_bp = Blueprint("auth", __name__)


# =========================
# REGISTER CLIENT
# =========================
@auth_bp.route("/register/client", methods=["POST"])
def register():
    return register_client(request.json)


# =========================
# REGISTER FREELANCER
# =========================
@auth_bp.route("/register/freelancer", methods=["POST"])
def register_freelancer_route():
    return register_freelancer(request.json)


# =========================
# LOGIN
# =========================
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email et mot de passe requis"}), 400

        users_collection = db["users"]
        user = users_collection.find_one({"email": email})

        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        # safe password check
        password_hash = user.get("password_hash")

        if not password_hash:
            return jsonify({"error": "Password not set"}), 500

        if not check_password_hash(password_hash, password):
            return jsonify({"error": "Mot de passe incorrect"}), 401

        role = user.get("role", "client")

        token = create_access_token(
            identity=str(user["_id"]),
            additional_claims={"role": role}
        )

        return jsonify({
            "access_token": token,
            "role": role,
            "user_id": str(user["_id"])
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500