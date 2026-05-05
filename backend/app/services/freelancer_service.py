from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from werkzeug.security import check_password_hash, generate_password_hash

from app.models.freelancer_model import get_freelancers_collection
from app.models.users_model import get_users_collection
from app.models.gig_model import get_gigs_collection
from app.models.order_model import get_orders_collection
from app.extension import db


def safe_id(user_id):
    try:
        return ObjectId(user_id)
    except InvalidId:
        return None


def _user_for_freelancer(f):
    uid = f.get("userId")
    if not uid:
        return None
    return get_users_collection().find_one({"_id": uid})


def serialize_talent_card(f):
    """Liste / recherche (page Talent, dashboard client)."""
    user = _user_for_freelancer(f)
    rating = f.get("rating", 0) or 0
    reviews = f.get("reviews", 0) or 0
    return {
        "id": str(f.get("_id")),
        "profile_id": str(f.get("_id")),
        "user_id": str(f.get("userId")) if f.get("userId") else "",
        "full_name": f.get("fullName", ""),
        "title": f.get("title", ""),
        "bio": f.get("bio", ""),
        "location": f.get("location", ""),
        "skills": f.get("skills", []),
        "hourly_rate": f.get("hourlyRate", 0),
        "avatar": f.get("avatar", ""),
        "is_available": f.get("isAvailable", False),
        "stats": {
            "rating": rating,
            "review_count": reviews,
            "job_success": f.get("jobSuccess", 0),
            "total_earned": f.get("earned", 0),
        },
        "email": user.get("email", "") if user else "",
    }


def serialize_freelancer_profile(freelancer, user):
    u = user or {}
    created = freelancer.get("createdAt", datetime.utcnow())
    created_str = created.isoformat() if hasattr(created, "isoformat") else str(created)
    return {
        "id": str(freelancer["_id"]),
        "profile_id": str(freelancer["_id"]),
        "user_id": str(freelancer.get("userId")) if freelancer.get("userId") else "",
        "fullName": freelancer.get("fullName", ""),
        "title": freelancer.get("title", ""),
        "bio": freelancer.get("bio", ""),
        "portfolioUrl": freelancer.get("portfolioUrl", ""),
        "location": freelancer.get("location", ""),
        "phone": freelancer.get("phone", ""),
        "hourlyRate": freelancer.get("hourlyRate", 0),
        "skills": freelancer.get("skills", []),
        "rating": freelancer.get("rating", 0.0),
        "reviews": freelancer.get("reviews", 0),
        "completedProjects": freelancer.get("completedProjects", 0),
        "email": u.get("email", ""),
        "createdAt": created_str,
    }


def get_top_rated_freelancers(limit=10):
    col = get_freelancers_collection()
    return list(col.find().sort("rating", -1).limit(limit))


def service_get_top_rated(limit=10):
    items = get_top_rated_freelancers(limit)
    return {
        "freelancers": [serialize_talent_card(f) for f in items],
        "total": len(items),
    }


def get_local_freelancers(location, limit=10):
    col = get_freelancers_collection()
    return list(
        col.find({"location": {"$regex": location, "$options": "i"}}).limit(limit)
    )


def service_get_local(location, limit=10):
    items = get_local_freelancers(location, limit)
    return {
        "freelancers": [serialize_talent_card(f) for f in items],
        "total": len(items),
        "location": location,
    }


def service_search_freelancers(filters, page, per_page):
    col = get_freelancers_collection()
    query = {}

    if filters.get("location"):
        query["location"] = {"$regex": filters["location"], "$options": "i"}

    if filters.get("category"):
        query["skills"] = {"$in": [filters["category"]]}

    if filters.get("min_rate") is not None:
        query.setdefault("hourlyRate", {})
        query["hourlyRate"]["$gte"] = filters["min_rate"]

    if filters.get("max_rate") is not None:
        query.setdefault("hourlyRate", {})
        query["hourlyRate"]["$lte"] = filters["max_rate"]

    if filters.get("available_only"):
        query["isAvailable"] = True

    q_text = (filters.get("q") or "").strip()
    if q_text:
        query["$or"] = [
            {"fullName": {"$regex": q_text, "$options": "i"}},
            {"title": {"$regex": q_text, "$options": "i"}},
            {"bio": {"$regex": q_text, "$options": "i"}},
        ]

    sort_map = {
        "rating": [("rating", -1)],
        "rate_asc": [("hourlyRate", 1)],
        "rate_desc": [("hourlyRate", -1)],
        "newest": [("_id", -1)],
        "top_success": [("jobSuccess", -1)],
    }
    sort = sort_map.get(filters.get("sort", "rating"), [("rating", -1)])

    skip = (page - 1) * per_page

    items = list(col.find(query).sort(sort).skip(skip).limit(per_page))
    total = col.count_documents(query)

    return {
        "freelancers": [serialize_talent_card(f) for f in items],
        "total": total,
        "page": page,
        "pages": max(1, (total + per_page - 1) // per_page),
    }


def get_freelancer_profile(user_id):
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return {"error": "Invalid ID"}, 400

    freelancers = get_freelancers_collection()
    users = get_users_collection()

    freelancer = freelancers.find_one({"userId": obj_id})
    if not freelancer:
        freelancer = freelancers.find_one({"_id": obj_id})

    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    uid = freelancer.get("userId")
    user = users.find_one({"_id": uid}) if uid else None
    if not user:
        user = users.find_one({"_id": obj_id})
    if not user:
        user = {}

    return serialize_freelancer_profile(freelancer, user), 200


def update_freelancer_profile(user_id, data):
    freelancers = get_freelancers_collection()

    allowed = [
        "fullName",
        "title",
        "bio",
        "portfolioUrl",
        "location",
        "phone",
        "hourlyRate",
        "skills",
    ]
    update_data = {k: v for k, v in data.items() if k in allowed}

    if "skills" in update_data:
        if not isinstance(update_data["skills"], list):
            return {"error": "skills doit être une liste"}, 400
        for s in update_data["skills"]:
            if not isinstance(s, dict) or "name" not in s or "level" not in s:
                return {"error": "Chaque skill doit avoir 'name' et 'level'"}, 400
            try:
                lvl = int(s["level"])
                if not 0 <= lvl <= 100:
                    raise ValueError
            except (ValueError, TypeError):
                return {"error": "level doit être entre 0 et 100"}, 400

    if "hourlyRate" in update_data:
        try:
            update_data["hourlyRate"] = float(update_data["hourlyRate"])
            if update_data["hourlyRate"] < 0:
                raise ValueError
        except (ValueError, TypeError):
            return {"error": "hourlyRate invalide"}, 400

    if not update_data:
        return {"error": "Aucun champ valide à mettre à jour"}, 400

    update_data["updatedAt"] = datetime.utcnow()
    result = freelancers.update_one(
        {"userId": ObjectId(user_id)},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        return {"error": "Profil introuvable"}, 404

    return {"message": "Profil mis à jour avec succès"}, 200


def get_dashboard_stats(user_id):
    freelancers = get_freelancers_collection()
    gigs_col = get_gigs_collection()
    orders_col = get_orders_collection()
    payments_col = db["payments"]

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    freelancer_id = freelancer["_id"]

    all_gigs = list(gigs_col.find({"freelancerId": freelancer_id}))
    active_gigs = [g for g in all_gigs if g.get("status") == "active"]
    gig_ids = [g["_id"] for g in all_gigs]

    now = datetime.utcnow()
    first_of_month = datetime(now.year, now.month, 1)
    monthly_orders = list(
        orders_col.find(
            {
                "gigId": {"$in": gig_ids},
                "status": "completed",
                "completedAt": {"$gte": first_of_month},
                "payment_id": None,
            }
        )
    )
    freelancer_payment_ids = [str(ObjectId(user_id)), ObjectId(user_id), str(freelancer_id), freelancer_id]
    monthly_payments = list(
        payments_col.find(
            {
                "freelancer_id": {"$in": freelancer_payment_ids},
                "status": "released",
                "released_at": {"$gte": first_of_month},
            }
        )
    )
    monthly_order_earnings = sum(
        float(o.get("price", o.get("amount", 0)) or 0) for o in monthly_orders
    )
    monthly_contract_earnings = sum(
        int(p.get("amount_cents", 0) or 0) / 100 for p in monthly_payments
    )
    monthly_earnings = round(monthly_order_earnings + monthly_contract_earnings, 2)

    total_completed = orders_col.count_documents(
        {"gigId": {"$in": gig_ids}, "status": "completed"}
    )

    recent_orders = list(
        orders_col.find({"gigId": {"$in": gig_ids}})
        .sort("createdAt", -1)
        .limit(5)
    )
    gig_titles = {str(g["_id"]): g.get("title", "") for g in all_gigs}

    recent_activities = []
    for o in recent_orders:
        status = o.get("status", "pending")
        recent_activities.append(
            {
                "type": "order",
                "title": f"Order — {gig_titles.get(str(o.get('gigId','')), '')}",
                "description": f"${o.get('price', o.get('amount', 0))} · {o.get('clientName', 'Client')}",
                "time": o.get("createdAt", datetime.utcnow()).isoformat(),
                "icon": "bag-check" if status == "completed" else "time",
                "color": "success" if status == "completed" else "warning",
            }
        )

    if not recent_activities:
        for g in list(
            gigs_col.find({"freelancerId": freelancer_id})
            .sort("createdAt", -1)
            .limit(4)
        ):
            recent_activities.append(
                {
                    "type": "gig",
                    "title": g.get("title", ""),
                    "description": f"Gig — {g.get('category', '')}",
                    "time": g.get("createdAt", datetime.utcnow()).isoformat(),
                    "icon": "briefcase",
                    "color": "primary",
                }
            )

    return {
        "userName": freelancer.get("fullName", ""),
        "stats": {
            "activeGigs": len(active_gigs),
            "totalCompleted": total_completed,
            "rating": freelancer.get("rating", 0.0),
            "reviews": freelancer.get("reviews", 0),
            "monthlyEarnings": monthly_earnings,
        },
        "recentActivities": recent_activities,
    }, 200
def change_freelancer_password(user_id: str, data: dict):
    users = get_users_collection()

    oid = safe_id(user_id)
    if not oid:
        return {"error": "Invalid ID"}, 400

    old_pw = data.get("old_password", "")
    new_pw = data.get("new_password", "")

    if not old_pw or not new_pw:
        return {"error": "Ancien et nouveau mot de passe requis"}, 400

    if len(new_pw) < 6:
        return {"error": "Minimum 6 caracteres"}, 400

    user = users.find_one({"_id": oid})
    if not user:
        return {"error": "Utilisateur non trouve"}, 404

    ph = user.get("password_hash")
    if not ph or not check_password_hash(ph, old_pw):
        return {"error": "Ancien mot de passe incorrect"}, 400

    new_hash = generate_password_hash(new_pw)

    users.update_one({"_id": oid}, {"$set": {"password_hash": new_hash}})

    return {"message": "Mot de passe modifie avec succes"}, 200
