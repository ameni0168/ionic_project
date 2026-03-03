from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# ------------------ REGISTER CLIENT ------------------
def register_client(mongo,name, email, password, phone=None):

    if mongo.db.users.find_one({"email": email}):
        return None, "Email déjà utilisé"

    hashed_password = generate_password_hash(password)

    user_data = {
        "email": email,
        "password": hashed_password,
        "role": "client",
        "created_at": datetime.utcnow()
    }

    try:
        user_result = mongo.db.users.insert_one(user_data)
        user_id = user_result.inserted_id

        client_data = {
            "user_id": user_id,
            "name": name,
            "phone": phone,
            "created_at": datetime.utcnow()
        }

        mongo.db.clients.insert_one(client_data)
        return user_id, None

    except Exception as e:
        if 'user_id' in locals():
            mongo.db.users.delete_one({"_id": user_id})
        return None, str(e)

# ------------------ REGISTER FREELANCER ------------------
def register_freelancer(mongo,name, email, password, phone=None):

    if mongo.db.users.find_one({"email": email}):
        return None, "Email déjà utilisé"

    hashed_password = generate_password_hash(password)

    user_data = {
        "email": email,
        "password": hashed_password,
        "role": "freelancer",
        "created_at": datetime.utcnow()
    }

    try:
        user_result = mongo.db.users.insert_one(user_data)
        user_id = user_result.inserted_id

        freelancer_data = {
            "user_id": user_id,
            "name": name,
            "phone": phone,
            "skills": [],
            "bio": "",
            "created_at": datetime.utcnow()
        }

        mongo.db.freelancers.insert_one(freelancer_data)
        return user_id, None

    except Exception as e:
        if 'user_id' in locals():
            mongo.db.users.delete_one({"_id": user_id})
        return None, str(e)

# ------------------ LOGIN ------------------
def authenticate_user(mongo,email, password):
    user = mongo.db.users.find_one({"email": email})

    if user and check_password_hash(user["password"], password):
        return user

    return None