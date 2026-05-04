from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import current_app
from datetime import datetime
from bson import ObjectId
from app.services.message_service import get_messages
from app.services.pii_service import analyze_message

chat_bp = Blueprint("chat", __name__)


def _safe_object_id(value):
    try:
        return ObjectId(str(value))
    except Exception:
        return None


def _resolve_user_participant_id(raw_id):
    if not raw_id:
        return None

    raw_id = str(raw_id)
    oid = _safe_object_id(raw_id)
    if not oid:
        return raw_id

    db = current_app.db

    user = db.users.find_one({"_id": oid})
    if user:
        return str(user["_id"])

    freelancer = db.freelancers.find_one({"_id": oid})
    if freelancer and freelancer.get("userId"):
        return str(freelancer["userId"])

    client = db.clients.find_one({"_id": oid})
    if client and client.get("userId"):
        return str(client["userId"])

    return raw_id


def _participant_aliases(user_id):
    aliases = {str(user_id)}
    oid = _safe_object_id(user_id)
    if not oid:
        return list(aliases)

    db = current_app.db
    freelancer = db.freelancers.find_one({"userId": oid}, {"_id": 1})
    client = db.clients.find_one({"userId": oid}, {"_id": 1})

    if freelancer:
        aliases.add(str(freelancer["_id"]))
    if client:
        aliases.add(str(client["_id"]))

    return list(aliases)


def _build_other_user(other_id):
    db = current_app.db
    resolved_id = _resolve_user_participant_id(other_id)
    oid = _safe_object_id(resolved_id)

    user = db.users.find_one({"_id": oid}) if oid else None
    freelancer = db.freelancers.find_one({"userId": oid}) if oid else None
    client = db.clients.find_one({"userId": oid}) if oid else None
    profile = freelancer or client or {}
    user_name = ""
    if user:
        user_name = user.get("fullName") or user.get("full_name") or user.get("username") or ""

    return {
        "id": resolved_id,
        "name": profile.get("fullName") or user_name or "Utilisateur",
        "avatar": profile.get("avatar") or (user.get("avatar", "") if user else "")
    }

@chat_bp.route("/conversation", methods=["POST"])
@jwt_required()
def create_conversation():
    data = request.json or {}
    user1 = str(get_jwt_identity())
    user2 = _resolve_user_participant_id(data.get("user2"))

    if not user1 or not user2:
        return jsonify({"error": "user1 et user2 requis"}), 400

    if user1 == user2:
        return jsonify({"error": "Impossible de creer une conversation avec soi-meme"}), 400

    existing = current_app.db.conversations.find_one({
        "participants": {"$all": [user1, user2]}
    })
    if existing:
        return jsonify({"conversation_id": str(existing["_id"])})

    result = current_app.db.conversations.insert_one({
        "participants": [user1, user2],
        "last_message": None,
        "last_time": None,
        "created_at": datetime.utcnow().isoformat()
    })
    return jsonify({"conversation_id": str(result.inserted_id)}), 201


@chat_bp.route("/conversations/<user_id>", methods=["GET"])
@jwt_required()
def get_user_conversations(user_id):
    auth_user_id = str(get_jwt_identity())
    effective_user_ids = _participant_aliases(auth_user_id)

    convs = list(current_app.db.conversations.find(
        {"participants": {"$in": effective_user_ids}},
        sort=[("last_time", -1)]
    ))
    for c in convs:
        c["_id"] = str(c["_id"])
        c["participants"] = [_resolve_user_participant_id(p) for p in c.get("participants", [])]
        # enrichir avec infos de l'autre participant
        other_id = next((p for p in c["participants"] if p != auth_user_id), None)
        if other_id:
            c["other_user"] = _build_other_user(other_id)
    return jsonify({"conversations": convs})


@chat_bp.route("/messages/<conversation_id>", methods=["GET"])
@jwt_required()
def fetch_messages(conversation_id):
    return jsonify({"messages": get_messages(conversation_id)})

@chat_bp.route("/validate", methods=["POST"])
@jwt_required() 
def validate_message():
    data = request.get_json(silent=True) or {}
    text = data.get("message", "").strip()

    if not text:
        return jsonify({"allowed": True})

    result = analyze_message(text)
    contains_pii = bool(result.get("contains_pii"))

    if contains_pii:
        return jsonify({
            "allowed": False,
            "reason": result.get("explanation", ""),
            "pii_types": result.get("pii_types", []),
            "severity": result.get("severity", "medium")
        })

    return jsonify({"allowed": True})
