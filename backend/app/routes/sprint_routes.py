from flask import Blueprint, jsonify, request, current_app

from app.services.sprint_plan_service import serialize_sprint
from app.services.sprint_service import start_sprint, submit_sprint, review_sprint


sprint_bp = Blueprint("sprint_bp", __name__)


def get_db():
    return current_app.db


@sprint_bp.route("/<sprint_id>/start", methods=["POST"])
def start_contract_sprint(sprint_id):
    try:
        sprint, error = start_sprint(
            get_db(),
            sprint_id,
            actor_id=(request.get_json(silent=True) or {}).get("started_by"),
        )
    except Exception:
        return jsonify({"error": "Invalid sprint ID"}), 400

    if error:
        message, code = error
        return jsonify({"error": message}), code

    return jsonify({
        "message": "Sprint started",
        "sprint": serialize_sprint(sprint),
    }), 200


@sprint_bp.route("/<sprint_id>/submit", methods=["POST"])
def submit_contract_sprint(sprint_id):
    payload = request.get_json() or {}
    try:
        sprint, error = submit_sprint(
            get_db(),
            sprint_id,
            submission_note=payload.get("submission_note"),
            attachments=payload.get("attachments", []),
            actor_id=payload.get("submitted_by"),
        )
    except Exception:
        return jsonify({"error": "Invalid sprint ID"}), 400

    if error:
        message, code = error
        return jsonify({"error": message}), code

    return jsonify({
        "message": "Sprint submitted for review",
        "status": sprint["status"],
        "sprint": serialize_sprint(sprint),
    }), 200


@sprint_bp.route("/<sprint_id>/review", methods=["POST"])
def review_contract_sprint(sprint_id):
    payload = request.get_json() or {}
    action = payload.get("action")
    if action not in ["approve", "request_changes"]:
        return jsonify({"error": "Invalid action"}), 400

    try:
        sprint, payment, error = review_sprint(
            get_db(),
            sprint_id,
            action=action,
            feedback=payload.get("feedback"),
            actor_id=payload.get("reviewed_by"),
        )
    except Exception:
        return jsonify({"error": "Invalid sprint ID"}), 400

    if error:
        message, code = error
        return jsonify({"error": message}), code

    if action == "approve":
        return jsonify({
            "message": "Sprint approved and payment released" if payment else "Sprint approved",
            "sprint_status": sprint["status"],
            "payment_status": payment["status"] if payment else None,
            "sprint": serialize_sprint(sprint),
        }), 200

    return jsonify({
        "message": "Sprint changes requested",
        "sprint_status": sprint["status"],
        "sprint": serialize_sprint(sprint),
    }), 200
