# app/routes/auth_routes.py
from flask              import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.services.auth_service import (
    register_user,
    login_user,
    refresh_access_token,
    get_current_user,
    change_password,
)

auth_bp = Blueprint("auth", __name__)


# POST /api/auth/register
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Corps JSON invalide"}), 400
    response, status = register_user(data)
    return jsonify(response), status


# POST /api/auth/login
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Corps JSON invalide"}), 400
    response, status = login_user(data)
    return jsonify(response), status


# POST /api/auth/refresh
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id          = get_jwt_identity()
    claims           = get_jwt()
    role             = claims.get("role", "client")
    data             = refresh_access_token(user_id, role)
    return jsonify(data), 200


# GET /api/auth/me
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id          = get_jwt_identity()
    response, status = get_current_user(user_id)
    return jsonify(response), status


# POST /api/auth/change-password
@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_pwd():
    user_id          = get_jwt_identity()
    data             = request.get_json(silent=True) or {}
    response, status = change_password(user_id, data)
    return jsonify(response), status