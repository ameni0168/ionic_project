from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.order_service import (
    get_orders_for_freelancer,
    update_order_status,
    get_orders_for_client,
    accept_and_pay_order,
)
from app.services.catalog_service import (
    service_list_gigs,
    service_get_gig_detail,
    service_get_featured,
    service_get_by_category,
    service_order_gig,
)

order_bp   = Blueprint("orders",  __name__)
catalog_bp = Blueprint("catalog", __name__)


# ════════════════════════════════════════════════════════════
#  ORDERS — FREELANCER
# ════════════════════════════════════════════════════════════

def _require_role(role: str):
    claims = get_jwt()
    if claims.get("role") != role:
        return jsonify({"error": f"Accès réservé aux {role}s"}), 403
    return None


# GET /api/orders/freelancer?status=pending
@order_bp.route("/freelancer", methods=["GET"])
@jwt_required()
def freelancer_orders():
    err = _require_role("freelancer")
    if err: return err

    user_id       = get_jwt_identity()
    status_filter = request.args.get("status", "")
    result, code  = get_orders_for_freelancer(user_id, status_filter)
    return jsonify(result), code


# PATCH /api/orders/<order_id>/status
# Body: { "status": "in_progress" | "completed" | "cancelled" }
@order_bp.route("/<order_id>/status", methods=["PATCH"])
@jwt_required()
def change_order_status(order_id):
    err = _require_role("freelancer")
    if err: return err

    user_id    = get_jwt_identity()
    data       = request.get_json() or {}
    new_status = data.get("status", "").strip()

    if not new_status:
        return jsonify({"error": "Le champ 'status' est requis"}), 400

    result, code = update_order_status(user_id, order_id, new_status)
    return jsonify(result), code


# ════════════════════════════════════════════════════════════
#  ORDERS — CLIENT
# ════════════════════════════════════════════════════════════

# GET /api/orders/client?status=pending
@order_bp.route("/client", methods=["GET"])
@jwt_required()
def client_orders():
    err = _require_role("client")
    if err: return err

    user_id       = get_jwt_identity()
    status_filter = request.args.get("status", "")
    result, code  = get_orders_for_client(user_id, status_filter)
    return jsonify(result), code


# POST /api/orders/<order_id>/accept-pay
@order_bp.route("/<order_id>/accept-pay", methods=["POST"])
@jwt_required()
def accept_pay_order(order_id):
    err = _require_role("client")
    if err: return err

    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    result, code = accept_and_pay_order(
        user_id,
        order_id,
        payment_method_id=data.get("payment_method_id"),
    )
    return jsonify(result), code


# ════════════════════════════════════════════════════════════
#  CATALOG — PUBLIC (lecture) + CLIENT (commander)
# ════════════════════════════════════════════════════════════

# GET /api/catalog?q=logo&category=Design&min_price=50&sort=popular&page=1
@catalog_bp.route("/", methods=["GET"])
def list_gigs():
    filters = {
        "q":         request.args.get("q", ""),
        "category":  request.args.get("category", ""),
        "min_price": request.args.get("min_price", ""),
        "max_price": request.args.get("max_price", ""),
        "sort":      request.args.get("sort", "popular"),
    }
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    result   = service_list_gigs(filters, page, per_page)
    return jsonify(result), 200


# GET /api/catalog/featured
@catalog_bp.route("/featured", methods=["GET"])
def featured():
    limit  = int(request.args.get("limit", 6))
    result = service_get_featured(limit)
    return jsonify(result), 200


# GET /api/catalog/category/<category>
@catalog_bp.route("/category/<category>", methods=["GET"])
def by_category(category):
    limit  = int(request.args.get("limit", 10))
    result = service_get_by_category(category, limit)
    return jsonify(result), 200


# GET /api/catalog/<gig_id>
@catalog_bp.route("/<gig_id>", methods=["GET"])
def gig_detail(gig_id):
    result, code = service_get_gig_detail(gig_id)
    return jsonify(result), code


# POST /api/catalog/<gig_id>/order  (client connecté)
# Body: { "message": "...", "requirements": "..." }
@catalog_bp.route("/<gig_id>/order", methods=["POST"])
@jwt_required()
def order_gig(gig_id):
    err = _require_role("client")
    if err: return err

    client_id    = get_jwt_identity()
    data         = request.get_json() or {}
    result, code = service_order_gig(gig_id, client_id, data)
    return jsonify(result), code
