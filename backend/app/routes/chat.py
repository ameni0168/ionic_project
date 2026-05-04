from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import current_app
from datetime import datetime
from bson import ObjectId
from app.services.message_service import get_messages

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/conversation", methods=["POST"])
@jwt_required()
def create_conversation():
    data = request.json
    user1 = get_jwt_identity()
    user2 = data.get("user2")

    if not user1 or not user2:
        return jsonify({"error": "user1 et user2 requis"}), 400

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
    auth_user_id = get_jwt_identity()
    effective_user_id = auth_user_id

    convs = list(current_app.db.conversations.find(
        {"participants": effective_user_id},
        sort=[("last_time", -1)]
    ))
    for c in convs:
        c["_id"] = str(c["_id"])
        # enrichir avec infos de l'autre participant
        other_id = next((p for p in c["participants"] if p != effective_user_id), None)
        if other_id:
            other = current_app.db.users.find_one({"_id": ObjectId(other_id)}) if ObjectId.is_valid(other_id) else None
            c["other_user"] = {
                "id": other_id,
                "name": other.get("fullName") or other.get("full_name") or other.get("username", "Utilisateur") if other else "Utilisateur",
                "avatar": other.get("avatar", "") if other else ""
            }
    return jsonify({"conversations": convs})


@chat_bp.route("/messages/<conversation_id>", methods=["GET"])
@jwt_required()
def fetch_messages(conversation_id):
    return jsonify({"messages": get_messages(conversation_id)})