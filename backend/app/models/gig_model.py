from app.extension import db

def get_gigs_collection():
    return db["gigs"]