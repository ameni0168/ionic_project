# app/services/client_service.py
from app.extension import bcrypt, db
from app.models.users_model  import (
    get_user_by_id, update_user, serialize_user,
)
from app.models.client_model import (
    get_client_by_user_id, update_client, serialize_client,
)


# GET PROFILE
def get_client_profile(user_id: str) -> tuple[dict, int]:
    user = get_user_by_id(user_id)
    if not user:
        return {"error": "Utilisateur non trouve"}, 404
    if user.get("role") != "client":
        return {"error": "Acces reserve aux clients"}, 403
    client = get_client_by_user_id(user_id)
    if not client:
        return {"error": "Profil client introuvable"}, 404
    return {
        "user":   serialize_user(user),
        "client": serialize_client(client),
    }, 200


# UPDATE PROFILE
def update_client_profile(user_id: str, data: dict) -> tuple[dict, int]:
    user = get_user_by_id(user_id)
    if not user or user.get("role") != "client":
        return {"error": "Acces non autorise"}, 403
    if data.get("full_name"):
        update_user(user_id, {"full_name": data["full_name"].strip()})
    client_fields = ["phone", "location", "company", "website", "bio", "avatar"]
    client_data   = {k: v for k, v in data.items() if k in client_fields}
    if client_data:
        update_client(user_id, client_data)
    return get_client_profile(user_id)


# CHANGE PASSWORD
def change_client_password(user_id: str, data: dict) -> tuple[dict, int]:
    old_pw = data.get("old_password", "")
    new_pw = data.get("new_password", "")
    if not old_pw or not new_pw:
        return {"error": "Ancien et nouveau mot de passe requis"}, 400
    if len(new_pw) < 6:
        return {"error": "Minimum 6 caracteres"}, 400
    user = get_user_by_id(user_id)
    if not user:
        return {"error": "Utilisateur non trouve"}, 404
    if not bcrypt.check_password_hash(user["password_hash"], old_pw):
        return {"error": "Ancien mot de passe incorrect"}, 400
    new_hash = bcrypt.generate_password_hash(new_pw).decode("utf-8")
    update_user(user_id, {"password_hash": new_hash})
    return {"message": "Mot de passe modifie avec succes"}, 200


# DASHBOARD
def get_client_dashboard(user_id: str) -> tuple[dict, int]:
    user = get_user_by_id(user_id)
    if not user or user.get("role") != "client":
        return {"error": "Acces non autorise"}, 403
    client = get_client_by_user_id(user_id)
    if not client:
        return {"error": "Profil client introuvable"}, 404

    active_jobs = list(
        db["jobs"].find(
            {"client_id": user_id, "status": {"$in": ["open", "in_progress"]}},
            {"title": 1, "status": 1, "budget": 1, "created_at": 1}
        ).sort("created_at", -1).limit(5)
    )
    for j in active_jobs:
        j["_id"] = str(j["_id"])
        if j.get("created_at"):
            j["created_at"] = j["created_at"].isoformat()

    active_contracts = list(
        db["contracts"].find(
            {"client_id": user_id, "status": "active"},
            {"title": 1, "status": 1, "amount": 1}
        ).sort("created_at", -1).limit(5)
    )
    for c in active_contracts:
        c["_id"] = str(c["_id"])

    return {
        "user":             serialize_user(user),
        "client":           serialize_client(client),
        "stats":            client.get("stats", {}),
        "active_jobs":      active_jobs,
        "active_contracts": active_contracts,
    }, 200