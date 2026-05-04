from werkzeug.security import generate_password_hash
from app.models.users_model import get_users_collection
from app.models.freelancer_model import get_freelancers_collection
from datetime import datetime
import re


def register_freelancer(data):

    full_name = data.get("fullName")
    email = data.get("email")
    portfolio_url = data.get("portfolioUrl")
    bio = data.get("bio")
    password = data.get("password")
    confirm_password = data.get("confirmPassword")

    #  Vérification champs obligatoires
    if not all([full_name, email, bio, password, confirm_password]):
        return {"error": "Tous les champs obligatoires doivent être remplis"}, 400

    # 2️ Email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return {"error": "Email invalide"}, 400

    # 3️ Password match
    if password != confirm_password:
        return {"error": "Les mots de passe ne correspondent pas"}, 400

    # 4️ Password length
    if len(password) < 8:
        return {"error": "Mot de passe trop court (min 8 caractères)"}, 400

    users = get_users_collection()
    freelancers = get_freelancers_collection()

    # 5️ Email unique (toujours dans users)
    if users.find_one({"email": email}):
        return {"error": "Email déjà utilisé"}, 400

    # 6️ Hash password
    hashed_password = generate_password_hash(password)

    # 7️ Créer user (AUTH)
    user_doc = {
        "email": email,
        "password": hashed_password,
        "role": "freelancer",
        "createdAt": datetime.utcnow()
    }

    user_id = users.insert_one(user_doc).inserted_id

    # 8️ Créer profil freelancer (BUSINESS)
    freelancer_doc = {
        "userId": user_id,
        "fullName": full_name,
        "portfolioUrl": portfolio_url,
        "bio": bio,
        "createdAt": datetime.utcnow()
    }
    print("FREELANCER DOC:", freelancer_doc)


    result=freelancers.insert_one(freelancer_doc)
    print("FREELANCER INSERTED:", result.inserted_id)

    return {"message": "Compte freelancer créé avec succès"}, 201