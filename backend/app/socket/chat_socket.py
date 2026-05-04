from flask import current_app
from flask_socketio import emit, join_room
from app.extension import socketio
from app.services.message_service import create_message
from datetime import datetime

@socketio.on("join")
def handle_join(data):
    conversation_id = data.get("conversationId")
    if conversation_id:
        join_room(conversation_id)
        print(f"✅ joined room: {conversation_id}")

@socketio.on("send_message")
def handle_send_message(data):
    print("📨 data reçu:", data)

    conversation_id = data.get("conversationId") or data.get("conversation_id")
    sender_id = data.get("senderId") or data.get("sender_id")
    content = data.get("content")

    if not all([conversation_id, sender_id, content]):
        print("❌ données manquantes:", data)
        return

    msg = create_message(conversation_id, sender_id, content)

    # mettre à jour last_message dans la conversation
    current_app.db.conversations.update_one(
        {"_id": __import__("bson").ObjectId(conversation_id)},
        {"$set": {"last_message": content, "last_time": msg["created_at"]}}
    )

    emit("receive_message", msg, room=conversation_id, include_self=False)