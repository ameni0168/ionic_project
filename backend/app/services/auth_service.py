from werkzeug.security import generate_password_hash
from app.models.client_model import get_clients_collection
import re

def register_client(data):

    full_name = data.get("fullName")
    email = data.get("email")
    phone = data.get("phone")
    location = data.get("location")
    company = data.get("companyName")
    password = data.get("password")
    confirm_password = data.get("confirmPassword")

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

    clients = get_clients_collection()

    # 5️⃣ Vérifier email unique
    if clients.find_one({"email": email}):
        return {"error": "Email déjà utilisé"}, 400

    # 6️⃣ Hasher password
    hashed_password = generate_password_hash(password)

    # 7️⃣ Construire document Mongo
    new_client = {
        "fullName": full_name,
        "email": email,
        "phone": phone,
        "location": location,
        "companyName": company,
        "password": hashed_password,
        "role": "client",
        "createdAt": __import__("datetime").datetime.utcnow()
    }

    clients.insert_one(new_client)

    return {"message": "Compte client créé avec succès"}, 201