# app/models/users_model.py
from app.extension import db          # ← ton db existant
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.errors import DuplicateKeyError


def get_users_collection():
    return db["users"]


# ── CREATE ────────────────────────────────────────────────────────
def create_user(data: dict) -> ObjectId:
    col = get_users_collection()
    now = datetime.now(timezone.utc)
    doc = {
        "username":      data["username"].lower().strip(),
        "email":         data["email"].lower().strip(),
        "password_hash": data["password_hash"],
        "full_name":     data["full_name"].strip(),
        "role":          data["role"],        # "client" | "freelancer"
        "is_active":     True,
        "is_verified":   False,
        "created_at":    now,
        "last_login":    None,
    }
    result = col.insert_one(doc)
    return result.inserted_id


# ── READ ──────────────────────────────────────────────────────────
def get_user_by_email(email: str) -> dict | None:
    return get_users_collection().find_one(
        {"email": email.lower().strip()}
    )


def get_user_by_id(user_id: str) -> dict | None:
    try:
        return get_users_collection().find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def get_user_by_username(username: str) -> dict | None:
    return get_users_collection().find_one(
        {"username": username.lower().strip()}
    )


# ── UPDATE ────────────────────────────────────────────────────────
def update_last_login(user_id: str):
    get_users_collection().update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )


def update_user(user_id: str, data: dict) -> bool:
    allowed = ["full_name", "password_hash"]
    update  = {k: v for k, v in data.items() if k in allowed}
    if not update:
        return False
    result = get_users_collection().update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update}
    )
    return result.modified_count > 0


# ── SERIALIZE ─────────────────────────────────────────────────────
def serialize_user(user: dict) -> dict:
    if not user:
        return {}
    return {
        "id":          str(user["_id"]),
        "username":    user.get("username", ""),
        "email":       user.get("email", ""),
        "full_name":   user.get("full_name", ""),
        "role":        user.get("role", ""),
        "is_active":   user.get("is_active", True),
        "is_verified": user.get("is_verified", False),
        "created_at":  user["created_at"].isoformat() if user.get("created_at") else "",
        "last_login":  user["last_login"].isoformat() if user.get("last_login") else None,
    }