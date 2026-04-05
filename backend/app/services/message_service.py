from datetime import datetime
from flask import current_app


def create_message(conversation_id, sender_id, content):
    message = {
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "content": content,
        "created_at": datetime.utcnow()
    }

    current_app.db.messages.insert_one(message)
    return message


def get_messages(conversation_id):
    messages = current_app.db.messages.find({
        "conversation_id": conversation_id
    })

    result = []
    for msg in messages:
        msg["_id"] = str(msg["_id"])  # convertir ObjectId → string
        result.append(msg)

    return result