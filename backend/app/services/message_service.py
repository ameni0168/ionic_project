from datetime import datetime
from app.extension import db  # import direct, pas current_app

def create_message(conversation_id, sender_id, content):
    message = {
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "content": content,
        "created_at": datetime.utcnow().isoformat()
    }
    db.messages.insert_one(message)
    message["_id"] = str(message["_id"])
    return message

def get_messages(conversation_id):
    messages = db.messages.find({"conversation_id": conversation_id})
    result = []
    for msg in messages:
        msg["_id"] = str(msg["_id"])
        result.append(msg)
    return result