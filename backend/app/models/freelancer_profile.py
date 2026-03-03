from app import db
from datetime import datetime
from bson import ObjectId

class FreelancerProfile:
    collection = db.freelancer_profiles
    
    @staticmethod
    def create(user_id, **kwargs):
        """Créer un profil freelancer"""
        profile_data = {
            'userId': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'fullName': kwargs.get('fullName', ''),
            'title': kwargs.get('title', ''),
            'bio': kwargs.get('bio', ''),
            'location': kwargs.get('location', ''),
            'hourlyRate': kwargs.get('hourlyRate', 0),
            'portfolioUrl': kwargs.get('portfolioUrl', ''),
            'avatar': kwargs.get('avatar', ''),
            'skills': kwargs.get('skills', []),
            'languages': kwargs.get('languages', []),
            'stats': {
                'completedProjects': 0,
                'rating': 0.0,
                'totalReviews': 0,
                'responseTime': '1 hour',
                'completionRate': 0
            },
            'socialLinks': kwargs.get('socialLinks', {}),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        result = FreelancerProfile.collection.insert_one(profile_data)
        return result.inserted_id
    
    @staticmethod
    def find_by_user_id(user_id):
        """Trouver un profil par user ID"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return FreelancerProfile.collection.find_one({'userId': user_id})
    
    @staticmethod
    def find_by_id(profile_id):
        """Trouver un profil par ID"""
        if isinstance(profile_id, str):
            profile_id = ObjectId(profile_id)
        return FreelancerProfile.collection.find_one({'_id': profile_id})
    
    @staticmethod
    def update(user_id, data):
        """Mettre à jour un profil"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        data['updatedAt'] = datetime.utcnow()
        return FreelancerProfile.collection.update_one(
            {'userId': user_id},
            {'$set': data}
        )
    
    @staticmethod
    def update_avatar(user_id, avatar_url):
        """Mettre à jour l'avatar"""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return FreelancerProfile.collection.update_one(
            {'userId': user_id},
            {'$set': {'avatar': avatar_url, 'updatedAt': datetime.utcnow()}}
        )