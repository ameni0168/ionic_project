# app/services/talent_service.py
from app.extension import db
from app.models.freelancer_model import (
    search_freelancers,
    get_local_freelancers,
    get_top_rated_freelancers,
    get_freelancer_by_id,
    serialize_freelancer,
)


def service_search_talents(filters: dict, page: int, per_page: int) -> dict:
    items, total, pages = search_freelancers(filters, page, per_page)
    return {
        "talents":  [serialize_freelancer(f) for f in items],
        "total":    total,
        "page":     page,
        "per_page": per_page,
        "pages":    pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }


def service_get_top_rated(limit: int = 10) -> dict:
    items = get_top_rated_freelancers(limit)
    return {
        "talents": [serialize_freelancer(f) for f in items],
        "total":   len(items),
    }


def service_get_local(location: str, limit: int = 10) -> dict:
    items = get_local_freelancers(location, limit)
    return {
        "talents":  [serialize_freelancer(f) for f in items],
        "total":    len(items),
        "location": location,
    }


def service_get_talent_by_id(talent_id: str):
    f = get_freelancer_by_id(talent_id)
    if not f:
        return None, "Talent non trouvé"

    reviews_raw = list(
        db["reviews"].find({"talent_id": talent_id})
                     .sort("created_at", -1).limit(5)
    )
    reviews = []
    for r in reviews_raw:
        reviews.append({
            "id":            str(r["_id"]),
            "client_name":   str(r.get("client_name",   "")),
            "client_avatar": str(r.get("client_avatar", "")),
            "rating":        float(r.get("rating", 0)),
            "comment":       str(r.get("comment", "")),
            "created_at":    r["created_at"].isoformat() if r.get("created_at") else "",
        })

    return {
        "talent":        serialize_freelancer(f, full=True),
        "reviews":       reviews,
        "reviews_total": db["reviews"].count_documents({"talent_id": talent_id}),
    }, None