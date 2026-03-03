from datetime import datetime

class FreelancerModel:

    @staticmethod
    def create_freelancer(data):
        return {
            "name": data.get("name"),
            "email": data.get("email"),
            "password": data.get("password"),
            "title": data.get("title"),
            "category": data.get("category"),
            "subCategory": data.get("subCategory"),
            "skills": data.get("skills", []),
            "hourlyRate": data.get("hourlyRate", 0),
            "rating": data.get("rating", 0),
            "reviews": data.get("reviews", 0),
            "jobSuccess": data.get("jobSuccess", 0),
            "location": data.get("location"),
            "online": data.get("online", False),
            "earned": data.get("earned", "0"),
            "created_at": datetime.utcnow()
        }