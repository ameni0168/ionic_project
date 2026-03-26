from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.freelancer_service import (
    get_freelancer_profile,
    update_freelancer_profile,
    get_dashboard_stats
)

freelancer_bp = Blueprint("freelancer", __name__)


def require_freelancer_role():
    """Helper : vérifie que le token JWT appartient bien à un freelancer."""
    claims = get_jwt()
    if claims.get("role") != "freelancer":
        return jsonify({"error": "Accès réservé aux freelancers"}), 403
    return None


# ─── GET /api/freelancer/profile ──────────────────────────────────────────────
@freelancer_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    result, status = get_freelancer_profile(user_id)
    return jsonify(result), status


# ─── PUT /api/freelancer/profile ──────────────────────────────────────────────
@freelancer_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Corps de la requête vide"}), 400

    result, status = update_freelancer_profile(user_id, data)
    return jsonify(result), status


# ─── GET /api/freelancer/dashboard ────────────────────────────────────────────
@freelancer_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    result, status = get_dashboard_stats(user_id)
    return jsonify(result), status