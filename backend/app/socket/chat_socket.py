from flask_socketio import emit, join_room
from app import socketio
from app.services.mesaage_service import create_message

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