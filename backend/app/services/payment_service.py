from datetime import datetime

from bson import ObjectId

from app.models.payment_model import payment_schema
from app.services.activity_log_service import log_activity


def _object_id_or_none(value):
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(str(value))
    except Exception:
        return None


def _payment_amount(payment):
    return int(payment.get("amount_cents", 0) or 0) / 100


def _mark_client_payment_in_profile_stats(db, payment):
    amount = _payment_amount(payment)
    now = datetime.utcnow()

    client_oid = _object_id_or_none(payment.get("client_id"))
    if client_oid:
        db.clients.update_one(
            {"$or": [{"userId": client_oid}, {"_id": client_oid}]},
            {
                "$inc": {"stats.total_spent": amount},
                "$set": {"updatedAt": now},
            },
        )


def _mark_freelancer_payment_in_profile_stats(db, payment):
    amount = _payment_amount(payment)
    now = datetime.utcnow()

    freelancer_oid = _object_id_or_none(payment.get("freelancer_id"))
    if freelancer_oid:
        db.freelancers.update_one(
            {"$or": [{"userId": freelancer_oid}, {"_id": freelancer_oid}]},
            {
                "$inc": {"earned": amount},
                "$set": {"updatedAt": now},
            },
        )


def _mark_payment_in_profile_stats(db, payment):
    _mark_client_payment_in_profile_stats(db, payment)
    _mark_freelancer_payment_in_profile_stats(db, payment)


def fund_sprint(db, sprint_id, client_id, amount_cents, payment_method_id=None):
    sprint = db.sprints.find_one({"_id": ObjectId(sprint_id)})
    if not sprint:
        return None, ("Sprint not found", 404)

    if sprint["status"] not in ["pending_funding", "ready"]:
        return None, ("Only pending_funding or ready sprints can be funded", 400)

    if int(amount_cents) != int(sprint["price_cents"]):
        return None, ("Amount must match sprint price_cents", 400)

    existing = db.payments.find_one({
        "sprint_id": sprint["_id"],
        "status": {"$in": ["held", "authorized", "released"]},
    })
    if existing:
        return None, ("This sprint already has an active payment record", 400)

    contract = db.contracts.find_one({"_id": sprint["contract_id"]})
    if not contract:
        return None, ("Contract not found", 404)

    payment = payment_schema(
        contract_id=contract["_id"],
        sprint_id=sprint["_id"],
        client_id=client_id,
        freelancer_id=contract["freelancer_id"],
        amount_cents=amount_cents,
        currency=sprint.get("currency", contract.get("currency", "USD")),
        payment_method_id=payment_method_id,
    )
    result = db.payments.insert_one(payment)
    payment["_id"] = result.inserted_id

    now = datetime.utcnow()
    db.sprints.update_one(
        {"_id": sprint["_id"]},
        {"$set": {
            "status": "ready",
            "updated_at": now,
        }},
    )
    log_activity(
        db,
        entity_type="contract",
        entity_id=contract["_id"],
        event_type="sprint_funded",
        actor_id=client_id,
        meta={"sprint_id": sprint["_id"], "payment_id": payment["_id"], "amount_cents": int(amount_cents)},
    )
    payment["status"] = "held"
    return payment, None


def pay_completed_gig_order(db, order, payment_method_id=None, actor_id=None):
    existing = db.payments.find_one({
        "order_id": order["_id"],
        "status": {"$in": ["held", "authorized", "released"]},
    })
    if existing:
        return None, ("This order already has an active payment record", 400)

    now = datetime.utcnow()
    amount_cents = int(round(float(order.get("price", 0) or 0) * 100))
    payment = {
        "contract_id": None,
        "sprint_id": None,
        "order_id": order["_id"],
        "gig_id": order.get("gigId"),
        "client_id": order.get("clientId"),
        "freelancer_id": order.get("freelancerId"),
        "type": "gig_order",
        "amount_cents": amount_cents,
        "currency": order.get("currency", "USD"),
        "status": "released",
        "provider": "manual",
        "provider_reference": payment_method_id,
        "funded_at": now,
        "released_at": now,
        "failed_at": None,
        "refunded_at": None,
        "meta": {
            "fee_cents": 0,
            "tax_cents": 0,
        },
        "created_at": now,
        "updated_at": now,
    }
    result = db.payments.insert_one(payment)
    payment["_id"] = result.inserted_id

    db.orders.update_one(
        {"_id": order["_id"]},
        {"$set": {
            "payment_id": payment["_id"],
            "payment_status": "released",
            "paidAt": now,
            "completedAt": now,
            "status": "completed",
            "updatedAt": now,
        }},
    )

    _mark_payment_in_profile_stats(db, payment)
    log_activity(
        db,
        entity_type="order",
        entity_id=order["_id"],
        event_type="gig_order_paid",
        actor_id=actor_id or order.get("clientId"),
        meta={"payment_id": payment["_id"], "amount_cents": amount_cents},
    )
    return payment, None


def release_payment_for_sprint(db, sprint_id, actor_id=None):
    payment = db.payments.find_one(
        {"sprint_id": sprint_id, "status": {"$in": ["held", "authorized"]}},
        sort=[("created_at", -1)],
    )
    if not payment:
        return None

    now = datetime.utcnow()
    db.payments.update_one(
        {"_id": payment["_id"]},
        {"$set": {
            "status": "released",
            "released_at": now,
            "updated_at": now,
        }},
    )
    _mark_payment_in_profile_stats(db, payment)
    log_activity(
        db,
        entity_type="contract",
        entity_id=payment["contract_id"],
        event_type="payment_released",
        actor_id=actor_id,
        meta={"payment_id": payment["_id"], "sprint_id": sprint_id},
    )
    payment["status"] = "released"
    payment["released_at"] = now
    payment["updated_at"] = now
    return payment


def list_contract_payments(db, contract_id):
    return list(db.payments.find({"contract_id": ObjectId(contract_id)}).sort("created_at", -1))


def summarize_contract_payments(payments):
    funded = sum(int(item.get("amount_cents", 0)) for item in payments if item.get("status") in ["held", "authorized", "released"])
    released = sum(int(item.get("amount_cents", 0)) for item in payments if item.get("status") == "released")
    return {
        "funded_cents": funded,
        "released_cents": released,
        "remaining_cents": funded - released,
    }


def serialize_payment(payment):
    serialized = dict(payment)
    serialized["_id"] = str(serialized["_id"])
    for field in ["contract_id", "sprint_id", "order_id", "gig_id", "client_id", "freelancer_id"]:
        if serialized.get(field) is not None:
            serialized[field] = str(serialized[field])
    return serialized
