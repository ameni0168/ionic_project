from app.extension import db

def get_freelancers_collection():
    return db["freelancers"]