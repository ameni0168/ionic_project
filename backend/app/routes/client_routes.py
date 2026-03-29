# app/routes/client_routes.py
from flask              import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.services.client_service import (
    get_client_profile,
    update_client_profile,
    change_client_password,
    get_client_dashboard,
)

client_bp = Blueprint("client", __name__)


def _check_client_role():
    claims = get_jwt()
    if claims.get("role") != "client":
        return jsonify({"error": "Acces reserve aux clients"}), 403
    return None


# GET /api/client/dashboard
@client_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    err = _check_client_role()
    if err:
        return err
    user_id          = get_jwt_identity()
    response, status = get_client_dashboard(user_id)
    return jsonify(response), status


# GET /api/client/profile
@client_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    err = _check_client_role()
    if err:
        return err
    user_id          = get_jwt_identity()
    response, status = get_client_profile(user_id)
    return jsonify(response), status


# PUT /api/client/profile
@client_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    err = _check_client_role()
    if err:
        return err
    user_id = get_jwt_identity()
    data    = request.get_json(silent=True) or {}
    response, status = update_client_profile(user_id, data)
    return jsonify(response), status


# POST /api/client/change-password
@client_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    err = _check_client_role()
    if err:
        return err
    user_id          = get_jwt_identity()
    data             = request.get_json(silent=True) or {}
    response, status = change_client_password(user_id, data)
    return jsonify(response), status