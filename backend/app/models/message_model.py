from app.extension import db

def get_messages_collection():
    return db["messages"]