from app.models.freelancer_model import get_freelancers_collection
from app.models.users_model import get_users_collection
from app.models.gig_model import get_gigs_collection
from app.models.order_model import get_orders_collection
from bson import ObjectId
from datetime import datetime, timezone


def _serialize_freelancer(freelancer, user):
    return {
        "id":               str(freelancer["_id"]),
        "fullName":         freelancer.get("fullName", ""),
        "title":            freelancer.get("title", ""),
        "bio":              freelancer.get("bio", ""),
        "portfolioUrl":     freelancer.get("portfolioUrl", ""),
        "location":         freelancer.get("location", ""),
        "phone":            freelancer.get("phone", ""),
        "hourlyRate":       freelancer.get("hourlyRate", 0),
        "skills":           freelancer.get("skills", []),
        "rating":           freelancer.get("rating", 0.0),
        "reviews":          freelancer.get("reviews", 0),
        "completedProjects":freelancer.get("completedProjects", 0),
        "email":            user.get("email", ""),
        "createdAt":        freelancer.get("createdAt", datetime.utcnow()).isoformat()
    }


# ── Profil ─────────────────────────────────────────────────────────────────────

def get_freelancer_profile(user_id):
    freelancers = get_freelancers_collection()
    users       = get_users_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "Utilisateur introuvable"}, 404

    return _serialize_freelancer(freelancer, user), 200


def update_freelancer_profile(user_id, data):
    """
    Champs modifiables :
      fullName, title, bio, portfolioUrl, location, phone, hourlyRate
      skills : liste de { name: str, level: int 0-100 }
    """
    freelancers = get_freelancers_collection()

    allowed = ["fullName", "title", "bio", "portfolioUrl",
               "location", "phone", "hourlyRate", "skills"]
    update_data = {k: v for k, v in data.items() if k in allowed}

    # Validation skills
    if "skills" in update_data:
        if not isinstance(update_data["skills"], list):
            return {"error": "skills doit être une liste"}, 400
        for s in update_data["skills"]:
            if not isinstance(s, dict) or "name" not in s or "level" not in s:
                return {"error": "Chaque skill doit avoir 'name' et 'level'"}, 400
            try:
                lvl = int(s["level"])
                if not 0 <= lvl <= 100:
                    raise ValueError
            except (ValueError, TypeError):
                return {"error": "level doit être entre 0 et 100"}, 400

    # Validation hourlyRate
    if "hourlyRate" in update_data:
        try:
            update_data["hourlyRate"] = float(update_data["hourlyRate"])
            if update_data["hourlyRate"] < 0:
                raise ValueError
        except (ValueError, TypeError):
            return {"error": "hourlyRate invalide"}, 400

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


# ── Dashboard ──────────────────────────────────────────────────────────────────

def get_dashboard_stats(user_id):
    freelancers = get_freelancers_collection()
    gigs_col    = get_gigs_collection()
    orders_col  = get_orders_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    freelancer_id = freelancer["_id"]

    # Tous les gigs du freelancer
    all_gigs    = list(gigs_col.find({"freelancerId": freelancer_id}))
    active_gigs = [g for g in all_gigs if g.get("status") == "active"]
    gig_ids     = [g["_id"] for g in all_gigs]

    # Earnings du mois en cours : commandes "completed" depuis le 1er du mois
    now            = datetime.now(timezone.utc)
    first_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    monthly_orders = list(orders_col.find({
        "gigId":       {"$in": gig_ids},
        "status":      "completed",
        "completedAt": {"$gte": first_of_month}
    }))
    monthly_earnings = round(sum(o.get("amount", 0) for o in monthly_orders), 2)

    # Total commandes complétées (tous mois confondus)
    total_completed = orders_col.count_documents({
        "gigId":  {"$in": gig_ids},
        "status": "completed"
    })

    # Activités récentes : 5 dernières commandes
    recent_orders = list(
        orders_col.find({"gigId": {"$in": gig_ids}})
                  .sort("createdAt", -1)
                  .limit(5)
    )
    gig_titles = {str(g["_id"]): g.get("title", "") for g in all_gigs}

    recent_activities = []
    for o in recent_orders:
        status = o.get("status", "pending")
        recent_activities.append({
            "type":        "order",
            "title":       f"Order — {gig_titles.get(str(o.get('gigId','')), '')}",
            "description": f"${o.get('amount', 0)} · {o.get('clientName', 'Client')}",
            "time":        o.get("createdAt", datetime.utcnow()).isoformat(),
            "icon":        "bag-check" if status == "completed" else "time",
            "color":       "success"   if status == "completed" else "warning"
        })

    # Fallback : si pas encore de commandes → afficher les gigs récents
    if not recent_activities:
        for g in list(gigs_col.find({"freelancerId": freelancer_id})
                               .sort("createdAt", -1).limit(4)):
            recent_activities.append({
                "type":        "gig",
                "title":       g.get("title", ""),
                "description": f"Gig — {g.get('category', '')}",
                "time":        g.get("createdAt", datetime.utcnow()).isoformat(),
                "icon":        "briefcase",
                "color":       "primary"
            })

    return {
        "userName": freelancer.get("fullName", ""),
        "stats": {
            "activeGigs":      len(active_gigs),
            "totalCompleted":  total_completed,
            "rating":          freelancer.get("rating", 0.0),
            "reviews":         freelancer.get("reviews", 0),
            "monthlyEarnings": monthly_earnings
        },
        "recentActivities": recent_activities
    }, 200