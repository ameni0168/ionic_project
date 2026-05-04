from flask import Blueprint, jsonify, request, current_app
from bson import ObjectId

from app.services.sprint_plan_service import (
    create_sprint_plan,
    update_sprint_plan,
    submit_sprint_plan,
    review_sprint_plan,
    get_contract_sprints,
    get_sprint_plan_by_id,
    list_contract_sprint_plans,
    validate_sprint_items,
    serialize_sprint_plan,
    serialize_sprint,
)


sprint_plan_bp = Blueprint("sprint_plan_bp", __name__)


def get_db():
    return current_app.db


@sprint_plan_bp.route("/contracts/<contract_id>/sprint-plans", methods=["POST"])
def create_contract_sprint_plan(contract_id):
    data = request.get_json() or {}
    if "summary" not in data or "sprints" not in data:
        return jsonify({"error": "Fields 'summary' and 'sprints' are required"}), 400
    validation_error = validate_sprint_items(data["sprints"])
    if validation_error:
        return jsonify({"error": validation_error}), 400

    try:
        db = get_db()
        contract = db.contracts.find_one({"_id": ObjectId(contract_id)})
    except Exception:
        return jsonify({"error": "Invalid contract ID"}), 400

    if not contract:
        return jsonify({"error": "Contract not found"}), 404

    sprint_plan = create_sprint_plan(
        db,
        contract=contract,
        payload=data,
        actor_id=data.get("created_by", contract["freelancer_id"]),
    )
    return jsonify({
        "message": "Sprint plan created",
        "sprint_plan": {
            "_id": str(sprint_plan["_id"]),
            "version": sprint_plan["version"],
            "status": sprint_plan["status"],
        },
    }), 201


@sprint_plan_bp.route("/contracts/<contract_id>/sprint-plans", methods=["GET"])
def list_sprint_plans(contract_id):
    try:
        plans = list_contract_sprint_plans(get_db(), contract_id)
    except Exception:
        return jsonify({"error": "Invalid contract ID"}), 400

    return jsonify({
        "items": [serialize_sprint_plan(plan) for plan in plans],
        "total": len(plans),
    }), 200


@sprint_plan_bp.route("/sprint-plans/<plan_id>", methods=["GET"])
def get_sprint_plan(plan_id):
    try:
        plan = get_sprint_plan_by_id(get_db(), plan_id)
    except Exception:
        return jsonify({"error": "Invalid sprint plan ID"}), 400

    if not plan:
        return jsonify({"error": "Sprint plan not found"}), 404

    return jsonify(serialize_sprint_plan(plan)), 200


@sprint_plan_bp.route("/sprint-plans/<plan_id>", methods=["PUT"])
def edit_sprint_plan(plan_id):
    data = request.get_json() or {}
    try:
        db = get_db()
        plan = get_sprint_plan_by_id(db, plan_id)
    except Exception:
        return jsonify({"error": "Invalid sprint plan ID"}), 400

    if not plan:
        return jsonify({"error": "Sprint plan not found"}), 404
    if plan["status"] not in ["draft", "revision_requested"]:
        return jsonify({"error": "Only draft or revision requested plans can be edited"}), 400
    if "sprints" in data:
        validation_error = validate_sprint_items(data["sprints"])
        if validation_error:
            return jsonify({"error": validation_error}), 400

    updated = update_sprint_plan(
        db,
        sprint_plan=plan,
        payload=data,
        actor_id=data.get("updated_by"),
    )
    return jsonify({
        "message": "Sprint plan updated",
        "sprint_plan": serialize_sprint_plan(updated),
    }), 200


@sprint_plan_bp.route("/sprint-plans/<plan_id>/submit", methods=["POST"])
def submit_plan(plan_id):
    try:
        db = get_db()
        sprint_plan = db.sprint_plans.find_one({"_id": ObjectId(plan_id)})
    except Exception:
        return jsonify({"error": "Invalid sprint plan ID"}), 400

    if not sprint_plan:
        return jsonify({"error": "Sprint plan not found"}), 404
    if sprint_plan["status"] not in ["draft", "revision_requested"]:
        return jsonify({"error": "Only draft or revision requested plans can be submitted"}), 400

    payload = request.get_json(silent=True) or {}
    submit_sprint_plan(db, sprint_plan, actor_id=payload.get("submitted_by"))
    return jsonify({"message": "Sprint plan submitted", "status": "submitted"}), 200


@sprint_plan_bp.route("/sprint-plans/<plan_id>/review", methods=["POST"])
def review_plan(plan_id):
    data = request.get_json() or {}
    action = data.get("action")
    if action not in ["approve", "request_revision"]:
        return jsonify({"error": "Invalid action"}), 400

    try:
        db = get_db()
        sprint_plan = db.sprint_plans.find_one({"_id": ObjectId(plan_id)})
    except Exception:
        return jsonify({"error": "Invalid sprint plan ID"}), 400

    if not sprint_plan:
        return jsonify({"error": "Sprint plan not found"}), 404
    if sprint_plan["status"] != "submitted":
        return jsonify({"error": "Only submitted plans can be reviewed"}), 400

    result = review_sprint_plan(
        db,
        sprint_plan=sprint_plan,
        action=action,
        feedback=data.get("feedback"),
        actor_id=data.get("reviewed_by"),
    )

    if action == "approve":
        return jsonify({
            "message": "Sprint plan approved",
            "contract_status": "active",
            "created_sprints": result["created_sprints"],
        }), 200

    return jsonify({"message": "Sprint plan revision requested", "status": "revision_requested"}), 200


@sprint_plan_bp.route("/contracts/<contract_id>/sprints", methods=["GET"])
def list_contract_sprints(contract_id):
    try:
        sprints = get_contract_sprints(get_db(), contract_id)
    except Exception:
        return jsonify({"error": "Invalid contract ID"}), 400

    return jsonify({
        "items": [serialize_sprint(sprint) for sprint in sprints],
        "total": len(sprints),
    }), 200
