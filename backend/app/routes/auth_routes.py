from flask import Blueprint, request
from app.services.auth_service import register_client

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register/client', methods=['POST'])
def register():
    return register_client(request.json)