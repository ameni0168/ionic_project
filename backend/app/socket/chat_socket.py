from flask_socketio import emit, join_room
from app.extension import db, socketio
from app.services.message_service import create_message

@socketio.on("join")
def handle_join(data):
    join_room(data["conversationId"])

@socketio.on("send_message")
def handle_send_message(data):
    print("📨 data reçu:", data)  # ← voir exactement ce qui arrive

    # supporter les 2 formats possibles
    conversation_id = data.get("conversationId") or data.get("conversation_id")
    sender_id = data.get("senderId") or data.get("sender_id")
    content = data.get("content")

    if not all([conversation_id, sender_id, content]):
        print("❌ données manquantes:", data)
        return

    msg = create_message(conversation_id, sender_id, content)
    emit("receive_message", msg, room=conversation_id, include_self=False)