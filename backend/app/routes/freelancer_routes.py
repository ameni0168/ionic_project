# app/routes/freelancer_routes.py
# Routes pour la gestion du compte FREELANCER
# ADAPTÉ pour Flask-PyMongo

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime

freelancer_bp = Blueprint("freelancer_bp", __name__)

# ==================== CRÉER COMPTE FREELANCER ====================

@freelancer_bp.route("/create-profile", methods=["POST"])
@jwt_required()
def create_freelancer_profile():
    """Créer le profil freelancer complet après inscription"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        mongo = current_app.mongo
        
        # Vérifier si le profil existe déjà
        existing = mongo.db.freelancer_profiles.find_one({"userId": ObjectId(current_user_id)})
        if existing:
            return jsonify({"error": "Profile already exists"}), 409
        
        # Valider les champs requis
        required = ['fullName', 'title', 'bio', 'location', 'hourlyRate']
        for field in required:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Valider bio (min 50 chars)
        if len(data.get('bio', '')) < 50:
            return jsonify({"error": "Bio must be at least 50 characters"}), 400
        
        # Valider hourlyRate
        try:
            hourly_rate = float(data.get('hourlyRate', 0))
            if hourly_rate < 0:
                return jsonify({"error": "Hourly rate must be positive"}), 400
        except:
            return jsonify({"error": "Invalid hourly rate"}), 400
        
        # Valider skills (au moins 1)
        skills = data.get('skills', [])
        if not skills or len(skills) == 0:
            return jsonify({"error": "At least one skill is required"}), 400
        
        # Valider chaque skill
        validated_skills = []
        for skill in skills:
            if not skill.get('name'):
                return jsonify({"error": "Skill name is required"}), 400
            
            level = int(skill.get('level', 50))
            if level < 0 or level > 100:
                return jsonify({"error": "Skill level must be between 0 and 100"}), 400
            
            validated_skills.append({
                'name': skill['name'],
                'level': level
            })
        
        # Créer le profil
        profile = {
            'userId': ObjectId(current_user_id),
            'fullName': data['fullName'],
            'title': data['title'],
            'bio': data['bio'],
            'location': data['location'],
            'hourlyRate': hourly_rate,
            'portfolioUrl': data.get('portfolioUrl', ''),
            'avatar': data.get('avatar', ''),
            'skills': validated_skills,
            'languages': data.get('languages', []),
            'stats': {
                'completedProjects': 0,
                'rating': 0.0,
                'totalReviews': 0,
                'responseTime': '1 hour',
                'completionRate': 0
            },
            'socialLinks': data.get('socialLinks', {}),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        result = mongo.db.freelancer_profiles.insert_one(profile)
        
        # Mettre à jour le rôle de l'utilisateur
        mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {'role': 'freelancer'}}
        )
        
        profile['_id'] = str(profile['_id'])
        profile['userId'] = str(profile['userId'])
        
        return jsonify({
            "message": "Freelancer profile created successfully",
            "profile": profile
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== OBTENIR PROFIL ====================

@freelancer_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Récupérer le profil freelancer"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        profile = mongo.db.freelancer_profiles.find_one({"userId": ObjectId(current_user_id)})
        
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        
        # Convertir ObjectIds
        profile['_id'] = str(profile['_id'])
        profile['userId'] = str(profile['userId'])
        
        return jsonify(profile), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== COMPTE COMPLET ====================

@freelancer_bp.route("/account", methods=["GET"])
@jwt_required()
def get_account():
    """Récupérer compte complet (user + profile)"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        # User
        user = mongo.db.users.find_one({"_id": ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Profile
        profile = mongo.db.freelancer_profiles.find_one({"userId": ObjectId(current_user_id)})
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        
        # Convert ObjectIds
        profile['_id'] = str(profile['_id'])
        profile['userId'] = str(profile['userId'])
        
        return jsonify({
            "user": {
                "id": str(user['_id']),
                "email": user.get('email'),
                "role": user.get('role'),
                "createdAt": user.get('createdAt')
            },
            "profile": profile
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== STATUT COMPTE ====================

@freelancer_bp.route("/account/status", methods=["GET"])
@jwt_required()
def get_account_status():
    """Vérifier statut du compte"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        profile = mongo.db.freelancer_profiles.find_one({"userId": ObjectId(current_user_id)})
        
        if not profile:
            return jsonify({
                "hasProfile": False,
                "isComplete": False,
                "missingFields": ["all"]
            }), 200
        
        # Vérifier champs obligatoires
        required = ['fullName', 'title', 'bio', 'location', 'hourlyRate']
        missing = []
        
        for field in required:
            if not profile.get(field):
                missing.append(field)
        
        # Vérifier skills
        if not profile.get('skills') or len(profile['skills']) == 0:
            missing.append('skills')
        
        is_complete = len(missing) == 0
        
        return jsonify({
            "hasProfile": True,
            "isComplete": is_complete,
            "missingFields": missing,
            "completionPercentage": int((len(required) - len(missing)) / len(required) * 100)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== METTRE À JOUR PROFIL ====================

@freelancer_bp.route("/update-profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    """Mettre à jour le profil"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        mongo = current_app.mongo
        
        # Vérifier que le profil existe
        profile = mongo.db.freelancer_profiles.find_one({"userId": ObjectId(current_user_id)})
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        
        # Champs modifiables
        update_data = {}
        allowed = ['fullName', 'title', 'bio', 'location', 'hourlyRate', 
                   'portfolioUrl', 'avatar', 'skills', 'languages', 'socialLinks']
        
        for field in allowed:
            if field in data:
                if field == 'hourlyRate':
                    try:
                        update_data[field] = float(data[field])
                    except:
                        return jsonify({"error": "Invalid hourly rate"}), 400
                elif field == 'skills':
                    validated = []
                    for skill in data['skills']:
                        if skill.get('name'):
                            level = int(skill.get('level', 50))
                            if 0 <= level <= 100:
                                validated.append({'name': skill['name'], 'level': level})
                    update_data[field] = validated
                else:
                    update_data[field] = data[field]
        
        update_data['updatedAt'] = datetime.utcnow()
        
        # Mettre à jour
        mongo.db.freelancer_profiles.update_one(
            {"userId": ObjectId(current_user_id)},
            {"$set": update_data}
        )
        
        return jsonify({"message": "Profile updated successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== UPLOAD AVATAR ====================

@freelancer_bp.route("/upload-avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    """Upload avatar"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        # Vérifier profil existe
        profile = mongo.db.freelancer_profiles.find_one({"userId": ObjectId(current_user_id)})
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        
        # Vérifier fichier
        if 'avatar' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Valider type
        allowed = {'png', 'jpg', 'jpeg', 'gif'}
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if ext not in allowed:
            return jsonify({"error": "Invalid file type"}), 400
        
        # TODO: Upload vers cloud storage
        # Pour l'instant, URL mockée
        avatar_url = f"https://storage.freelancehub.com/avatars/{current_user_id}.{ext}"
        
        # Mettre à jour
        mongo.db.freelancer_profiles.update_one(
            {"userId": ObjectId(current_user_id)},
            {"$set": {"avatar": avatar_url, "updatedAt": datetime.utcnow()}}
        )
        
        return jsonify({
            "message": "Avatar uploaded successfully",
            "avatarUrl": avatar_url
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500