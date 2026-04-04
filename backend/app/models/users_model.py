from app.extension import db

def get_users_collection():
    return db["users"]
