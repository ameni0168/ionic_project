from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.gig_service import (
    get_freelancer_gigs,
    create_gig,
    update_gig,
    delete_gig
)

gig_bp = Blueprint("gigs", __name__)


def require_freelancer_role():
    claims = get_jwt()
    if claims.get("role") != "freelancer":
        return jsonify({"error": "Accès réservé aux freelancers"}), 403
    return None


# ─── GET /api/gigs ────────────────────────────────────────────────────────────
@gig_bp.route("/", methods=["GET"])
@jwt_required()
def list_gigs():
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    result, status = get_freelancer_gigs(user_id)
    return jsonify(result), status


# ─── POST /api/gigs ───────────────────────────────────────────────────────────
@gig_bp.route("/", methods=["POST"])
@jwt_required()
def new_gig():
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Corps de la requête vide"}), 400

    result, status = create_gig(user_id, data)
    return jsonify(result), status


# ─── PUT /api/gigs/<gig_id> ───────────────────────────────────────────────────
@gig_bp.route("/<gig_id>", methods=["PUT"])
@jwt_required()
def edit_gig(gig_id):
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Corps de la requête vide"}), 400

    result, status = update_gig(user_id, gig_id, data)
    return jsonify(result), status


# ─── DELETE /api/gigs/<gig_id> ────────────────────────────────────────────────
@gig_bp.route("/<gig_id>", methods=["DELETE"])
@jwt_required()
def remove_gig(gig_id):
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    result, status = delete_gig(user_id, gig_id)
    return jsonify(result), status