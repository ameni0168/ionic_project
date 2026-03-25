from app.extension import db

def get_orders_collection():
    return db["orders"]