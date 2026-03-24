from app.models.freelancer_model import get_freelancers_collection
from app.models.users_model import get_users_collection
from app.models.gig_model import get_gigs_collection
from bson import ObjectId
from datetime import datetime


def _serialize_freelancer(freelancer, user):
    """Convertit un document MongoDB en dict JSON-serializable."""
    return {
        "id": str(freelancer["_id"]),
        "fullName": freelancer.get("fullName", ""),
        "title": freelancer.get("title", ""),
        "bio": freelancer.get("bio", ""),
        "portfolioUrl": freelancer.get("portfolioUrl", ""),
        "location": freelancer.get("location", ""),
        "phone": freelancer.get("phone", ""),
        "hourlyRate": freelancer.get("hourlyRate", 0),
        "skills": freelancer.get("skills", []),
        "rating": freelancer.get("rating", 0.0),
        "reviews": freelancer.get("reviews", 0),
        "completedProjects": freelancer.get("completedProjects", 0),
        "email": user.get("email", ""),
        "createdAt": freelancer.get("createdAt", datetime.utcnow()).isoformat()
    }


def get_freelancer_profile(user_id):
    """Retourne le profil complet du freelancer connecté."""
    freelancers = get_freelancers_collection()
    users = get_users_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "Utilisateur introuvable"}, 404

    return _serialize_freelancer(freelancer, user), 200


def update_freelancer_profile(user_id, data):
    """Met à jour les champs modifiables du profil."""
    freelancers = get_freelancers_collection()

    # Seuls ces champs sont modifiables depuis le frontend
    allowed_fields = ["fullName", "title", "bio", "portfolioUrl",
                      "location", "phone", "hourlyRate", "skills"]

    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return {"error": "Aucun champ valide à mettre à jour"}, 400

    update_data["updatedAt"] = datetime.utcnow()

    result = freelancers.update_one(
        {"userId": ObjectId(user_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return {"error": "Profil introuvable"}, 404

    return {"message": "Profil mis à jour avec succès"}, 200


def get_dashboard_stats(user_id):
    """Retourne les statistiques + activités récentes pour le dashboard."""
    freelancers = get_freelancers_collection()
    gigs = get_gigs_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    freelancer_id = freelancer["_id"]

    # Stats calculées depuis la collection gigs
    all_gigs = list(gigs.find({"freelancerId": freelancer_id}))
    active_gigs = [g for g in all_gigs if g.get("status") == "active"]
    total_completed = sum(g.get("ordersCompleted", 0) for g in all_gigs)

    # Activités récentes : les 4 derniers gigs créés ou modifiés
    recent_gigs = list(
        gigs.find({"freelancerId": freelancer_id})
            .sort("createdAt", -1)
            .limit(4)
    )

    recent_activities = []
    for g in recent_gigs:
        recent_activities.append({
            "type": "gig",
            "title": g.get("title", ""),
            "description": f"Gig — {g.get('category', '')}",
            "time": g.get("createdAt", datetime.utcnow()).isoformat(),
            "icon": "briefcase",
            "color": "primary"
        })

    stats = {
        "activeGigs": len(active_gigs),
        "totalCompleted": total_completed,
        "rating": freelancer.get("rating", 0.0),
        "reviews": freelancer.get("reviews", 0),
        # Le chiffre d'affaires mensuel sera calculé plus tard (collection orders)
        "monthlyEarnings": 0
    }

    return {
        "userName": freelancer.get("fullName", ""),
        "stats": stats,
        "recentActivities": recent_activities
    }, 200