from datetime import datetime

from bson import ObjectId

from app.models.payment_model import payment_schema
from app.services.activity_log_service import log_activity


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
    for field in ["contract_id", "sprint_id", "client_id", "freelancer_id"]:
        if serialized.get(field) is not None:
            serialized[field] = str(serialized[field])
    return serialized
