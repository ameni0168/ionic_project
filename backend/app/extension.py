from pymongo import MongoClient

client = None
db = None

def init_db(app):
    global client, db
    client = MongoClient(app.config["MONGO_URI"])
    db = client["freelancerDB"]