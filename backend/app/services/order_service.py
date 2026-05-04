from app.models.order_model import get_orders_collection
from app.models.gig_model import get_gigs_collection
from app.models.freelancer_model import get_freelancers_collection
from app.models.users_model import get_users_collection
from app.extension import db
from bson import ObjectId
from datetime import datetime, timezone
from app.services.payment_service import pay_completed_gig_order


# ── Transitions de statut autorisées ──────────────────────────────────────────
# Seul le freelancer peut confirmer/refuser/terminer
ALLOWED_TRANSITIONS = {
    "pending":     ["in_progress", "cancelled"],   # freelancer accepte ou refuse
    "in_progress": ["submitted",   "cancelled"],   # freelancer livre ou annule
    "submitted":   [],                             # client doit accepter et payer
    "completed":   [],                             # terminal
    "cancelled":   [],                             # terminal
}


def _serialize_order(order: dict) -> dict:
    """Convertit un document order MongoDB en dict JSON-serializable."""
    return {
        "id":           str(order["_id"]),
        "gigId":        str(order.get("gigId", "")),
        "clientId":     str(order.get("clientId", "")),
        "freelancerId": str(order.get("freelancerId", "")),
        "title":        order.get("title", ""),
        "price":        float(order.get("price", 0)),
        "status":       order.get("status", "pending"),
        "message":      order.get("message", ""),
        "requirements": order.get("requirements", ""),
        "clientName":   order.get("clientName", "Client"),
        "gigTitle":     order.get("title", ""),
        "createdAt":    order.get("createdAt", datetime.utcnow()).isoformat(),
        "updatedAt":    order.get("updatedAt", datetime.utcnow()).isoformat(),
        "completedAt":  order.get("completedAt", "").isoformat()
                        if order.get("completedAt") else None,
        "submittedAt":  order.get("submittedAt", "").isoformat()
                        if order.get("submittedAt") else None,
        "paymentStatus": order.get("payment_status", "unpaid"),
    }


# ── Freelancer : voir ses commandes ───────────────────────────────────────────

def get_orders_for_freelancer(user_id: str, status_filter: str = "") -> tuple:
    """
    Retourne toutes les commandes reçues par le freelancer connecté.
    Optionnel : filtrer par statut (pending, in_progress, completed, cancelled)
    """
    freelancers = get_freelancers_collection()
    orders_col  = get_orders_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    query = {"freelancerId": freelancer["_id"]}
    if status_filter and status_filter in ALLOWED_TRANSITIONS.keys() | {"completed", "cancelled"}:
        query["status"] = status_filter

    orders = list(orders_col.find(query).sort("createdAt", -1))

    # Enrichir avec le nom du client
    users_col = get_users_collection()
    result = []
    for o in orders:
        serialized = _serialize_order(o)
        # Récupérer le nom du client depuis la collection clients
        client_id = o.get("clientId")
        if client_id:
            client_profile = db["clients"].find_one({"userId": ObjectId(str(client_id))})
            serialized["clientName"] = client_profile.get("fullName", "Client") if client_profile else "Client"
        result.append(serialized)

    # Compteurs par statut (utile pour les badges dans le dashboard)
    counts = {
        "pending":     orders_col.count_documents({"freelancerId": freelancer["_id"], "status": "pending"}),
        "in_progress": orders_col.count_documents({"freelancerId": freelancer["_id"], "status": "in_progress"}),
        "submitted":   orders_col.count_documents({"freelancerId": freelancer["_id"], "status": "submitted"}),
        "completed":   orders_col.count_documents({"freelancerId": freelancer["_id"], "status": "completed"}),
        "cancelled":   orders_col.count_documents({"freelancerId": freelancer["_id"], "status": "cancelled"}),
    }

    return {"orders": result, "counts": counts}, 200


# ── Freelancer : changer le statut d'une commande ─────────────────────────────

def update_order_status(user_id: str, order_id: str, new_status: str) -> tuple:
    """
    Le freelancer confirme (in_progress), livre (completed) ou annule (cancelled).
    Vérifie que la transition est autorisée.
    """
    freelancers = get_freelancers_collection()
    orders_col  = get_orders_collection()

    freelancer = freelancers.find_one({"userId": ObjectId(user_id)})
    if not freelancer:
        return {"error": "Profil freelancer introuvable"}, 404

    try:
        order = orders_col.find_one({
            "_id":          ObjectId(order_id),
            "freelancerId": freelancer["_id"]
        })
    except Exception:
        return {"error": "ID de commande invalide"}, 400

    if not order:
        return {"error": "Commande introuvable ou accès refusé"}, 404

    current_status = order.get("status", "pending")
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])

    if new_status not in allowed:
        return {
            "error": f"Transition '{current_status}' → '{new_status}' non autorisée. "
                     f"Transitions possibles : {allowed}"
        }, 400

    update = {
        "status":    new_status,
        "updatedAt": datetime.now(timezone.utc)
    }

    if new_status == "submitted":
        update["submittedAt"] = datetime.now(timezone.utc)

    orders_col.update_one({"_id": ObjectId(order_id)}, {"$set": update})

    return {"message": f"Commande mise à jour : {new_status}", "status": new_status}, 200


# ── Client : voir ses commandes passées ───────────────────────────────────────

def get_orders_for_client(user_id: str, status_filter: str = "") -> tuple:
    """Retourne toutes les commandes passées par le client connecté."""
    orders_col = get_orders_collection()

    query = {"clientId": ObjectId(user_id)}
    if status_filter:
        query["status"] = status_filter

    orders = list(orders_col.find(query).sort("createdAt", -1))
    result = [_serialize_order(o) for o in orders]

    counts = {
        "pending":     orders_col.count_documents({"clientId": ObjectId(user_id), "status": "pending"}),
        "in_progress": orders_col.count_documents({"clientId": ObjectId(user_id), "status": "in_progress"}),
        "submitted":   orders_col.count_documents({"clientId": ObjectId(user_id), "status": "submitted"}),
        "completed":   orders_col.count_documents({"clientId": ObjectId(user_id), "status": "completed"}),
        "cancelled":   orders_col.count_documents({"clientId": ObjectId(user_id), "status": "cancelled"}),
    }

    return {"orders": result, "counts": counts}, 200


def accept_and_pay_order(user_id: str, order_id: str, payment_method_id=None) -> tuple:
    orders_col = get_orders_collection()
    gigs_col = get_gigs_collection()
    freelancers = get_freelancers_collection()

    try:
        client_oid = ObjectId(user_id)
        order = orders_col.find_one({
            "_id": ObjectId(order_id),
            "clientId": client_oid,
        })
    except Exception:
        return {"error": "ID de commande invalide"}, 400

    if not order:
        return {"error": "Commande introuvable ou acces refuse"}, 404

    if order.get("status") != "submitted":
        return {"error": "Seule une commande livree peut etre acceptee et payee"}, 400

    payment, error = pay_completed_gig_order(
        db,
        order,
        payment_method_id=payment_method_id,
        actor_id=user_id,
    )
    if error:
        message, code = error
        return {"error": message}, code

    gigs_col.update_one(
        {"_id": order.get("gigId")},
        {"$inc": {"ordersCompleted": 1}},
    )
    freelancers.update_one(
        {"_id": order.get("freelancerId")},
        {"$inc": {"completedProjects": 1}},
    )

    return {
        "message": "Commande acceptee et payee",
        "status": "completed",
        "payment_status": payment["status"],
        "payment_id": str(payment["_id"]),
    }, 200
