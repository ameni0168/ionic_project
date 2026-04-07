from flask import Blueprint, request, jsonify
from app.extension import db

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/conversations", methods=["POST"])
def create_conversation():
    data = request.json

    conversation = {
        "client_id": data["client_id"],
        "freelancer_id": data["freelancer_id"]
    }

    result = db.conversations.insert_one(conversation)

    return jsonify({
        "conversation_id": str(result.inserted_id)
    })
@chat_bp.route("/conversations/<user_id>", methods=["GET"])
def get_user_conversations(user_id):

    conversations = current_app.db.conversations

    convs = list(conversations.find({
        "participants": user_id
    }))

    for c in convs:
        c["_id"] = str(c["_id"])

    return {"conversations": convs}