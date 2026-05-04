from datetime import datetime

from bson import ObjectId

from app.models.freelancer_model import get_freelancers_collection
from app.models.gig_model import get_gigs_collection


def _normalize_categories(value):
    if isinstance(value, list):
        items = value
    elif value is None:
        items = []
    else:
        items = [value]

    normalized = []
    for item in items:
        text = str(item).strip()
        if text and text not in normalized:
            normalized.append(text)
    return normalized


def _serialize_gig(gig):
    return {
        "id": str(gig["_id"]),
        "title": gig.get("title", ""),
        "description": gig.get("description", ""),
        "price": gig.get("price", 0),
        "category": _normalize_categories(gig.get("category", [])),
        "deliveryTime": gig.get("deliveryTime", ""),
        "status": gig.get("status", "pending"),
        "ordersCompleted": gig.get("ordersCompleted", 0),
        "colorAccent": gig.get("colorAccent", "#6366f1"),
        "createdAt": gig.get("createdAt", datetime.utcnow()).isoformat(),
    }


def get_freelancer_gigs(user_id):
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    freelancer_gigs = list(gigs.find({"freelancerId": freelancer["_id"]}).sort("createdAt", -1))
    return {"gigs": [_serialize_gig(g) for g in freelancer_gigs]}, 200


def create_gig(user_id, data):
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    required = ["title", "description", "price", "category", "deliveryTime"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return {"error": f"Champs manquants : {', '.join(missing)}"}, 400

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    try:
        price = float(data["price"])
        if price <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return {"error": "Le prix doit etre un nombre positif"}, 400

    categories = _normalize_categories(data.get("category"))
    if not categories:
        return {"error": "Le champ 'category' doit contenir au moins une categorie"}, 400

    gig_doc = {
        "freelancerId": freelancer["_id"],
        "title": data["title"].strip(),
        "description": data["description"].strip(),
        "price": price,
        "category": categories,
        "deliveryTime": data["deliveryTime"].strip(),
        "status": "pending",
        "review_note": "",
        "ordersCompleted": 0,
        "colorAccent": data.get("colorAccent", "#6366f1"),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "reviewedAt": None,
    }

    result = gigs.insert_one(gig_doc)
    gig_doc["_id"] = result.inserted_id

    return {"message": "Gig cree avec succes", "gig": _serialize_gig(gig_doc)}, 201


def update_gig(user_id, gig_id, data):
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    try:
        gig = gigs.find_one({"_id": ObjectId(gig_id), "freelancerId": freelancer["_id"]})
    except Exception:
        return {"error": "ID de gig invalide"}, 400

    if not gig:
        return {"error": "Gig introuvable ou acces refuse"}, 404

    allowed_fields = ["title", "description", "price", "category", "deliveryTime", "status", "colorAccent"]
    update_data = {key: value for key, value in data.items() if key in allowed_fields}

    if not update_data:
        return {"error": "Aucun champ valide a modifier"}, 400

    if "price" in update_data:
        try:
            update_data["price"] = float(update_data["price"])
            if update_data["price"] <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return {"error": "Prix invalide"}, 400

    if "category" in update_data:
        categories = _normalize_categories(update_data["category"])
        if not categories:
            return {"error": "Le champ 'category' doit contenir au moins une categorie"}, 400
        update_data["category"] = categories

    update_data["updatedAt"] = datetime.utcnow()
    gigs.update_one({"_id": ObjectId(gig_id)}, {"$set": update_data})

    return {"message": "Gig mis a jour avec succes"}, 200


def delete_gig(user_id, gig_id):
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    try:
        result = gigs.delete_one({"_id": ObjectId(gig_id), "freelancerId": freelancer["_id"]})
    except Exception:
        return {"error": "ID de gig invalide"}, 400

    if result.deleted_count == 0:
        return {"error": "Gig introuvable ou acces refuse"}, 404

    return {"message": "Gig supprime avec succes"}, 200
