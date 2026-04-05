from app.extension import db

def get_conversations_collection():
    return db["conversations"]