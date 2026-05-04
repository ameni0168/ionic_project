from datetime import datetime
import re

from werkzeug.security import generate_password_hash

from app.models.freelancer_model import get_freelancers_collection
from app.models.users_model import get_users_collection


def register_freelancer(data):
    full_name = data.get("fullName")
    email = data.get("email")
    portfolio_url = data.get("portfolioUrl")
    bio = data.get("bio")
    password = data.get("password")
    confirm_password = data.get("confirmPassword")

    if not all([full_name, email, bio, password, confirm_password]):
        return {"error": "Tous les champs obligatoires doivent etre remplis"}, 400

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return {"error": "Email invalide"}, 400

    if password != confirm_password:
        return {"error": "Les mots de passe ne correspondent pas"}, 400

    if len(password) < 8:
        return {"error": "Mot de passe trop court (min 8 caracteres)"}, 400

    users = get_users_collection()
    freelancers = get_freelancers_collection()

    if users.find_one({"email": email}):
        return {"error": "Email deja utilise"}, 400

    hashed_password = generate_password_hash(password)

    user_doc = {
        "email": email,
        "password": hashed_password,
        "role": "freelancer",
        "is_active": True,
        "account_status": "active",
        "createdAt": datetime.utcnow(),
    }
    user_id = users.insert_one(user_doc).inserted_id

    freelancer_doc = {
        "userId": user_id,
        "fullName": full_name,
        "portfolioUrl": portfolio_url,
        "bio": bio,
        "createdAt": datetime.utcnow(),
    }
    freelancers.insert_one(freelancer_doc)

    return {"message": "Compte freelancer cree avec succes"}, 201
