# app/routes/gig_routes.py
# Routes pour la gestion des GIGS
# ADAPTÉ pour Flask-PyMongo

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime

gig_bp = Blueprint("gig_bp", __name__)

# ==================== CRÉER GIG ====================

@gig_bp.route("/create", methods=["POST"])
@jwt_required()
def create_gig():
    """Créer un nouveau gig"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        mongo = current_app.mongo
        
        # Vérifier que l'utilisateur a un profil
        profile = mongo.db.freelancer_profiles.find_one({"userId": ObjectId(current_user_id)})
        if not profile:
            return jsonify({
                "error": "You must create your freelancer profile first",
                "action": "create_profile_first"
            }), 403
        
        # Valider champs requis
        required = ['title', 'category', 'description']
        for field in required:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Valider titre (10-80 chars)
        title = data['title'].strip()
        if len(title) < 10 or len(title) > 80:
            return jsonify({"error": "Title must be between 10 and 80 characters"}), 400
        
        # Valider description (50-1000 chars)
        description = data['description'].strip()
        if len(description) < 50 or len(description) > 1000:
            return jsonify({"error": "Description must be between 50 and 1000 characters"}), 400
        
        # Valider pricing
        pricing = data.get('pricing', {})
        if not pricing or not pricing.get('basic'):
            return jsonify({"error": "Basic pricing package is required"}), 400
        
        basic = pricing['basic']
        required_pricing = ['price', 'title', 'description', 'deliveryTime', 'revisions']
        for field in required_pricing:
            if field not in basic:
                return jsonify({"error": f"Basic package {field} is required"}), 400
        
        # Valider prix
        try:
            price = float(basic['price'])
            if price < 5 or price > 10000:
                return jsonify({"error": "Price must be between $5 and $10,000"}), 400
            basic['price'] = price
        except:
            return jsonify({"error": "Invalid price"}), 400
        
        # Valider deliveryTime
        try:
            delivery = int(basic['deliveryTime'])
            if delivery < 1 or delivery > 90:
                return jsonify({"error": "Delivery time must be between 1 and 90 days"}), 400
            basic['deliveryTime'] = delivery
        except:
            return jsonify({"error": "Invalid delivery time"}), 400
        
        # Valider revisions
        try:
            revisions = int(basic['revisions'])
            if revisions < 0 or revisions > 10:
                return jsonify({"error": "Revisions must be between 0 and 10"}), 400
            basic['revisions'] = revisions
        except:
            return jsonify({"error": "Invalid revisions count"}), 400
        
        # Valider tags (max 5)
        tags = data.get('tags', [])
        if len(tags) > 5:
            return jsonify({"error": "Maximum 5 tags allowed"}), 400
        
        clean_tags = list(set([tag.strip().lower() for tag in tags if tag.strip()]))
        
        # Créer le gig
        gig = {
            'freelancerId': ObjectId(current_user_id),
            'title': title,
            'category': data['category'],
            'subcategory': data.get('subcategory', ''),
            'description': description,
            'requirements': data.get('requirements', ''),
            'pricing': {'basic': basic},
            'tags': clean_tags,
            'images': data.get('images', []),
            'status': 'pending',
            'stats': {
                'views': 0,
                'orders': 0,
                'inQueue': 0
            },
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        # Ajouter standard et premium si fournis
        if pricing.get('standard'):
            gig['pricing']['standard'] = pricing['standard']
        if pricing.get('premium'):
            gig['pricing']['premium'] = pricing['premium']
        
        result = mongo.db.gigs.insert_one(gig)
        
        gig['_id'] = str(result.inserted_id)
        gig['freelancerId'] = str(gig['freelancerId'])
        
        return jsonify({
            "message": "Gig created successfully",
            "gig": gig
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== MES GIGS ====================

@gig_bp.route("/my-gigs", methods=["GET"])
@jwt_required()
def get_my_gigs():
    """Récupérer tous mes gigs"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        # Paramètres de filtrage
        status = request.args.get('status')
        category = request.args.get('category')
        
        # Construire query
        query = {
            'freelancerId': ObjectId(current_user_id),
            'status': {'$ne': 'deleted'}
        }
        
        if status:
            query['status'] = status
        if category:
            query['category'] = category
        
        # Récupérer gigs
        gigs = list(mongo.db.gigs.find(query).sort('createdAt', -1))
        
        # Convertir ObjectIds
        for gig in gigs:
            gig['_id'] = str(gig['_id'])
            gig['freelancerId'] = str(gig['freelancerId'])
        
        # Stats
        stats = {
            'total': len(gigs),
            'active': len([g for g in gigs if g['status'] == 'active']),
            'paused': len([g for g in gigs if g['status'] == 'paused']),
            'pending': len([g for g in gigs if g['status'] == 'pending'])
        }
        
        return jsonify({
            "gigs": gigs,
            "stats": stats
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== DÉTAILS GIG ====================

@gig_bp.route("/<gig_id>", methods=["GET"])
@jwt_required()
def get_gig_details(gig_id):
    """Récupérer détails d'un gig"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        gig = mongo.db.gigs.find_one({"_id": ObjectId(gig_id)})
        
        if not gig:
            return jsonify({"error": "Gig not found"}), 404
        
        # Vérifier propriété
        if str(gig['freelancerId']) != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        gig['_id'] = str(gig['_id'])
        gig['freelancerId'] = str(gig['freelancerId'])
        
        return jsonify(gig), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== MODIFIER GIG ====================

@gig_bp.route("/<gig_id>", methods=["PUT"])
@jwt_required()
def update_gig(gig_id):
    """Mettre à jour un gig"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        mongo = current_app.mongo
        
        # Vérifier gig existe
        gig = mongo.db.gigs.find_one({"_id": ObjectId(gig_id)})
        if not gig:
            return jsonify({"error": "Gig not found"}), 404
        
        # Vérifier propriété
        if str(gig['freelancerId']) != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        # Préparer update
        update_data = {}
        
        # Champs modifiables
        if 'title' in data:
            title = data['title'].strip()
            if len(title) < 10 or len(title) > 80:
                return jsonify({"error": "Title must be between 10 and 80 characters"}), 400
            update_data['title'] = title
        
        if 'description' in data:
            desc = data['description'].strip()
            if len(desc) < 50 or len(desc) > 1000:
                return jsonify({"error": "Description must be between 50 and 1000 characters"}), 400
            update_data['description'] = desc
        
        if 'category' in data:
            update_data['category'] = data['category']
        
        if 'subcategory' in data:
            update_data['subcategory'] = data['subcategory']
        
        if 'requirements' in data:
            update_data['requirements'] = data['requirements']
        
        if 'pricing' in data:
            update_data['pricing'] = data['pricing']
        
        if 'tags' in data:
            tags = data['tags']
            if len(tags) > 5:
                return jsonify({"error": "Maximum 5 tags allowed"}), 400
            update_data['tags'] = list(set([tag.strip().lower() for tag in tags if tag.strip()]))
        
        if 'images' in data:
            update_data['images'] = data['images']
        
        if update_data:
            update_data['updatedAt'] = datetime.utcnow()
            mongo.db.gigs.update_one(
                {"_id": ObjectId(gig_id)},
                {"$set": update_data}
            )
        
        return jsonify({"message": "Gig updated successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== SUPPRIMER GIG ====================

@gig_bp.route("/<gig_id>", methods=["DELETE"])
@jwt_required()
def delete_gig(gig_id):
    """Supprimer un gig (soft delete)"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        gig = mongo.db.gigs.find_one({"_id": ObjectId(gig_id)})
        if not gig:
            return jsonify({"error": "Gig not found"}), 404
        
        if str(gig['freelancerId']) != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        # Soft delete
        mongo.db.gigs.update_one(
            {"_id": ObjectId(gig_id)},
            {"$set": {"status": "deleted", "updatedAt": datetime.utcnow()}}
        )
        
        return jsonify({"message": "Gig deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== CHANGER STATUT ====================

@gig_bp.route("/<gig_id>/status", methods=["PATCH"])
@jwt_required()
def change_gig_status(gig_id):
    """Changer le statut d'un gig"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        mongo = current_app.mongo
        
        if not data or 'status' not in data:
            return jsonify({"error": "Status is required"}), 400
        
        status = data['status']
        if status not in ['active', 'paused']:
            return jsonify({"error": "Status must be 'active' or 'paused'"}), 400
        
        gig = mongo.db.gigs.find_one({"_id": ObjectId(gig_id)})
        if not gig:
            return jsonify({"error": "Gig not found"}), 404
        
        if str(gig['freelancerId']) != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        mongo.db.gigs.update_one(
            {"_id": ObjectId(gig_id)},
            {"$set": {"status": status, "updatedAt": datetime.utcnow()}}
        )
        
        return jsonify({
            "message": f"Gig status changed to {status}",
            "status": status
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== UPLOAD IMAGE ====================

@gig_bp.route("/<gig_id>/upload-image", methods=["POST"])
@jwt_required()
def upload_gig_image(gig_id):
    """Upload image pour le gig"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        gig = mongo.db.gigs.find_one({"_id": ObjectId(gig_id)})
        if not gig:
            return jsonify({"error": "Gig not found"}), 404
        
        if str(gig['freelancerId']) != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        # Vérifier nombre d'images (max 3)
        current_images = gig.get('images', [])
        if len(current_images) >= 3:
            return jsonify({"error": "Maximum 3 images allowed"}), 400
        
        if 'image' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Valider type
        allowed = {'png', 'jpg', 'jpeg', 'gif'}
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if ext not in allowed:
            return jsonify({"error": "Invalid file type"}), 400
        
        # TODO: Upload vers cloud storage
        image_url = f"https://storage.freelancehub.com/gigs/{gig_id}/{len(current_images) + 1}.{ext}"
        
        # Ajouter image
        mongo.db.gigs.update_one(
            {"_id": ObjectId(gig_id)},
            {
                "$push": {"images": image_url},
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
        
        return jsonify({
            "message": "Image uploaded successfully",
            "imageUrl": image_url,
            "totalImages": len(current_images) + 1
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== DUPLIQUER GIG ====================

@gig_bp.route("/<gig_id>/duplicate", methods=["POST"])
@jwt_required()
def duplicate_gig(gig_id):
    """Dupliquer un gig"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        gig = mongo.db.gigs.find_one({"_id": ObjectId(gig_id)})
        if not gig:
            return jsonify({"error": "Gig not found"}), 404
        
        if str(gig['freelancerId']) != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        # Créer copie
        new_gig = {
            'freelancerId': gig['freelancerId'],
            'title': f"{gig['title']} (Copy)",
            'category': gig['category'],
            'subcategory': gig.get('subcategory', ''),
            'description': gig['description'],
            'requirements': gig.get('requirements', ''),
            'pricing': gig['pricing'],
            'tags': gig.get('tags', []),
            'images': [],
            'status': 'pending',
            'stats': {
                'views': 0,
                'orders': 0,
                'inQueue': 0
            },
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        result = mongo.db.gigs.insert_one(new_gig)
        
        new_gig['_id'] = str(result.inserted_id)
        new_gig['freelancerId'] = str(new_gig['freelancerId'])
        
        return jsonify({
            "message": "Gig duplicated successfully",
            "gig": new_gig
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== STATS ====================

@gig_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_gigs_stats():
    """Statistiques de tous mes gigs"""
    try:
        current_user_id = get_jwt_identity()
        mongo = current_app.mongo
        
        gigs = list(mongo.db.gigs.find({
            'freelancerId': ObjectId(current_user_id),
            'status': {'$ne': 'deleted'}
        }))
        
        stats = {
            'totalGigs': len(gigs),
            'activeGigs': len([g for g in gigs if g['status'] == 'active']),
            'pausedGigs': len([g for g in gigs if g['status'] == 'paused']),
            'pendingGigs': len([g for g in gigs if g['status'] == 'pending']),
            'totalViews': sum(g.get('stats', {}).get('views', 0) for g in gigs),
            'totalOrders': sum(g.get('stats', {}).get('orders', 0) for g in gigs),
            'averagePrice': 0
        }
        
        if gigs:
            total_price = sum(g.get('pricing', {}).get('basic', {}).get('price', 0) for g in gigs)
            stats['averagePrice'] = round(total_price / len(gigs), 2)
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500