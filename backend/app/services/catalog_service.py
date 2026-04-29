# app/services/catalog_service.py

from app.models.gig_model import get_gigs_collection
from app.models.freelancer_model import get_freelancers_collection
from app.extension import db
from bson import ObjectId
from datetime import datetime


# ─────────────────────────────────────────────
# SERIALIZE GIG
# ─────────────────────────────────────────────
def _serialize_gig(gig: dict, with_freelancer: bool = False) -> dict:
    result = {
        "id": str(gig.get("_id")),
        "freelancer_id": str(gig.get("freelancerId", "")),
        "title": gig.get("title", ""),
        "description": gig.get("description", ""),
        "price": float(gig.get("price", 0)),
        "category": gig.get("category", ""),
        "delivery_time": gig.get("deliveryTime", ""),
        "status": gig.get("status", "active"),
        "orders_completed": gig.get("ordersCompleted", 0),
        "rating": float(gig.get("rating", 0)),
        "review_count": int(gig.get("reviewCount", 0)),
        "images": gig.get("images", []),
        "tags": gig.get("tags", []),
        "created_at": gig.get("createdAt").isoformat() if gig.get("createdAt") else "",
    }

    # ── Freelancer
    if with_freelancer and gig.get("freelancerId"):
        f = _find_freelancer(gig["freelancerId"])
        if f:
            result["freelancer"] = {
                "id": str(f.get("_id")),
                "full_name": f.get("fullName") or f.get("full_name") or "Freelancer",
                "avatar": f.get("avatar", ""),
                "title": f.get("title", ""),
                "location": f.get("location", ""),
                "rating": float(f.get("rating", 0)),
                "total_jobs": int(f.get("completedProjects", 0)),
                "is_available": f.get("availability") == "available",
            }

    return result


# ─────────────────────────────────────────────
# FIND FREELANCER
# ─────────────────────────────────────────────
def _find_freelancer(fid):
    col = get_freelancers_collection()

    try:
        return col.find_one({"_id": ObjectId(str(fid))})
    except:
        return col.find_one({"userId": str(fid)})


# ─────────────────────────────────────────────
# LIST GIGS
# ─────────────────────────────────────────────
def service_list_gigs(filters: dict, page: int = 1, per_page: int = 10) -> dict:

    col = get_gigs_collection()

    # ✅ IMPORTANT FIX
    query = {
        "$or": [
            {"status": {"$exists": False}},
            {"status": {"$regex": "^active$", "$options": "i"}}
        ]
    }

    # ── SEARCH
    q = filters.get("q", "").strip()
    if q:
        query["$and"] = [{
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"category": {"$regex": q, "$options": "i"}},
            ]
        }]

    # ── CATEGORY
    if filters.get("category"):
        query["category"] = {"$regex": filters["category"], "$options": "i"}

    # ── PRICE
    if filters.get("min_price") or filters.get("max_price"):
        price_query = {}
        if filters.get("min_price"):
            price_query["$gte"] = float(filters["min_price"])
        if filters.get("max_price"):
            price_query["$lte"] = float(filters["max_price"])
        query["price"] = price_query

    # ── SORT
    sort_map = {
        "popular": [("ordersCompleted", -1)],
        "rating": [("rating", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "newest": [("createdAt", -1)],
    }

    sort = sort_map.get(filters.get("sort", "popular"))

    skip = (page - 1) * per_page

    print("DEBUG QUERY:", query)  # 🔥 DEBUG

    total = col.count_documents(query)

    items = list(
        col.find(query)
           .sort(sort)
           .skip(skip)
           .limit(per_page)
    )

    pages = (total + per_page - 1) // per_page if per_page else 1

    return {
        "gigs": [_serialize_gig(g, True) for g in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
        "has_next": page < pages,
    }


# ─────────────────────────────────────────────
# GET DETAIL
# ─────────────────────────────────────────────
def service_get_gig_detail(gig_id: str):

    col = get_gigs_collection()

    try:
        gig = col.find_one({"_id": ObjectId(gig_id)})
    except:
        return {"error": "Invalid ID"}, 400

    if not gig:
        return {"error": "Not found"}, 404

    data = _serialize_gig(gig, True)

    reviews = list(db["reviews"].find({"gig_id": gig_id}).limit(5))

    data["reviews"] = [{
        "rating": r.get("rating", 0),
        "comment": r.get("comment", "")
    } for r in reviews]

    return data, 200


# ─────────────────────────────────────────────
# FEATURED
# ─────────────────────────────────────────────
def service_get_featured(limit: int = 6):

    col = get_gigs_collection()

    items = list(
        col.find({
            "$or": [
                {"status": {"$exists": False}},
                {"status": {"$regex": "^active$", "$options": "i"}}
            ]
        })
           .sort([("rating", -1), ("ordersCompleted", -1)])
           .limit(limit)
    )

    return {
        "gigs": [_serialize_gig(g, True) for g in items],
        "total": len(items),
    }

# ─────────────────────────────────────────────
# GET BY CATEGORY
# ─────────────────────────────────────────────
def service_get_by_category(category: str, limit: int = 10):

    col = get_gigs_collection()

    query = {
        "$and": [
            {
                "$or": [
                    {"status": {"$exists": False}},
                    {"status": {"$regex": "^active$", "$options": "i"}}
                ]
            },
            {
                "category": {"$regex": category, "$options": "i"}
            }
        ]
    }

    items = list(
        col.find(query)
           .sort("ordersCompleted", -1)
           .limit(limit)
    )

    return {
        "gigs": [_serialize_gig(g, True) for g in items],
        "total": len(items),
        "category": category,
    }

# ─────────────────────────────────────────────
# ORDER GIG
# ─────────────────────────────────────────────
def service_order_gig(gig_id: str, client_id: str, data: dict):

    col = get_gigs_collection()

    # ── vérifier gig
    try:
        gig = col.find_one({"_id": ObjectId(gig_id)})
    except:
        return {"error": "Invalid gig ID"}, 400

    if not gig:
        return {"error": "Gig not found"}, 404

    # ── créer commande
    order_doc = {
        "gigId": gig["_id"],
        "clientId": client_id,
        "freelancerId": gig.get("freelancerId"),

        "title": gig.get("title", ""),
        "price": float(gig.get("price", 0)),

        "status": "pending",
        "message": data.get("message", ""),
        "requirements": data.get("requirements", ""),

        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    order_id = db["orders"].insert_one(order_doc).inserted_id

    return {
        "message": "Order created successfully",
        "order_id": str(order_id),
        "status": "pending"
    }, 201
