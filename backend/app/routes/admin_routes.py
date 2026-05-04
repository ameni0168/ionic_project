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


def _normalize_categories(value):
    if isinstance(value, list):
        items = value
    elif value is None:
        items = []
    else:
        items = [value]

    normalized = []
    for item in items:
        text = str(item).strip()
        if text and text not in normalized:
            normalized.append(text)
    return normalized


def _serialize_job(job):
    return {
        "id": str(job.get("_id")),
        "title": job.get("title", ""),
        "description": job.get("description", ""),
        "category": _normalize_categories(job.get("category", [])),
        "budget_min": job.get("budget_min", 0),
        "budget_max": job.get("budget_max", 0),
        "budget_type": job.get("budget_type", ""),
        "experience_level": job.get("experience_level", ""),
        "client_id": job.get("client_id", ""),
        "skills": job.get("skills", []),
        "deadline": job.get("deadline", ""),
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
        "category": _normalize_categories(gig.get("category", [])),
        "price": gig.get("price", 0),
        "deliveryTime": gig.get("deliveryTime", ""),
        "freelancerId": str(gig.get("freelancerId", "")),
        "status": status,
        "approval_status": approval_status,
        "review_note": gig.get("review_note", ""),
        "createdAt": gig.get("createdAt").isoformat() if gig.get("createdAt") else "",
        "reviewedAt": gig.get("reviewedAt").isoformat() if gig.get("reviewedAt") else "",
    }


def _serialize_user(user, profile=None):
    profile = profile or {}
    created_at = user.get("createdAt")
    is_active = user.get("is_active", True)

    return {
        "id": str(user.get("_id")),
        "email": user.get("email", ""),
        "role": user.get("role", ""),
        "is_verified": bool(user.get("is_verified", profile.get("is_verified", False))),
        "full_name": (
            profile.get("fullName")
            or user.get("full_name")
            or user.get("name")
            or ""
        ),
        "phone": profile.get("phone", ""),
        "location": profile.get("location", ""),
        "company": profile.get("companyName", ""),
        "portfolioUrl": profile.get("portfolioUrl", ""),
        "bio": profile.get("bio", ""),
        "is_active": is_active,
        "account_status": user.get("account_status", "active" if is_active else "disabled"),
        "createdAt": created_at.isoformat() if created_at else "",
    }


def _safe_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


def _extract_display_name(user, profile=None, fallback=""):
    profile = profile or {}
    return (
        profile.get("fullName")
        or profile.get("companyName")
        or user.get("full_name")
        or user.get("name")
        or user.get("email")
        or fallback
    )


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

    enriched_jobs = []
    for job in jobs:
        serialized = _serialize_job(job)
        owner_name = serialized.get("client_id", "")
        client_user_id = _safe_object_id(serialized.get("client_id"))
        if client_user_id:
            user = db.users.find_one({"_id": client_user_id}) or {}
            profile = db.clients.find_one({"userId": client_user_id}) or {}
            owner_name = _extract_display_name(user, profile, owner_name)
        serialized["owner_name"] = owner_name
        enriched_jobs.append(serialized)

    enriched_gigs = []
    for gig in gigs:
        serialized = _serialize_gig(gig)
        owner_name = serialized.get("freelancerId", "")
        freelancer_profile_id = _safe_object_id(serialized.get("freelancerId"))
        if freelancer_profile_id:
            profile = db.freelancers.find_one({"_id": freelancer_profile_id}) or {}
            user_id = profile.get("userId")
            user = db.users.find_one({"_id": user_id}) if user_id else {}
            owner_name = _extract_display_name(user or {}, profile, owner_name)
        serialized["owner_name"] = owner_name
        enriched_gigs.append(serialized)

    return jsonify(
        {
            "jobs": enriched_jobs,
            "gigs": enriched_gigs,
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


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_all_users():
    error = _require_admin()
    if error:
        return error

    db = current_app.db
    role = (request.args.get("role") or "").strip().lower()
    status = (request.args.get("status") or "").strip().lower()
    search = (request.args.get("search") or "").strip().lower()

    query = {}
    if role in ["client", "freelancer"]:
        query["role"] = role

    users = list(db.users.find(query).sort("createdAt", -1))
    client_profiles = {item.get("userId"): item for item in db.clients.find({})}
    freelancer_profiles = {item.get("userId"): item for item in db.freelancers.find({})}

    results = []
    for user in users:
        profile = (
            freelancer_profiles.get(user.get("_id"))
            if user.get("role") == "freelancer"
            else client_profiles.get(user.get("_id"))
        )
        serialized = _serialize_user(user, profile)

        if status == "active" and not serialized["is_active"]:
            continue
        if status == "disabled" and serialized["is_active"]:
            continue

        if search:
            haystack = " ".join(
                [
                    serialized.get("email", ""),
                    serialized.get("full_name", ""),
                    serialized.get("phone", ""),
                    serialized.get("company", ""),
                    serialized.get("location", ""),
                ]
            ).lower()
            if search not in haystack:
                continue

        results.append(serialized)

    return jsonify({"users": results, "total": len(results)}), 200


@admin_bp.route("/users/<user_id>/status", methods=["PATCH"])
@jwt_required()
def update_user_status(user_id):
    error = _require_admin()
    if error:
        return error

    if user_id == "admin-static":
        return jsonify({"error": "Le compte admin statique ne peut pas etre modifie"}), 400

    data = request.get_json() or {}
    is_active = data.get("is_active")

    if not isinstance(is_active, bool):
        return jsonify({"error": "Le champ 'is_active' doit etre un booleen"}), 400

    user_object_id = _safe_object_id(user_id)
    if not user_object_id:
        return jsonify({"error": "User ID invalide"}), 400

    db = current_app.db
    result = db.users.update_one(
        {"_id": user_object_id},
        {
            "$set": {
                "is_active": is_active,
                "account_status": "active" if is_active else "disabled",
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    if result.matched_count == 0:
        return jsonify({"error": "Utilisateur introuvable"}), 404

    user = db.users.find_one({"_id": user_object_id})
    profile = None
    if user.get("role") == "client":
        profile = db.clients.find_one({"userId": user_object_id})
    elif user.get("role") == "freelancer":
        profile = db.freelancers.find_one({"userId": user_object_id})

    message = "Compte active avec succes" if is_active else "Compte desactive avec succes"
    return jsonify({"message": message, "user": _serialize_user(user, profile)}), 200


@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_admin_stats():
    error = _require_admin()
    if error:
        return error

    db = current_app.db
    active_filter = {
        "$or": [
            {"is_active": True},
            {"is_active": {"$exists": False}},
        ]
    }

    total_users = db.users.count_documents({})
    active_freelancers = db.users.count_documents({"role": "freelancer", **active_filter})
    active_clients = db.users.count_documents({"role": "client", **active_filter})
    pending_jobs = db.jobs.count_documents({"approval_status": "pending"})
    pending_gigs = db.gigs.count_documents({"status": "pending"})
    blocked_users = db.users.count_documents({"is_active": False})

    return jsonify(
        {
            "user_total": total_users,
            "freelancers_actif": active_freelancers,
            "clients_actif": active_clients,
            "propositions_en_attente": pending_jobs + pending_gigs,
            "jobs_en_attente": pending_jobs,
            "gigs_en_attente": pending_gigs,
            "comptes_bloques": blocked_users,
        }
    ), 200
