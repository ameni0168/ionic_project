# app/services/catalog_service.py

from datetime import datetime

from bson import ObjectId

from app.extension import db
from app.models.freelancer_model import get_freelancers_collection
from app.models.gig_model import get_gigs_collection


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


def _category_regex_clause(value: str) -> dict:
    return {
        "$or": [
            {"category": {"$regex": value, "$options": "i"}},
            {"category": {"$elemMatch": {"$regex": value, "$options": "i"}}},
        ]
    }


def _serialize_gig(gig: dict, with_freelancer: bool = False) -> dict:
    result = {
        "id": str(gig.get("_id")),
        "freelancer_id": str(gig.get("freelancerId", "")),
        "title": gig.get("title", ""),
        "description": gig.get("description", ""),
        "price": float(gig.get("price", 0)),
        "category": _normalize_categories(gig.get("category", [])),
        "delivery_time": gig.get("deliveryTime", ""),
        "status": gig.get("status", "active"),
        "orders_completed": gig.get("ordersCompleted", 0),
        "rating": float(gig.get("rating", 0)),
        "review_count": int(gig.get("reviewCount", 0)),
        "images": gig.get("images", []),
        "tags": gig.get("tags", []),
        "created_at": gig.get("createdAt").isoformat() if gig.get("createdAt") else "",
    }

    if with_freelancer and gig.get("freelancerId"):
        freelancer = _find_freelancer(gig["freelancerId"])
        if freelancer:
            result["freelancer"] = {
                "id": str(freelancer.get("_id")),
                "full_name": freelancer.get("fullName") or freelancer.get("full_name") or "Freelancer",
                "avatar": freelancer.get("avatar", ""),
                "title": freelancer.get("title", ""),
                "location": freelancer.get("location", ""),
                "rating": float(freelancer.get("rating", 0)),
                "total_jobs": int(freelancer.get("completedProjects", 0)),
                "is_available": freelancer.get("availability") == "available",
            }

    return result


def _find_freelancer(fid):
    col = get_freelancers_collection()

    try:
        return col.find_one({"_id": ObjectId(str(fid))})
    except Exception:
        return col.find_one({"userId": str(fid)})


def service_list_gigs(filters: dict, page: int = 1, per_page: int = 10) -> dict:
    col = get_gigs_collection()

    query = {
        "$or": [
            {"status": {"$exists": False}},
            {"status": {"$regex": "^active$", "$options": "i"}},
        ]
    }

    and_clauses = []

    q = filters.get("q", "").strip()
    if q:
        and_clauses.append(
            {
                "$or": [
                    {"title": {"$regex": q, "$options": "i"}},
                    {"description": {"$regex": q, "$options": "i"}},
                    *_category_regex_clause(q)["$or"],
                ]
            }
        )

    if filters.get("category"):
        and_clauses.append(_category_regex_clause(filters["category"]))

    if filters.get("min_price") or filters.get("max_price"):
        price_query = {}
        if filters.get("min_price"):
            price_query["$gte"] = float(filters["min_price"])
        if filters.get("max_price"):
            price_query["$lte"] = float(filters["max_price"])
        query["price"] = price_query

    if and_clauses:
        query["$and"] = and_clauses

    sort_map = {
        "popular": [("ordersCompleted", -1)],
        "rating": [("rating", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "newest": [("createdAt", -1)],
    }

    sort = sort_map.get(filters.get("sort", "popular"))
    skip = (page - 1) * per_page
    total = col.count_documents(query)

    items = list(col.find(query).sort(sort).skip(skip).limit(per_page))
    pages = (total + per_page - 1) // per_page if per_page else 1

    return {
        "gigs": [_serialize_gig(gig, True) for gig in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
        "has_next": page < pages,
    }


def service_get_gig_detail(gig_id: str):
    col = get_gigs_collection()

    try:
        gig = col.find_one({"_id": ObjectId(gig_id)})
    except Exception:
        return {"error": "Invalid ID"}, 400

    if not gig:
        return {"error": "Not found"}, 404

    data = _serialize_gig(gig, True)
    reviews = list(db["reviews"].find({"gig_id": gig_id}).limit(5))
    data["reviews"] = [{"rating": review.get("rating", 0), "comment": review.get("comment", "")} for review in reviews]

    return data, 200


def service_get_featured(limit: int = 6):
    col = get_gigs_collection()

    items = list(
        col.find(
            {
                "$or": [
                    {"status": {"$exists": False}},
                    {"status": {"$regex": "^active$", "$options": "i"}},
                ]
            }
        )
        .sort([("rating", -1), ("ordersCompleted", -1)])
        .limit(limit)
    )

    return {
        "gigs": [_serialize_gig(gig, True) for gig in items],
        "total": len(items),
    }


def service_get_by_category(category: str, limit: int = 10):
    col = get_gigs_collection()

    query = {
        "$and": [
            {
                "$or": [
                    {"status": {"$exists": False}},
                    {"status": {"$regex": "^active$", "$options": "i"}},
                ]
            },
            _category_regex_clause(category),
        ]
    }

    items = list(col.find(query).sort("ordersCompleted", -1).limit(limit))

    return {
        "gigs": [_serialize_gig(gig, True) for gig in items],
        "total": len(items),
        "category": category,
    }


def service_order_gig(gig_id: str, client_id: str, data: dict):
    col = get_gigs_collection()
    try:
        client_oid = ObjectId(client_id)
    except Exception:
        return {"error": "Invalid client ID"}, 400

    try:
        gig = col.find_one({"_id": ObjectId(gig_id)})
    except Exception:
        return {"error": "Invalid gig ID"}, 400

    if not gig:
        return {"error": "Gig not found"}, 404

    order_doc = {
        "gigId": gig["_id"],
        "clientId": client_oid,
        "freelancerId": gig.get("freelancerId"),
        "title": gig.get("title", ""),
        "price": float(gig.get("price", 0)),
        "currency": gig.get("currency", "USD"),

        "status": "pending",
        "payment_status": "unpaid",
        "payment_id": None,
        "message": data.get("message", ""),
        "requirements": data.get("requirements", ""),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    order_id = db["orders"].insert_one(order_doc).inserted_id

    return {
        "message": "Order created successfully",
        "order_id": str(order_id),
        "status": "pending",
        "payment_status": "unpaid",
    }, 201
