from app import db
from datetime import datetime
from bson import ObjectId

class Gig:
    collection = db.gigs
    
    @staticmethod
    def create(freelancer_id, **kwargs):
        """Créer un gig"""
        gig_data = {
            'freelancerId': ObjectId(freelancer_id) if isinstance(freelancer_id, str) else freelancer_id,
            'title': kwargs.get('title', ''),
            'category': kwargs.get('category', ''),
            'subcategory': kwargs.get('subcategory', ''),
            'description': kwargs.get('description', ''),
            'requirements': kwargs.get('requirements', ''),
            'pricing': kwargs.get('pricing', {}),
            'tags': kwargs.get('tags', []),
            'images': kwargs.get('images', []),
            'status': 'pending',
            'stats': {
                'views': 0,
                'orders': 0,
                'inQueue': 0
            },
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        result = Gig.collection.insert_one(gig_data)
        return result.inserted_id
    
    @staticmethod
    def find_by_id(gig_id):
        """Trouver un gig par ID"""
        if isinstance(gig_id, str):
            gig_id = ObjectId(gig_id)
        return Gig.collection.find_one({'_id': gig_id})
    
    @staticmethod
    def find_by_freelancer(freelancer_id, status=None):
        """Trouver tous les gigs d'un freelancer"""
        if isinstance(freelancer_id, str):
            freelancer_id = ObjectId(freelancer_id)
        query = {'freelancerId': freelancer_id, 'status': {'$ne': 'deleted'}}
        if status:
            query['status'] = status
        return list(Gig.collection.find(query).sort('createdAt', -1))
    
    @staticmethod
    def update(gig_id, data):
        """Mettre à jour un gig"""
        if isinstance(gig_id, str):
            gig_id = ObjectId(gig_id)
        data['updatedAt'] = datetime.utcnow()
        return Gig.collection.update_one(
            {'_id': gig_id},
            {'$set': data}
        )
    
    @staticmethod
    def update_status(gig_id, status):
        """Changer le statut d'un gig"""
        if isinstance(gig_id, str):
            gig_id = ObjectId(gig_id)
        return Gig.collection.update_one(
            {'_id': gig_id},
            {'$set': {'status': status, 'updatedAt': datetime.utcnow()}}
        )
    
    @staticmethod
    def delete(gig_id):
        """Supprimer un gig (soft delete)"""
        return Gig.update_status(gig_id, 'deleted')
    
    @staticmethod
    def add_image(gig_id, image_url):
        """Ajouter une image à un gig"""
        if isinstance(gig_id, str):
            gig_id = ObjectId(gig_id)
        return Gig.collection.update_one(
            {'_id': gig_id},
            {
                '$push': {'images': image_url},
                '$set': {'updatedAt': datetime.utcnow()}
            }
        )