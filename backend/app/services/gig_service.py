from app.models.gig_model import get_gigs_collection
from app.models.freelancer_model import get_freelancers_collection
from bson import ObjectId
from datetime import datetime


def _serialize_gig(gig):
    """Convertit un document gig MongoDB en dict JSON-serializable."""
    return {
        "id": str(gig["_id"]),
        "title": gig.get("title", ""),
        "description": gig.get("description", ""),
        "price": gig.get("price", 0),
        "category": gig.get("category", ""),
        "deliveryTime": gig.get("deliveryTime", ""),
        "status": gig.get("status", "pending"),
        "ordersCompleted": gig.get("ordersCompleted", 0),
        "colorAccent": gig.get("colorAccent", "#6366f1"),
        "createdAt": gig.get("createdAt", datetime.utcnow()).isoformat()
    }


def get_freelancer_gigs(user_id):
    """Retourne tous les gigs du freelancer connecté."""
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    freelancer_gigs = list(
        gigs.find({"freelancerId": freelancer["_id"]}).sort("createdAt", -1)
    )

    return {"gigs": [_serialize_gig(g) for g in freelancer_gigs]}, 200


def create_gig(user_id, data):
    """Crée un nouveau gig pour le freelancer connecté."""
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    # Validation champs obligatoires
    required = ["title", "description", "price", "category", "deliveryTime"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return {"error": f"Champs manquants : {', '.join(missing)}"}, 400

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    # Validation prix
    try:
        price = float(data["price"])
        if price <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return {"error": "Le prix doit être un nombre positif"}, 400

    gig_doc = {
        "freelancerId": freelancer["_id"],
        "title": data["title"].strip(),
        "description": data["description"].strip(),
        "price": price,
        "category": data["category"].strip(),
        "deliveryTime": data["deliveryTime"].strip(),
        "status": "pending",          # pending par défaut, activé manuellement
        "review_note": "",
        "ordersCompleted": 0,
        "colorAccent": data.get("colorAccent", "#6366f1"),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "reviewedAt": None
    }

    result = gigs.insert_one(gig_doc)
    gig_doc["_id"] = result.inserted_id

    return {"message": "Gig créé avec succès", "gig": _serialize_gig(gig_doc)}, 201


def update_gig(user_id, gig_id, data):
    """Modifie un gig existant (vérifie que le gig appartient au freelancer)."""
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    # Vérifier que le gig appartient bien à ce freelancer
    try:
        gig = gigs.find_one({
            "_id": ObjectId(gig_id),
            "freelancerId": freelancer["_id"]
        })
    except Exception:
        return {"error": "ID de gig invalide"}, 400

    if not gig:
        return {"error": "Gig introuvable ou accès refusé"}, 404

    allowed_fields = ["title", "description", "price", "category",
                      "deliveryTime", "status", "colorAccent"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return {"error": "Aucun champ valide à modifier"}, 400

    # Revalider le prix si fourni
    if "price" in update_data:
        try:
            update_data["price"] = float(update_data["price"])
            if update_data["price"] <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return {"error": "Prix invalide"}, 400

    update_data["updatedAt"] = datetime.utcnow()

    gigs.update_one({"_id": ObjectId(gig_id)}, {"$set": update_data})

    return {"message": "Gig mis à jour avec succès"}, 200


def delete_gig(user_id, gig_id):
    """Supprime un gig (vérifie que le gig appartient au freelancer)."""
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    try:
        result = gigs.delete_one({
            "_id": ObjectId(gig_id),
            "freelancerId": freelancer["_id"]
        })
    except Exception:
        return {"error": "ID de gig invalide"}, 400

    if result.deleted_count == 0:
        return {"error": "Gig introuvable ou accès refusé"}, 404

    return {"message": "Gig supprimé avec succès"}, 200
