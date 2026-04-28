from flask import Blueprint, jsonify, request, current_app
from bson import ObjectId

from app.services.contract_service import get_contract_by_id, list_contracts, serialize_contract


contract_bp = Blueprint("contract_bp", __name__)


def get_db():
    return current_app.db


@contract_bp.route("/", methods=["POST"])
def create_contract():
    data = request.get_json() or {}
    required = ["job_id", "proposal_id", "client_id", "freelancer_id"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    db = get_db()
    job = db.jobs.find_one({"_id": ObjectId(data["job_id"])})
    proposal = db.proposals.find_one({"_id": ObjectId(data["proposal_id"])})
    if not job or not proposal:
        return jsonify({"error": "Job or proposal not found"}), 404

    existing = db.contracts.find_one({"proposal_id": proposal["_id"]})
    if existing:
        return jsonify({"error": "Contract already exists for this proposal"}), 400

    from app.services.contract_service import create_contract as service_create_contract

    contract = service_create_contract(
        db,
        job=job,
        proposal=proposal,
        currency=data.get("currency", "USD"),
        actor_id=data.get("client_id"),
    )
    return jsonify({
        "message": "Contract created",
        "contract": {
            "_id": str(contract["_id"]),
            "status": contract["status"],
        },
    }), 201


@contract_bp.route("/<contract_id>", methods=["GET"])
def get_contract(contract_id):
    try:
        contract = get_contract_by_id(get_db(), contract_id)
    except Exception:
        return jsonify({"error": "Invalid contract ID"}), 400

    if not contract:
        return jsonify({"error": "Contract not found"}), 404

    return jsonify(serialize_contract(contract)), 200


@contract_bp.route("/", methods=["GET"])
def get_contract_list():
    filters = {
        "client_id": request.args.get("client_id"),
        "freelancer_id": request.args.get("freelancer_id"),
        "status": request.args.get("status"),
        "job_id": request.args.get("job_id"),
    }
    contracts = list_contracts(get_db(), filters)
    return jsonify({
        "items": [serialize_contract(contract) for contract in contracts],
        "total": len(contracts),
    }), 200
