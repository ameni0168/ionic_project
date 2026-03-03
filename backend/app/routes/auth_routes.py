from flask import Blueprint, request, jsonify, current_app
from app.services.auth_service import register_client, register_freelancer, authenticate_user

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/register/clients", methods=["POST"])
def register_client_route():
    data = request.json
    mongo = current_app.mongo

    user_id, error = register_client(
        mongo,
        name=data.get("name"),
        email=data.get("email"),
        password=data.get("password"),
        phone=data.get("phone")
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Client inscrit avec succès", "user_id": str(user_id)}), 201

@auth_bp.route("/register/freelancer", methods=["POST"])
def register_freelancer_route():
    data = request.json
    mongo = current_app.mongo

    user_id, error = register_freelancer(
        mongo,
        name=data.get("name"),
        email=data.get("email"),
        password=data.get("password"),
        phone=data.get("phone")
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({"message": "Freelancer inscrit avec succès", "user_id": str(user_id)}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    mongo = current_app.mongo

    email = data.get("email")
    password = data.get("password")

    user = authenticate_user(mongo, email, password)
    if not user:
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401

    return jsonify({"message": "Login successful", "user_id": str(user["_id"]), "role": user["role"]}), 200
    
    if user["role"] == "freelancer":
        return redirect("/freelancer-dashboard")
    else:
        return redirect("/client-dashboard")