from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from app.models.proposal_model import proposal_schema
from app.services.contract_service import create_contract
from app.services.activity_log_service import log_activity

proposal_bp = Blueprint("proposal_bp", __name__)


def get_db():
    return current_app.db


def serialize(doc):
    """Convertit récursivement tous les ObjectId en strings dans un document."""
    if doc is None:
        return doc
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, dict):
        return {k: serialize(v) for k, v in doc.items()}
    if isinstance(doc, list):
        return [serialize(item) for item in doc]
    return doc


def _find_user(db, user_id):
    """user_id peut être ObjectId ou string hex Mongo."""
    if user_id is None:
        return None
    if isinstance(user_id, ObjectId):
        return db.users.find_one({"_id": user_id})
    try:
        return db.users.find_one({"_id": ObjectId(str(user_id))})
    except (InvalidId, TypeError, ValueError):
        return None


def _freelancer_display_name(user_doc):
    if not user_doc:
        return "Unknown"
    return (
        user_doc.get("full_name")
        or user_doc.get("name")
        or user_doc.get("email")
        or "Unknown"
    )


@proposal_bp.route("/", methods=["POST"])
def create_proposal():
    data = request.get_json()

    required = ["job_id", "freelancer_id", "client_id", "message", "price"]

    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    db = get_db()
    job = db.jobs.find_one({"_id": ObjectId(data["job_id"])})
    if not job:
        return jsonify({"error": "Job not found"}), 404

    existing_proposal = db.proposals.find_one({
        "job_id": ObjectId(data["job_id"]),
        "freelancer_id": data["freelancer_id"],
    })

    if existing_proposal:
        return jsonify({"error": "You have already applied for this job"}), 400

    new_proposal = proposal_schema(
        job_id=ObjectId(data["job_id"]),
        freelancer_id=data["freelancer_id"],
        client_id=data["client_id"],
        message=data["message"],
        price=data["price"],
        estimated_days=data.get("estimated_days"),
        attachments=data.get("attachments", []),
    )

    result = db.proposals.insert_one(new_proposal)
    new_proposal["_id"] = str(result.inserted_id)

    return jsonify({
        "message": "Proposal submitted successfully",
        "proposal": serialize(new_proposal),
    }), 201


@proposal_bp.route("/job/<job_id>", methods=["GET"])
def get_proposals_by_job(job_id):
    try:
        db = get_db()
        proposals = list(
            db.proposals.find({"job_id": ObjectId(job_id)}).sort("created_at", -1)
        )

        for proposal in proposals:
            freelancer = _find_user(db, proposal.get("freelancer_id"))
            if freelancer:
                proposal["freelancer"] = {
                    "_id": str(freelancer["_id"]),
                    "name": _freelancer_display_name(freelancer),
                    "email": freelancer.get("email", ""),
                    "skills": freelancer.get("skills", []),
                }

        return jsonify({
            "proposals": [serialize(p) for p in proposals],
            "total": len(proposals),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@proposal_bp.route("/freelancer/<freelancer_id>", methods=["GET"])
def get_proposals_by_freelancer(freelancer_id):
    try:
        db = get_db()
        proposals = list(
            db.proposals.find({"freelancer_id": freelancer_id}).sort("created_at", -1)
        )

        for proposal in proposals:
            job = db.jobs.find_one({"_id": proposal["job_id"]})
            if job:
                proposal["job"] = {
                    "_id": str(job["_id"]),
                    "title": job.get("title", "Unknown"),
                    "description": job.get("description", ""),
                    "budget_min": job.get("budget_min"),
                    "budget_max": job.get("budget_max"),
                }

        return jsonify({
            "proposals": [serialize(p) for p in proposals],
            "total": len(proposals),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# Chemins statiques avant /<proposal_id> (évite ambiguïtés)
@proposal_bp.route("/client/<client_id>/jobs-with-proposals", methods=["GET"])
def get_client_jobs_with_proposals(client_id):
    try:
        db = get_db()
        current_app.logger.info(f"Fetching jobs with proposals for client: {client_id}")

        jobs = list(db.jobs.find({"client_id": client_id}).sort("created_at", -1))
        current_app.logger.info(f"Found {len(jobs)} jobs for client {client_id}")

        result = []
        for job in jobs:
            try:
                proposals = list(
                    db.proposals.find({"job_id": job["_id"]}).sort("created_at", -1)
                )

                for proposal in proposals:
                    freelancer = _find_user(db, proposal.get("freelancer_id"))
                    if freelancer:
                        proposal["freelancer"] = {
                            "_id": str(freelancer["_id"]),
                            "name": _freelancer_display_name(freelancer),
                            "email": freelancer.get("email", ""),
                        }

                result.append({
                    "job": serialize(dict(job)),
                    "proposals": [serialize(p) for p in proposals],
                    "proposals_count": len(proposals),
                })
            except Exception as job_err:
                current_app.logger.error(f"Error processing job {job.get('_id')}: {job_err}")
                continue

        return jsonify({"jobs": result, "total": len(result)}), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_client_jobs_with_proposals: {e}")
        return jsonify({"error": str(e)}), 500


@proposal_bp.route("/<proposal_id>", methods=["PATCH"])
def update_proposal_status(proposal_id):
    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["accepted", "rejected"]:
        return jsonify({"error": "Invalid status. Must be 'accepted' or 'rejected'"}), 400

    try:
        db = get_db()
        proposal = db.proposals.find_one({"_id": ObjectId(proposal_id)})
        if not proposal:
            return jsonify({"error": "Proposal not found"}), 404

        if new_status == "accepted":
            job = db.jobs.find_one({"_id": proposal["job_id"]})

            if not job:
                return jsonify({"error": "Associated job not found"}), 404

            existing_contract = db.contracts.find_one({"proposal_id": proposal["_id"]})
            if existing_contract:
                return jsonify({"error": "A contract already exists for this proposal"}), 400

            contract = create_contract(
                db,
                job=job,
                proposal=proposal,
                currency=data.get("currency", proposal.get("currency", "USD")),
                actor_id=proposal.get("client_id"),
            )

        db.proposals.update_one(
            {"_id": ObjectId(proposal_id)},
            {"$set": {
                "status": new_status,
                "updated_at": datetime.utcnow(),
            }},
        )

        if new_status == "accepted":
            db.proposals.update_many(
                {
                    "job_id": proposal["job_id"],
                    "_id": {"$ne": ObjectId(proposal_id)},
                },
                {"$set": {
                    "status": "rejected",
                    "updated_at": datetime.utcnow(),
                }},
            )

            log_activity(
                db,
                entity_type="job",
                entity_id=job["_id"],
                event_type="proposal_accepted",
                actor_id=proposal.get("client_id"),
                meta={
                    "proposal_id": proposal["_id"],
                    "contract_id": contract["_id"],
                },
            )

        return jsonify({
            "message": f"Proposal {new_status} successfully",
            "status": new_status,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@proposal_bp.route("/<proposal_id>", methods=["DELETE"])
def delete_proposal(proposal_id):
    try:
        db = get_db()
        proposal = db.proposals.find_one({"_id": ObjectId(proposal_id)})

        if not proposal:
            return jsonify({"error": "Proposal not found"}), 404

        if proposal["status"] != "pending":
            return jsonify({"error": "Only pending proposals can be deleted"}), 400

        result = db.proposals.delete_one({"_id": ObjectId(proposal_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Proposal not found"}), 404

        return jsonify({"message": "Proposal deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
