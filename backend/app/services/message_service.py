from datetime import datetime
from flask import current_app

def create_message(conversation_id, sender_id, content):
    message = {
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "content": content,
        "created_at": datetime.utcnow().isoformat()
    }
    result = current_app.db.messages.insert_one(message)
    message["_id"] = str(result.inserted_id)
    return message

def get_messages(conversation_id):
    msgs = current_app.db.messages.find(
        {"conversation_id": conversation_id},
        sort=[("created_at", 1)]
    )
    result = []
    for msg in msgs:
        msg["_id"] = str(msg["_id"])
        result.append(msg)
    return result