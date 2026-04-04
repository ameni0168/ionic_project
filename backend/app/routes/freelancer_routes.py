from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.services.freelancer_service import (
    get_freelancer_profile,
    update_freelancer_profile,
    get_dashboard_stats,
    service_search_freelancers,
    service_get_top_rated,
    service_get_local,
)

freelancer_bp = Blueprint("freelancer", __name__)


def require_freelancer_role():
    claims = get_jwt()
    if claims.get("role") != "freelancer":
        return jsonify({"error": "Accès réservé aux freelancers"}), 403
    return None


@freelancer_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    result, status = get_freelancer_profile(user_id)
    return jsonify(result), status


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


@freelancer_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    error = require_freelancer_role()
    if error:
        return error

    user_id = get_jwt_identity()
    result, status = get_dashboard_stats(user_id)
    return jsonify(result), status


# strict_slashes=False : évite le 308 /api/freelancer → /api/freelancer/ (preflight CORS)
@freelancer_bp.route("/", methods=["GET"], strict_slashes=False)
def search():
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 5))

        filters = {
            "q": request.args.get("q", ""),
            "location": request.args.get("location", ""),
            "category": request.args.get("category", ""),
            "sort": request.args.get("sort", "rating"),
        }
        if request.args.get("min_rate") not in (None, ""):
            try:
                filters["min_rate"] = float(request.args.get("min_rate"))
            except (TypeError, ValueError):
                pass
        if request.args.get("max_rate") not in (None, ""):
            try:
                filters["max_rate"] = float(request.args.get("max_rate"))
            except (TypeError, ValueError):
                pass
        if request.args.get("available_only", "").lower() in ("1", "true", "yes"):
            filters["available_only"] = True

        result = service_search_freelancers(filters, page, per_page)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@freelancer_bp.route("/top-rated", methods=["GET"])
def top_rated():
    limit = int(request.args.get("limit", 10))
    return jsonify(service_get_top_rated(limit)), 200


@freelancer_bp.route("/local", methods=["GET"])
def local():
    location = request.args.get("location", "Tunisia")
    limit = int(request.args.get("limit", 10))

    return jsonify(service_get_local(location, limit)), 200


@freelancer_bp.route("/<user_id>", methods=["GET", "OPTIONS"])
def freelancer_by_id(user_id):
    if request.method == "OPTIONS":
        return "", 200

    result, status = get_freelancer_profile(user_id)
    return jsonify(result), status
