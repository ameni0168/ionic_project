from app.extension import db
from datetime import datetime, timezone
from bson import ObjectId


# ── COLLECTION ───────────────────────────────────────────────
def get_clients_collection():
    return db["clients"]


# ── CREATE ───────────────────────────────────────────────────
def create_client(user_id: str, data: dict) -> str:
    col = get_clients_collection()
    now = datetime.now(timezone.utc)

    doc = {
        "userId": str(user_id),   # ✅ uniformisé (IMPORTANT pour Ionic)
        "phone": data.get("phone", ""),
        "location": data.get("location", ""),
        "company": data.get("company", ""),
        "website": data.get("website", ""),
        "bio": data.get("bio", ""),
        "avatar": data.get("avatar", ""),

        "stats": {
            "activeProjects": 0,
            "totalSpent": 0.0,
            "totalContracts": 0,
            "avgRating": 0.0
        },

        "createdAt": now,
        "updatedAt": now
    }

    result = col.insert_one(doc)
    return str(result.inserted_id)   # ✅ string pour API


# ── READ ─────────────────────────────────────────────────────
def get_client_by_user_id(user_id: str) -> dict | None:
    return get_clients_collection().find_one({"userId": str(user_id)})


# ── UPDATE ───────────────────────────────────────────────────
def update_client(user_id: str, data: dict) -> bool:
    col = get_clients_collection()

    allowed_fields = {
        "phone", "location", "company",
        "website", "bio", "avatar"
    }

    update_data = {
        k: v for k, v in data.items()
        if k in allowed_fields and v is not None
    }

    if not update_data:
        return False

    update_data["updatedAt"] = datetime.now(timezone.utc)

    result = col.update_one(
        {"userId": str(user_id)},
        {"$set": update_data}
    )

    return result.modified_count > 0


# ── SERIALIZE (IMPORTANT IONIC) ──────────────────────────────
def serialize_client(client: dict) -> dict:
    if not client:
        return {}

    return {
        "id": str(client.get("_id")),
        "userId": client.get("userId", ""),
        "phone": client.get("phone", ""),
        "location": client.get("location", ""),
        "company": client.get("company", ""),
        "website": client.get("website", ""),
        "bio": client.get("bio", ""),
        "avatar": client.get("avatar", ""),

        "stats": client.get("stats", {}),

        "createdAt": client["createdAt"].isoformat() if client.get("createdAt") else "",
        "updatedAt": client["updatedAt"].isoformat() if client.get("updatedAt") else "",
    }