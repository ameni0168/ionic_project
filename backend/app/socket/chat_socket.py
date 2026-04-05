from flask_socketio import emit, join_room
from app.extension import socketio
from app.services.message_service import create_message

@socketio.on("connect")
def handle_connect():
    print("✅ client connected")
@socketio.on("join")
def handle_join(data):
    join_room(data["conversationId"])


@socketio.on("send_message")
def handle_send_message(data):
    # utiliser service
    create_message(
        data["conversationId"],
        data["senderId"],
        data["content"]
    )

    emit("receive_message", data, room=data["conversationId"])