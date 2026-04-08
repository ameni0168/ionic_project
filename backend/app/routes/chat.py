from flask import Blueprint, request, jsonify
from flask_socketio import emit, join_room
from app.extension import db, socketio
from app.services.message_service import create_message, get_messages
from datetime import datetime

chat_bp = Blueprint("chat", __name__)

# ── HTTP ──────────────────────────────────────────────────

@chat_bp.route("/conversation", methods=["POST"])
def create_conversation():
    data = request.json
    client_id = data["client_id"]
    freelancer_id = data["freelancer_id"]

    existing = db.conversations.find_one({
        "participants": {"$all": [client_id, freelancer_id]}
    })
    if existing:
        return jsonify({"conversation_id": str(existing["_id"])})

    result = db.conversations.insert_one({
        "participants": [client_id, freelancer_id],
        "created_at": datetime.utcnow().isoformat()
    })
    return jsonify({"conversation_id": str(result.inserted_id)}), 201


@chat_bp.route("/conversations/<user_id>", methods=["GET"])
def get_user_conversations(user_id):
    convs = list(db.conversations.find({"participants": user_id}))
    for c in convs:
        c["_id"] = str(c["_id"])
    return jsonify({"conversations": convs})


@chat_bp.route("/messages/<conversation_id>", methods=["GET"])
def fetch_messages(conversation_id):
    return jsonify({"messages": get_messages(conversation_id)})


# ── SOCKET EVENTS ─────────────────────────────────────────

@socketio.on("join")
def handle_join(data):
    join_room(data["conversationId"])


@socketio.on("send_message")
def handle_send_message(data):
    msg = create_message(
        data["conversationId"],
        data["senderId"],
        data["content"]
    )
    # émettre à tous dans la room SAUF l'émetteur
    emit("receive_message", msg, room=data["conversationId"], include_self=False)