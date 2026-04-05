# app/routes/catalog_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.catalog_service import (
    service_list_gigs,
    service_get_gig_detail,
    service_get_by_category,
    service_get_featured,
    service_order_gig,
)

catalog_bp = Blueprint("catalog", __name__)


# ── GET /api/catalog/ ─────────────────────────────────────────────
# Paramètres : q, category, min_price, max_price, delivery_time, sort, page
@catalog_bp.route("/", methods=["GET"])
def list_gigs():
    filters = {
        "q":             request.args.get("q", "").strip(),
        "category":      request.args.get("category", "").strip(),
        "min_price":     request.args.get("min_price"),
        "max_price":     request.args.get("max_price"),
        "delivery_time": request.args.get("delivery_time", "").strip(),
        "sort":          request.args.get("sort", "popular"),
    }
    try:
        page     = max(1, int(request.args.get("page",     1)))
        per_page = min(max(1, int(request.args.get("per_page", 10))), 50)
    except ValueError:
        page, per_page = 1, 10

    return jsonify(service_list_gigs(filters, page, per_page)), 200


# ── GET /api/catalog/featured ─────────────────────────────────────
@catalog_bp.route("/featured", methods=["GET"])
def get_featured():
    try:
        limit = min(int(request.args.get("limit", 6)), 20)
    except ValueError:
        limit = 6
    return jsonify(service_get_featured(limit)), 200


# ── GET /api/catalog/category/<name> ─────────────────────────────
@catalog_bp.route("/category/<category>", methods=["GET"])
def get_by_category(category: str):
    try:
        limit = min(int(request.args.get("limit", 10)), 50)
    except ValueError:
        limit = 10
    return jsonify(service_get_by_category(category, limit)), 200


# ── GET /api/catalog/<gig_id> ─────────────────────────────────────
@catalog_bp.route("/<gig_id>", methods=["GET"])
def get_gig_detail(gig_id: str):
    result, status = service_get_gig_detail(gig_id)
    return jsonify(result), status


# ── POST /api/catalog/<gig_id>/order ─────────────────────────────
# Réservé aux clients authentifiés
@catalog_bp.route("/<gig_id>/order", methods=["POST"])
@jwt_required()
def order_gig(gig_id: str):
    claims = get_jwt()
    if claims.get("role") != "client":
        return jsonify({"error": "Seuls les clients peuvent commander un service"}), 403

    client_id = get_jwt_identity()
    data      = request.get_json(silent=True) or {}
    result, status = service_order_gig(gig_id, client_id, data)
    return jsonify(result), status