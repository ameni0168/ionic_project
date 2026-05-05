# app/services/client_service.py

from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from werkzeug.security import check_password_hash, generate_password_hash

from app.models.users_model import get_users_collection
from app.models.client_model import get_clients_collection
from app.models.order_model import get_orders_collection
from app.extension import db


def serialize_client(client: dict) -> dict:
    if not client:
        return {}

    created = client.get("createdAt")
    updated = client.get("updatedAt")
    return {
        "id": str(client.get("_id")),
        "userId": str(client.get("userId", "")),
        "phone": client.get("phone", ""),
        "location": client.get("location", ""),
        "company": client.get("companyName") or client.get("company", ""),
        "website": client.get("website", ""),
        "bio": client.get("bio", ""),
        "avatar": client.get("avatar", ""),
        "stats": client.get("stats", {}),
        "createdAt": created.isoformat() if hasattr(created, "isoformat") else "",
        "updatedAt": updated.isoformat() if hasattr(updated, "isoformat") else "",
    }


def safe_id(user_id):
    try:
        return ObjectId(user_id)
    except InvalidId:
        return None


def _display_name(user: dict, client: dict) -> str:
    return (
        (user.get("full_name") or "").strip()
        or client.get("fullName", "")
        or client.get("companyName", "")
        or ""
    )


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
            "full_name": _display_name(user or {}, client),
            "role": user.get("role", "") if user else "",
        },
        "client": serialize_client(client),
    }, 200


def update_client_profile(user_id: str, data: dict):
    users = get_users_collection()
    clients = get_clients_collection()

    oid = safe_id(user_id)
    if not oid:
        return {"error": "Invalid ID"}, 400

    user = users.find_one({"_id": oid})
    if not user or user.get("role") != "client":
        return {"error": "Acces non autorise"}, 403

    if data.get("full_name"):
        users.update_one(
            {"_id": oid},
            {"$set": {"full_name": data["full_name"].strip()}},
        )
        clients.update_one(
            {"userId": oid},
            {"$set": {"fullName": data["full_name"].strip()}},
        )

    client_updates = {}
    if data.get("phone") is not None:
        client_updates["phone"] = data["phone"]
    if data.get("location") is not None:
        client_updates["location"] = data["location"]
    if data.get("company") is not None:
        client_updates["companyName"] = data["company"]
    if data.get("website") is not None:
        client_updates["website"] = data["website"]
    if data.get("bio") is not None:
        client_updates["bio"] = data["bio"]
    if data.get("avatar") is not None:
        client_updates["avatar"] = data["avatar"]

    if client_updates:
        client_updates["updatedAt"] = datetime.utcnow()
        clients.update_one({"userId": oid}, {"$set": client_updates})

    return get_client_profile(user_id)


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

    ph = user.get("password_hash")
    if not ph or not check_password_hash(ph, old_pw):
        return {"error": "Ancien mot de passe incorrect"}, 400

    new_hash = generate_password_hash(new_pw)

    users.update_one({"_id": oid}, {"$set": {"password_hash": new_hash}})

    return {"message": "Mot de passe modifie avec succes"}, 200


def get_client_dashboard(user_id: str):
    users = get_users_collection()
    clients = get_clients_collection()
    orders_col = get_orders_collection()
    payments_col = db["payments"]

    oid = safe_id(user_id)
    if not oid:
        return {"error": "Invalid ID"}, 400

    user = users.find_one({"_id": oid})
    if not user:
        return {"error": "Acces non autorise"}, 403

    client = clients.find_one({"userId": oid})
    if not client:
        return {"error": "Profil client introuvable"}, 404

    query_active = {
        "clientId": oid,
        "status": {"$in": ["pending", "in_progress", "submitted"]},
    }
    active_cursor = list(
        orders_col.find(query_active).sort("createdAt", -1).limit(5)
    )

    active_jobs = []
    for o in active_cursor:
        st = o.get("status", "pending")
        ui_status = "open" if st == "pending" else st
        created = o.get("createdAt")
        active_jobs.append(
            {
                "_id": str(o["_id"]),
                "id": str(o["_id"]),
                "title": o.get("title") or o.get("gigTitle") or "Commande",
                "status": ui_status,
                "created_at": created.isoformat()
                if hasattr(created, "isoformat")
                else str(created or ""),
                "avatar": "",
            }
        )

    completed_orders = list(orders_col.find({
        "clientId": oid,
        "status": "completed",
        "payment_id": None,
    }))
    order_total_spent = sum(
        float(x.get("price", x.get("amount", 0)) or 0) for x in completed_orders
    )
    released_payments = list(
        payments_col.find(
            {
                "client_id": {"$in": [str(oid), oid]},
                "status": "released",
            }
        )
    )
    contract_total_spent = sum(
        int(x.get("amount_cents", 0) or 0) / 100 for x in released_payments
    )
    total_spent = order_total_spent + contract_total_spent

    stats = {
        "active_projects": orders_col.count_documents(query_active),
        "total_spent": round(total_spent, 2),
        "total_contracts": orders_col.count_documents({"clientId": oid}),
    }

    return {
        "user": {
            "id": str(user["_id"]),
            "email": user.get("email", ""),
            "full_name": _display_name(user, client),
            "role": user.get("role", ""),
        },
        "client": serialize_client(client),
        "stats": stats,
        "active_jobs": active_jobs,
        "active_contracts": [],
    }, 200
