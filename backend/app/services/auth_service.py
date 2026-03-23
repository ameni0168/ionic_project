<<<<<<< HEAD
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# ------------------ REGISTER CLIENT ------------------
def register_client(mongo,name, email, password, phone=None):
=======
from werkzeug.security import check_password_hash, generate_password_hash
from app.models.client_model import get_clients_collection
from app.models.users_model import get_users_collection
from datetime import datetime
import re


def register_client(data):
>>>>>>> 8e9ab5e5e08b882918d64f1290ff769345df9c88

    if mongo.db.users.find_one({"email": email}):
        return None, "Email déjà utilisé"

<<<<<<< HEAD
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
=======
    # 1️⃣ Vérifier champs obligatoires
    if not all([full_name, email, phone, location, password, confirm_password]):
        return {"error": "Tous les champs obligatoires doivent être remplis"}, 400

    # 2️⃣ Vérifier email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return {"error": "Email invalide"}, 400

    # 3️⃣ Vérifier password match
    if password != confirm_password:
        return {"error": "Les mots de passe ne correspondent pas"}, 400

    # 4️⃣ Vérifier longueur password
    if len(password) < 8:
        return {"error": "Mot de passe trop court (min 8 caractères)"}, 400

    users = get_users_collection()
    clients = get_clients_collection()

    # 5️⃣ Vérifier email unique DANS USERS (IMPORTANT)
    if users.find_one({"email": email}):
        return {"error": "Email déjà utilisé"}, 400

    # 6️⃣ Hasher password
    hashed_password = generate_password_hash(password)

    # 7️⃣ Créer user (AUTH)
    user_doc = {
        "email": email,
        "password": hashed_password,
        "role": "client",
        "createdAt": datetime.utcnow()
    }

    user_id = users.insert_one(user_doc).inserted_id

    # 8️⃣ Créer profil client (BUSINESS)
    client_doc = {
        "userId": user_id,
        "fullName": full_name,
        "phone": phone,
        "location": location,
        "companyName": company,
        "createdAt": datetime.utcnow()
    }

    clients.insert_one(client_doc)

    return {"message": "Compte client créé avec succès"}, 201
def login_user(data):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "Email et mot de passe requis"}, 400

    users = get_users_collection()
    user = users.find_one({"email": email})
    
    if not user or not check_password_hash(user["password"], password):
        return {"error": "Email ou mot de passe incorrect"}, 401

    # tu peux ici renvoyer directement le rôle
    role = user.get("role")  # 'client' ou 'freelancer'

    return {
        "message": "Login success",
        "userId": str(user["_id"]),
        "role": role
    }, 200
>>>>>>> 8e9ab5e5e08b882918d64f1290ff769345df9c88
