# app/models/freelancer_model.py — recherche par nom ET skills
from app.extension import db
from datetime import datetime, timezone
from bson import ObjectId


def get_freelancers_collection():
    return db["freelancers"]


# ── HELPERS ───────────────────────────────────────────────────────
def _get_full_name(f: dict) -> str:
    if f.get("fullName"):  return f["fullName"]
    if f.get("full_name"): return f["full_name"]
    first  = f.get("Name", "")
    family = f.get("family Name", "")
    if first or family: return f"{first} {family}".strip()
    return "Freelancer"

def _get_rate(f):   return float(f.get("hourlyRate") or f.get("hourly_rate") or 0)
def _get_rating(f): return float(f.get("rating") or f.get("stats", {}).get("rating") or 0)


# ── SERIALIZE ─────────────────────────────────────────────────────
def serialize_freelancer(f: dict, full: bool = False) -> dict:
    if not f: return {}
    created = f.get("createdAt") or f.get("created_at")
    base = {
        "id":           str(f["_id"]),
        "user_id":      str(f.get("userId") or f.get("user_id") or ""),
        "full_name":    _get_full_name(f),
        "title":        str(f.get("title") or ""),
        "avatar":       str(f.get("avatar") or f.get("profileImageUrl") or ""),
        "location":     str(f.get("location") or ""),
        "hourly_rate":  _get_rate(f),
        "category":     str(f.get("category") or ""),
        "skills":       list(f.get("skills") or []),
        "is_available": (
            f.get("availability") == "available"
            or bool(f.get("is_available"))
        ),
        "stats": {
            "rating":       _get_rating(f),
            "review_count": int(f.get("totalReviews") or f.get("stats", {}).get("review_count") or 0),
            "total_jobs":   int(f.get("completedProjects") or f.get("stats", {}).get("total_jobs") or 0),
            "total_earned": float(f.get("stats", {}).get("total_earned") or 0),
            "job_success":  float(f.get("stats", {}).get("job_success") or 0),
        },
    }
    if full:
        base.update({
            "bio":           str(f.get("bio") or ""),
            "phone":         str(f.get("phone") or ""),
            "email":         str(f.get("emailContact") or f.get("email") or ""),
            "cv_url":        str(f.get("cvUrl") or f.get("cv_url") or ""),
            "portfolio_url": str(f.get("portfolioUrl") or f.get("portfolio_url") or ""),
            "created_at":    created.isoformat() if hasattr(created, "isoformat") else "",
        })
    return base


# ── BUILD QUERY ───────────────────────────────────────────────────
def _build_query(filters: dict) -> dict:
    """
    Construit la requête MongoDB.
    La recherche par 'q' cherche :
      - Dans fullName / full_name / Name (nom du freelancer)
      - Dans skills (array) avec $elemMatch
      - Dans title
    """
    query = {}
    q = filters.get("q", "").strip()

    if q:
        # Construire les conditions de recherche
        name_conditions = [
            {"fullName":  {"$regex": q, "$options": "i"}},
            {"full_name": {"$regex": q, "$options": "i"}},
            {"Name":      {"$regex": q, "$options": "i"}},
            {"title":     {"$regex": q, "$options": "i"}},
            {"bio":       {"$regex": q, "$options": "i"}},
        ]

        # Pour skills array → utiliser $elemMatch
        skills_condition = {
            "skills": {"$elemMatch": {"$regex": q, "$options": "i"}}
        }

        # Combiner avec $or
        query["$or"] = name_conditions + [skills_condition]

    # Filtre catégorie
    if filters.get("category"):
        query["category"] = {"$regex": filters["category"], "$options": "i"}

    # Filtre localisation
    if filters.get("location"):
        query["location"] = {"$regex": filters["location"], "$options": "i"}

    # Filtre taux horaire
    if filters.get("min_rate") or filters.get("max_rate"):
        rate_q = {}
        if filters.get("min_rate"): rate_q["$gte"] = float(filters["min_rate"])
        if filters.get("max_rate"): rate_q["$lte"] = float(filters["max_rate"])
        query["hourlyRate"] = rate_q

    # Filtre disponibilité
    if filters.get("available_only") in (True, "true", "True", "1"):
        query["$or"] = query.get("$or", []) + [
            {"availability": "available"},
            {"is_available": True},
        ]

    return query


# ── SEARCH ────────────────────────────────────────────────────────
def search_freelancers(filters: dict, page: int = 1, per_page: int = 10):
    col   = get_freelancers_collection()
    query = _build_query(filters)

    sort_map = {
        "rating":      [("rating",           -1)],
        "top_success": [("completedProjects", -1)],
        "rate_asc":    [("hourlyRate",          1)],
        "rate_desc":   [("hourlyRate",         -1)],
        "newest":      [("createdAt",          -1)],
    }
    sort  = sort_map.get(filters.get("sort", "rating"), [("rating", -1)])
    skip  = (page - 1) * per_page
    total = col.count_documents(query)
    pages = (total + per_page - 1) // per_page if per_page else 1

    try:
        items = list(col.find(query).sort(sort).skip(skip).limit(per_page))
    except Exception:
        items = list(col.find(query).skip(skip).limit(per_page))

    return items, total, pages


# ── TOP RATED ─────────────────────────────────────────────────────
def get_top_rated_freelancers(limit: int = 10) -> list:
    col = get_freelancers_collection()
    try:    return list(col.find({}).sort("rating", -1).limit(limit))
    except: return list(col.find({}).limit(limit))


# ── LOCAL ─────────────────────────────────────────────────────────
def get_local_freelancers(location: str, limit: int = 10) -> list:
    col = get_freelancers_collection()
    q   = {"location": {"$regex": location, "$options": "i"}}
    try:    return list(col.find(q).sort("rating", -1).limit(limit))
    except: return list(col.find(q).limit(limit))


# ── GET BY ID ─────────────────────────────────────────────────────
def get_freelancer_by_id(freelancer_id: str) -> dict | None:
    try:    return get_freelancers_collection().find_one({"_id": ObjectId(freelancer_id)})
    except: return None


def get_freelancer_by_user_id(user_id: str) -> dict | None:
    f = get_freelancers_collection().find_one({"userId":  user_id})
    return f or get_freelancers_collection().find_one({"user_id": user_id})


# ── CREATE ────────────────────────────────────────────────────────
def create_freelancer(user_id: str, data: dict) -> ObjectId:
    col       = get_freelancers_collection()
    now       = datetime.now(timezone.utc)
    full_name = data.get("full_name", "") or data.get("fullName", "")
    rate      = float(data.get("hourly_rate", 0) or data.get("hourlyRate", 0))
    doc = {
        "userId": user_id,      "user_id": user_id,
        "fullName": full_name,  "full_name": full_name,
        "title":    data.get("title", ""),
        "bio":      data.get("bio", ""),
        "phone":    data.get("phone", ""),
        "location": data.get("location", ""),
        "hourlyRate": rate,     "hourly_rate": rate,
        "category": data.get("category", ""),
        "skills":   data.get("skills", []),
        "avatar":   data.get("avatar", ""),
        "profileImageUrl": data.get("avatar", ""),
        "availability": "available",
        "is_available":  True,
        "rating":           0.0,
        "totalReviews":     0,
        "completedProjects":0,
        "stats": {
            "total_jobs": 0, "total_earned": 0.0,
            "job_success": 0.0, "rating": 0.0, "review_count": 0,
        },
        "createdAt":  now,
        "created_at": now,
    }
    return col.insert_one(doc).inserted_id


# ── UPDATE ────────────────────────────────────────────────────────
def update_freelancer(user_id: str, data: dict) -> bool:
    update = {}
    if "full_name"   in data:
        update["fullName"]  = data["full_name"]
        update["full_name"] = data["full_name"]
    for field in ["title", "bio", "phone", "location", "category", "skills"]:
        if field in data: update[field] = data[field]
    if "hourly_rate" in data:
        update["hourlyRate"]  = float(data["hourly_rate"])
        update["hourly_rate"] = float(data["hourly_rate"])
    if "avatar" in data:
        update["avatar"]          = data["avatar"]
        update["profileImageUrl"] = data["avatar"]
    if not update:
        return False
    now = datetime.now(timezone.utc)
    update["updatedAt"]  = now
    update["updated_at"] = now
    result = get_freelancers_collection().update_one(
        {"$or": [{"userId": user_id}, {"user_id": user_id}]},
        {"$set": update}
    )
    return result.modified_count > 0