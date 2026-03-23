# app/routes/talent_routes.py
from flask import Blueprint, request, jsonify
from app.services.talent_service import (
    service_search_talents,
    service_get_top_rated,
    service_get_local,
    service_get_talent_by_id,
)

talent_bp = Blueprint("talent", __name__)


@talent_bp.route("/", methods=["GET"])
def search_talents():
    filters = {
        "q":             request.args.get("q", "").strip(),
        "category":      request.args.get("category", "").strip(),
        "location":      request.args.get("location", "").strip(),
        "min_rate":      request.args.get("min_rate"),
        "max_rate":      request.args.get("max_rate"),
        "skills":        request.args.getlist("skills"),
        "available_only":request.args.get("available_only", "false"),
        "sort":          request.args.get("sort", "rating"),
    }
    try:
        page     = max(1, int(request.args.get("page",     1)))
        per_page = min(max(1, int(request.args.get("per_page", 10))), 50)
    except ValueError:
        page, per_page = 1, 10

    return jsonify(service_search_talents(filters, page, per_page)), 200


@talent_bp.route("/top-rated", methods=["GET"])
def get_top_rated():
    try:
        limit = min(int(request.args.get("limit", 10)), 50)
    except ValueError:
        limit = 10
    return jsonify(service_get_top_rated(limit)), 200


@talent_bp.route("/local", methods=["GET"])
def get_local():
    location = request.args.get("location", "Tunisia").strip()
    try:
        limit = min(int(request.args.get("limit", 10)), 50)
    except ValueError:
        limit = 10
    return jsonify(service_get_local(location, limit)), 200


@talent_bp.route("/<talent_id>", methods=["GET"])
def get_talent(talent_id: str):
    result, error = service_get_talent_by_id(talent_id)
    if error:
        return jsonify({"error": error}), 404
    return jsonify(result), 200