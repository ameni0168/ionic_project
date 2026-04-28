from flask import Blueprint, jsonify, request, current_app

from app.services.payment_service import (
    fund_sprint,
    list_contract_payments,
    summarize_contract_payments,
    serialize_payment,
)


payment_bp = Blueprint("payment_bp", __name__)


def get_db():
    return current_app.db


@payment_bp.route("/sprints/<sprint_id>/fund", methods=["POST"])
def fund_contract_sprint(sprint_id):
    payload = request.get_json() or {}
    if "client_id" not in payload or "amount_cents" not in payload:
        return jsonify({"error": "Fields 'client_id' and 'amount_cents' are required"}), 400

    try:
        payment, error = fund_sprint(
            get_db(),
            sprint_id=sprint_id,
            client_id=payload["client_id"],
            amount_cents=payload["amount_cents"],
            payment_method_id=payload.get("payment_method_id"),
        )
    except Exception:
        return jsonify({"error": "Invalid sprint ID"}), 400

    if error:
        message, code = error
        return jsonify({"error": message}), code

    return jsonify({
        "message": "Sprint funded into escrow",
        "payment": serialize_payment(payment),
    }), 200


@payment_bp.route("/contracts/<contract_id>/payments", methods=["GET"])
def get_contract_payments(contract_id):
    try:
        payments = list_contract_payments(get_db(), contract_id)
    except Exception:
        return jsonify({"error": "Invalid contract ID"}), 400

    return jsonify({
        "items": [serialize_payment(payment) for payment in payments],
        "summary": summarize_contract_payments(payments),
    }), 200
