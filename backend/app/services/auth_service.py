from werkzeug.security import generate_password_hash, check_password_hash
from app.models.client_model import get_clients_collection
from app.models.users_model import get_users_collection
from datetime import datetime
import re


# =========================
# REGISTER CLIENT
# =========================
def register_client(data):

    full_name = data.get("fullName")
    email = data.get("email")
    phone = data.get("phone")
    location = data.get("location")
    company = data.get("companyName")
    password = data.get("password")
    confirm_password = data.get("confirmPassword")

    # required fields
    if not all([full_name, email, phone, location, password, confirm_password]):
        return {"error": "Tous les champs obligatoires doivent être remplis"}, 400

    # email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return {"error": "Email invalide"}, 400

    # password match
    if password != confirm_password:
        return {"error": "Les mots de passe ne correspondent pas"}, 400

    if len(password) < 8:
        return {"error": "Mot de passe trop court (min 8 caractères)"}, 400

    users = get_users_collection()
    clients = get_clients_collection()

    # check unique email
    if users.find_one({"email": email}):
        return {"error": "Email déjà utilisé"}, 400

    # hash password
    hashed_password = generate_password_hash(password)

    # create user
    user_doc = {
        "email": email,
        "password_hash": hashed_password,   # ✅ FIXED
        "role": "client",
        "createdAt": datetime.utcnow()
    }

    user_id = users.insert_one(user_doc).inserted_id

    # create client profile
    client_doc = {
        "userId": user_id,
        "fullName": full_name,
        "phone": phone,
        "location": location,
        "companyName": company,
        "stats": {},
        "createdAt": datetime.utcnow()
    }

    clients.insert_one(client_doc)

    return {
        "message": "Compte client créé avec succès",
        "userId": str(user_id)
    }, 201


# =========================
# LOGIN SERVICE (OPTIONAL)
# =========================
def login_user(data):

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "Email et mot de passe requis"}, 400

    users = get_users_collection()
    user = users.find_one({"email": email})

    if not user:
        return {"error": "Utilisateur non trouvé"}, 404

    if not check_password_hash(user["password_hash"], password):
        return {"error": "Mot de passe incorrect"}, 401

    return {
        "message": "Login success",
        "userId": str(user["_id"]),
        "role": user.get("role", "client")
    }, 200