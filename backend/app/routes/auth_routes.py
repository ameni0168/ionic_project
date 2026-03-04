from flask import Blueprint, request
from app.services.auth_service import register_client
from app.services.auth_freelancer import register_freelancer
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from app.models.users_model import get_users_collection

auth_bp = Blueprint('auth', __name__)
users_collection = get_users_collection()

@auth_bp.route('/register/client', methods=['POST'])
def register():
    return register_client(request.json)
@auth_bp.route("/register/freelancer", methods=["POST"])
def register_freelancer_route():
    return register_freelancer(request.json)
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify({"error": "Email et mot de passe requis"}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404
        
        if not check_password_hash(user["password"], password):
            return jsonify({"error": "Mot de passe incorrect"}), 401
        
        
        return jsonify({"message": "Login success", "role": user["role"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500