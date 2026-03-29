from app.models.freelancer_model import get_freelancers_collection
from app.models.users_model import get_users_collection
from bson import ObjectId

freelancers_col = get_freelancers_collection()
users_col = get_users_collection()

# ─────────────────────────────
# SERIALIZER FIXED (IMPORTANT)
# ─────────────────────────────
def _serialize_freelancer(f, user=None):
    return {
        "id": str(f.get("_id")),
        "full_name": f.get("fullName", ""),
        "title": f.get("title", ""),
        "bio": f.get("bio", ""),
        "location": f.get("location", ""),
        "skills": f.get("skills", []),
        "hourly_rate": f.get("hourlyRate", 0),
        "avatar": f.get("avatar", ""),
        "is_available": f.get("isAvailable", False),

        # IMPORTANT: stats object (frontend compatible)
        "stats": {
            "rating": f.get("rating", 0),
            "review_count": f.get("reviews", 0),
            "job_success": f.get("jobSuccess", 0),
            "total_earned": f.get("earned", 0),
        },

        "email": user.get("email", "") if user else ""
    }


# ─────────────────────────────
# TOP RATED
# ─────────────────────────────
def get_top_rated_freelancers(limit=10):
    return list(
        freelancers_col.find().sort("rating", -1).limit(limit)
    )


def service_get_top_rated(limit=10):
    items = get_top_rated_freelancers(limit)
    return {
        "freelancers": [_serialize_freelancer(f) for f in items],
        "total": len(items)
    }


# ─────────────────────────────
# LOCAL (FIXED)
# ─────────────────────────────
def get_local_freelancers(location, limit=10):
    return list(
        freelancers_col.find({
            "location": {"$regex": location, "$options": "i"}
        }).limit(limit)
    )


def service_get_local(location, limit=10):
    items = get_local_freelancers(location, limit)
    return {
        "freelancers": [_serialize_freelancer(f) for f in items],
        "total": len(items),
        "location": location
    }


# ─────────────────────────────
# SEARCH (FIXED FILTERS)
# ─────────────────────────────
def service_search_freelancers(filters, page, per_page):

    query = {}

    # location (partial match FIX)
    if filters.get("location"):
        query["location"] = {
            "$regex": filters["location"],
            "$options": "i"
        }

    # category FIX (skills array)
    if filters.get("category"):
        query["skills"] = {
            "$in": [filters["category"]]
        }

    # rate filters
    if filters.get("min_rate") is not None:
        query["hourlyRate"] = query.get("hourlyRate", {})
        query["hourlyRate"]["$gte"] = filters["min_rate"]

    if filters.get("max_rate") is not None:
        query["hourlyRate"] = query.get("hourlyRate", {})
        query["hourlyRate"]["$lte"] = filters["max_rate"]

    # availability
    if filters.get("available_only"):
        query["isAvailable"] = True

    # SORT FIX
    sort_map = {
        "rating": [("rating", -1)],
        "rate_asc": [("hourlyRate", 1)],
        "rate_desc": [("hourlyRate", -1)],
        "newest": [("_id", -1)],
        "top_success": [("jobSuccess", -1)],
    }

    sort = sort_map.get(filters.get("sort", "rating"), [("rating", -1)])

    skip = (page - 1) * per_page

    items = list(
        freelancers_col.find(query)
        .sort(sort)
        .skip(skip)
        .limit(per_page)
    )

    total = freelancers_col.count_documents(query)

    return {
        "freelancers": [_serialize_freelancer(f) for f in items],
        "total": total,
        "page": page,
        "pages": max(1, (total + per_page - 1) // per_page)
    }


# ─────────────────────────────
# PROFILE
# ─────────────────────────────
def get_freelancer_profile(user_id):
    try:
        obj_id = ObjectId(user_id)
    except:
        return {"error": "Invalid ID"}, 400

    # 1️⃣ try by userId
    f = freelancers_col.find_one({"userId": obj_id})

    # 2️⃣ fallback by freelancer _id
    if not f:
        f = freelancers_col.find_one({"_id": obj_id})

    u = users_col.find_one({"_id": obj_id})

    if not f:
        return {"error": "Freelancer not found"}, 404

    return _serialize_freelancer(f, u), 200

def update_freelancer_profile(user_id, data):
    freelancers_col.update_one(
        {"userId": ObjectId(user_id)},
        {"$set": data}
    )
    return {"message": "Updated successfully"}, 200


def get_dashboard_stats(user_id):
    from datetime import datetime

    f = freelancers_col.find_one({"userId": ObjectId(user_id)})

    if not f:
        return {"error": "Freelancer not found"}, 404

    return {
        "userName": f.get("fullName", ""),
        "stats": {
            "rating": f.get("rating", 0),
            "reviews": f.get("reviews", 0),
            "activeGigs": f.get("activeGigs", 0),
            "monthlyEarnings": f.get("monthlyEarnings", 0)
        },
        "recentActivities": [],
        "updatedAt": datetime.utcnow().isoformat()
    }, 200