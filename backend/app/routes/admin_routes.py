from datetime import datetime

from bson import ObjectId
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, jwt_required

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Acces reserve a l admin"}), 403
    return None


def _serialize_job(job):
    return {
        "id": str(job.get("_id")),
        "title": job.get("title", ""),
        "description": job.get("description", ""),
        "category": job.get("category", ""),
        "budget_min": job.get("budget_min", 0),
        "budget_max": job.get("budget_max", 0),
        "budget_type": job.get("budget_type", ""),
        "experience_level": job.get("experience_level", ""),
        "client_id": job.get("client_id", ""),
        "skills": job.get("skills", []),
        "status": job.get("status", "open"),
        "approval_status": job.get("approval_status", "pending"),
        "review_note": job.get("review_note", ""),
        "created_at": job.get("created_at").isoformat() if job.get("created_at") else "",
        "reviewed_at": job.get("reviewed_at").isoformat() if job.get("reviewed_at") else "",
    }


def _serialize_gig(gig):
    status = gig.get("status", "pending")
    approval_status = "approved" if status == "active" else status
    return {
        "id": str(gig.get("_id")),
        "title": gig.get("title", ""),
        "description": gig.get("description", ""),
        "category": gig.get("category", ""),
        "price": gig.get("price", 0),
        "deliveryTime": gig.get("deliveryTime", ""),
        "freelancerId": str(gig.get("freelancerId", "")),
        "status": status,
        "approval_status": approval_status,
        "review_note": gig.get("review_note", ""),
        "createdAt": gig.get("createdAt").isoformat() if gig.get("createdAt") else "",
        "reviewedAt": gig.get("reviewedAt").isoformat() if gig.get("reviewedAt") else "",
    }


@admin_bp.route("/review-items", methods=["GET"])
@jwt_required()
def get_review_items():
    error = _require_admin()
    if error:
        return error

    requested = (request.args.get("approval_status") or "pending").strip()
    gig_status = {"approved": "active", "rejected": "rejected", "pending": "pending"}.get(
        requested, "pending"
    )

    db = current_app.db
    jobs = list(db.jobs.find({"approval_status": requested}).sort("created_at", -1))
    gigs = list(db.gigs.find({"status": gig_status}).sort("createdAt", -1))

    return jsonify(
        {
            "jobs": [_serialize_job(job) for job in jobs],
            "gigs": [_serialize_gig(gig) for gig in gigs],
            "totals": {"jobs": len(jobs), "gigs": len(gigs)},
        }
    ), 200


@admin_bp.route("/jobs/<job_id>/approval", methods=["PATCH"])
@jwt_required()
def review_job(job_id):
    error = _require_admin()
    if error:
        return error

    data = request.get_json() or {}
    new_status = (data.get("approval_status") or "").strip()
    note = (data.get("note") or "").strip()

    if new_status not in ["pending", "approved", "rejected"]:
        return jsonify({"error": "approval_status invalide"}), 400

    db = current_app.db
    try:
        result = db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "approval_status": new_status,
                    "review_note": note,
                    "reviewed_at": datetime.utcnow(),
                }
            },
        )
    except Exception:
        return jsonify({"error": "Job ID invalide"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Job introuvable"}), 404

    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    return jsonify({"message": "Validation job mise a jour", "job": _serialize_job(job)}), 200


@admin_bp.route("/gigs/<gig_id>/approval", methods=["PATCH"])
@jwt_required()
def review_gig(gig_id):
    error = _require_admin()
    if error:
        return error

    data = request.get_json() or {}
    approval_status = (data.get("approval_status") or "").strip()
    note = (data.get("note") or "").strip()

    if approval_status not in ["pending", "approved", "rejected"]:
        return jsonify({"error": "approval_status invalide"}), 400

    mapped_status = {"pending": "pending", "approved": "active", "rejected": "rejected"}[
        approval_status
    ]

    db = current_app.db
    try:
        result = db.gigs.update_one(
            {"_id": ObjectId(gig_id)},
            {
                "$set": {
                    "status": mapped_status,
                    "review_note": note,
                    "reviewedAt": datetime.utcnow(),
                }
            },
        )
    except Exception:
        return jsonify({"error": "Gig ID invalide"}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Gig introuvable"}), 404

    gig = db.gigs.find_one({"_id": ObjectId(gig_id)})
    return jsonify({"message": "Validation gig mise a jour", "gig": _serialize_gig(gig)}), 200
