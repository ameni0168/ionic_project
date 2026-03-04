from datetime import datetime

class User:
    def __init__(self, name, email, password, role, phone=None, created_at=None):
        self.name = name
        self.email = email
        self.password = password  # déjà hashé
        self.role = role          # "client" ou "freelancer"
        self.phone = phone
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "role": self.role,
            "phone": self.phone,
            "created_at": self.created_at
        }
from app.extension import db

def get_users_collection():
    return db["users"]
