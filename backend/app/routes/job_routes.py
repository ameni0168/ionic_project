from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from app.models.job_model import job_schema

job_bp = Blueprint("job_bp", __name__)


def get_db():
    return current_app.db


def serialize(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


@job_bp.route("/", methods=["POST"])
def create_job():
    data = request.get_json()

    required = [
        "title",
        "description",
        "budget_min",
        "budget_max",
        "budget_type",
        "deadline",
        "category",
        "experience_level",
        "client_id",
    ]

    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    new_job = job_schema(
        title=data["title"],
        description=data["description"],
        budget_min=data["budget_min"],
        budget_max=data["budget_max"],
        budget_type=data["budget_type"],
        deadline=data["deadline"],
        category=data["category"],
        experience_level=data["experience_level"],
        client_id=data["client_id"],
        skills=data.get("skills", []),
    )

    db = get_db()
    result = db.jobs.insert_one(new_job)
    new_job["_id"] = str(result.inserted_id)
    return jsonify({"message": "Job created successfully", "job": new_job}), 201


@job_bp.route("/", methods=["GET"])
def get_all_jobs():
    query = {"approval_status": request.args.get("approval_status", "approved")}
    for key in ["status", "category", "experience_level", "budget_type"]:
        if request.args.get(key):
            query[key] = request.args.get(key)

    db = get_db()
    jobs = [serialize(j) for j in db.jobs.find(query).sort("created_at", -1)]
    return jsonify({"jobs": jobs, "total": len(jobs)}), 200


# Avant /<job_id> pour ne pas prendre "client" comme id Mongo
@job_bp.route("/client/<client_id>", methods=["GET"])
def get_jobs_by_client(client_id):
    db = get_db()
    jobs = [
        serialize(j)
        for j in db.jobs.find({"client_id": client_id}).sort("created_at", -1)
    ]
    return jsonify({"jobs": jobs, "total": len(jobs)}), 200


@job_bp.route("/<job_id>", methods=["GET"])
def get_job(job_id):
    try:
        db = get_db()
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return jsonify({"error": "Invalid job ID"}), 400

    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify(serialize(job)), 200


@job_bp.route("/<job_id>", methods=["PUT"])
def update_job(job_id):
    data = request.get_json()
    allowed = [
        "title",
        "description",
        "budget_min",
        "budget_max",
        "budget_type",
        "deadline",
        "category",
        "experience_level",
        "skills",
        "status",
    ]

    update_data = {k: v for k, v in data.items() if k in allowed}
    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        db = get_db()
        db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": update_data})
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return jsonify({"error": "Invalid job ID"}), 400

    return jsonify({"message": "Job updated", "job": serialize(job)}), 200


@job_bp.route("/<job_id>", methods=["DELETE"])
def delete_job(job_id):
    try:
        db = get_db()
        result = db.jobs.delete_one({"_id": ObjectId(job_id)})
    except Exception:
        return jsonify({"error": "Invalid job ID"}), 400

    if result.deleted_count == 0:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({"message": "Job deleted successfully"}), 200


@job_bp.route("/<job_id>/status", methods=["PATCH"])
def update_job_status(job_id):
    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["open", "in_progress", "closed"]:
        return jsonify({"error": "Invalid status"}), 400

    try:
        db = get_db()
        result = db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": new_status}},
        )
    except Exception:
        return jsonify({"error": "Invalid job ID"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({"message": f"Job status updated to '{new_status}'"}), 200
