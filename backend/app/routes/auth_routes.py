from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
from app.services.auth_service import register_client
from app.services.auth_freelancer import register_freelancer
from flask_jwt_extended import create_access_token
import os
import traceback

auth_bp = Blueprint('auth', __name__)

# Register client
@auth_bp.route('/register/client', methods=['POST'])
def register():
    return register_client(request.json)


# Register freelancer
@auth_bp.route("/register/freelancer", methods=["POST"])
def register_freelancer_route():
    return register_freelancer(request.json)


# Login
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email et mot de passe requis"}), 400

        admin_email = os.getenv("ADMIN_EMAIL", "admin@freelancehub.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        if email == admin_email and password == admin_password:
            access_token = create_access_token(
                identity="admin-static",
                additional_claims={"role": "admin"}
            )
            return jsonify({
                "access_token": access_token,
                "role": "admin",
                "user_id": "admin-static"
            }), 200

        # 🔹 récupération DB 
        db = current_app.db
        users_collection = db["users"]

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        password_hash = user.get("password_hash") or user.get("password")
        if not password_hash:
            return jsonify({"error": "Mot de passe non configuré pour ce compte"}), 500

        if not check_password_hash(password_hash, password):
            return jsonify({"error": "Mot de passe incorrect"}), 401

        role = user.get("role", "client")

        access_token = create_access_token(
            identity=str(user["_id"]),
            additional_claims={"role": role}
        )

        return jsonify({
            "access_token": access_token,
            "role": role,
            "user_id": str(user["_id"])
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
