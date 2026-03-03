from app import app, mongo
from models.freelancer_model import FreelancerModel
from models.category_model import CategoryModel

with app.app_context():

    # Supprimer anciennes données
    mongo.db.freelancerDB.delete_many({})
    mongo.db.categories.delete_many({})

    # ========================
    # Ajouter catégories
    # ========================
    categories = [
        {
            "name": "Development",
            "subs": ["Web Development", "Mobile Development"]
        },
        {
            "name": "Design",
            "subs": ["UI/UX", "Graphic Design"]
        }
    ]

    for cat in categories:
        mongo.db.categories.insert_one(
            CategoryModel.create_category(cat)
        )

    # ========================
    # Ajouter freelancers test
    # ========================
    freelancers = [
        {
            "name": "Ahmed Ben Ali",
            "email": "ahmed@test.com",
            "password": "123456",
            "title": "Mobile Developer",
            "category": "Development",
            "subCategory": "Mobile Development",
            "skills": ["Ionic", "Angular"],
            "hourlyRate": 30,
            "rating": 4.8,
            "reviews": 120,
            "jobSuccess": 95,
            "location": "Tunisia",
            "online": True,
            "earned": "10k+"
        },
        {
            "name": "Sara Trabelsi",
            "email": "sara@test.com",
            "password": "123456",
            "title": "UI/UX Designer",
            "category": "Design",
            "subCategory": "UI/UX",
            "skills": ["Figma", "Adobe XD"],
            "hourlyRate": 25,
            "rating": 4.6,
            "reviews": 80,
            "jobSuccess": 92,
            "location": "Tunisia",
            "online": False,
            "earned": "7k+"
        }
    ]

    for freelancer in freelancers:
        mongo.db.freelancerDB.insert_one(
            FreelancerModel.create_freelancer(freelancer)
        )

    print("✅ Test data inserted successfully!")