# app/services/client_service.py

from app.extension import bcrypt, db
from app.models.users_model import get_users_collection
from app.models.client_model import get_clients_collection
from bson import ObjectId
from bson.errors import InvalidId

# ─────────────────────────────
# SERIALIZER
# ─────────────────────────────
def serialize_client(client: dict) -> dict:
    if not client:
        return {}

    return {
        "id": str(client.get("_id")),
        "userId": str(client.get("userId", "")),
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


# ─────────────────────────────
# SAFE OBJECTID
# ─────────────────────────────
def safe_id(user_id):
    try:
        return ObjectId(user_id)
    except InvalidId:
        return None


# ─────────────────────────────
# GET PROFILE
# ─────────────────────────────
def get_client_profile(user_id):
    clients = get_clients_collection()
    users = get_users_collection()

    oid = safe_id(user_id)
    if not oid:
        return {"error": "Invalid ID"}, 400

    client = clients.find_one({"userId": oid})
    if not client:
        return {"error": "Profil client introuvable"}, 404

    user = users.find_one({"_id": oid})

    return {
        "user": {
            "id": str(user["_id"]) if user else "",
            "email": user.get("email", "") if user else "",
            "full_name": user.get("full_name", "") if user else "",
            "role": user.get("role", "") if user else "",
        },
        "client": serialize_client(client)
    }, 200


# ─────────────────────────────
# UPDATE PROFILE
# ─────────────────────────────
def update_client_profile(user_id: str, data: dict):
    users = get_users_collection()
    clients = get_clients_collection()

    oid = safe_id(user_id)
    if not oid:
        return {"error": "Invalid ID"}, 400

    user = users.find_one({"_id": oid})
    if not user or user.get("role") != "client":
        return {"error": "Acces non autorise"}, 403

    # update user
    if data.get("full_name"):
        users.update_one(
            {"_id": oid},
            {"$set": {"full_name": data["full_name"].strip()}}
        )

    # update client
    client_fields = ["phone", "location", "company", "website", "bio", "avatar"]
    client_data = {k: v for k, v in data.items() if k in client_fields}

    if client_data:
        clients.update_one(
            {"userId": oid},
            {"$set": client_data}
        )

    return get_client_profile(user_id)


# ─────────────────────────────
# CHANGE PASSWORD
# ─────────────────────────────
def change_client_password(user_id: str, data: dict):
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

    if not bcrypt.check_password_hash(user["password_hash"], old_pw):
        return {"error": "Ancien mot de passe incorrect"}, 400

    new_hash = bcrypt.generate_password_hash(new_pw).decode("utf-8")

    users.update_one(
        {"_id": oid},
        {"$set": {"password_hash": new_hash}}
    )

    return {"message": "Mot de passe modifie avec succes"}, 200


# ─────────────────────────────
# DASHBOARD
# ─────────────────────────────
def get_client_dashboard(user_id: str):
    users = get_users_collection()
    clients = get_clients_collection()

    oid = safe_id(user_id)
    if not oid:
        return {"error": "Invalid ID"}, 400

    user = users.find_one({"_id": oid})
    if not user:
        return {"error": "Acces non autorise"}, 403

    client = clients.find_one({"userId": oid})
    if not client:
        return {"error": "Profil client introuvable"}, 404

    active_jobs = list(
        db["jobs"].find(
            {"client_id": user_id, "status": {"$in": ["open", "in_progress"]}}
        ).limit(5)
    )

    active_contracts = list(
        db["contracts"].find(
            {"client_id": user_id, "status": "active"}
        ).limit(5)
    )

    return {
        "user": {
            "id": str(user["_id"]),
            "email": user.get("email", ""),
            "full_name": user.get("full_name", ""),
            "role": user.get("role", "")
        },
        "client": serialize_client(client),
        "stats": client.get("stats", {}),
        "active_jobs": active_jobs,
        "active_contracts": active_contracts,
    }, 200