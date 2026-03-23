from app.extension import db

def get_clients_collection():
    return db["clients"]