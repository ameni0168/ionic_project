from datetime import datetime

from bson import ObjectId

from app.models.sprint_plan_model import sprint_plan_schema
from app.models.sprint_model import sprint_schema
from app.services.activity_log_service import log_activity


def validate_sprint_items(sprints):
    if not isinstance(sprints, list) or not sprints:
        return "Field 'sprints' must be a non-empty array"

    for index, item in enumerate(sprints, start=1):
        for field in ["title", "duration_days", "price_cents"]:
            if field not in item:
                return f"Sprint #{index} is missing field: {field}"
        if int(item["duration_days"]) <= 0:
            return f"Sprint #{index} must have a positive duration_days"
        if int(item["price_cents"]) < 0:
            return f"Sprint #{index} must have a non-negative price_cents"
    return None


def create_sprint_plan(db, contract, payload, actor_id):
    version = db.sprint_plans.count_documents({"contract_id": contract["_id"]}) + 1
    sprint_plan = sprint_plan_schema(
        contract_id=contract["_id"],
        version=version,
        created_by=actor_id,
        summary=payload["summary"],
        currency=payload.get("currency", contract.get("currency", "USD")),
        sprints=payload["sprints"],
    )
    result = db.sprint_plans.insert_one(sprint_plan)
    sprint_plan["_id"] = result.inserted_id

    log_activity(
        db,
        entity_type="contract",
        entity_id=contract["_id"],
        event_type="sprint_plan_created",
        actor_id=actor_id,
        meta={"sprint_plan_id": result.inserted_id, "version": version},
    )
    return sprint_plan


def update_sprint_plan(db, sprint_plan, payload, actor_id):
    now = datetime.utcnow()
    normalized = sprint_plan_schema(
        contract_id=sprint_plan["contract_id"],
        version=sprint_plan["version"],
        created_by=sprint_plan.get("created_by", actor_id),
        summary=payload.get("summary", sprint_plan.get("summary", "")),
        currency=payload.get("currency", sprint_plan.get("currency", "USD")),
        sprints=payload.get("sprints", sprint_plan.get("sprints", [])),
    )
    update_data = {
        "summary": normalized["summary"],
        "currency": normalized["currency"],
        "total_price_cents": normalized["total_price_cents"],
        "total_duration_days": normalized["total_duration_days"],
        "sprints": normalized["sprints"],
        "updated_at": now,
    }
    db.sprint_plans.update_one({"_id": sprint_plan["_id"]}, {"$set": update_data})
    log_activity(
        db,
        entity_type="contract",
        entity_id=sprint_plan["contract_id"],
        event_type="sprint_plan_updated",
        actor_id=actor_id,
        meta={"sprint_plan_id": sprint_plan["_id"]},
    )
    sprint_plan.update(update_data)
    return sprint_plan


def submit_sprint_plan(db, sprint_plan, actor_id):
    now = datetime.utcnow()
    db.sprint_plans.update_one(
        {"_id": sprint_plan["_id"]},
        {"$set": {
            "status": "submitted",
            "submitted_at": now,
            "updated_at": now,
        }},
    )
    db.contracts.update_one(
        {"_id": sprint_plan["contract_id"]},
        {"$set": {"status": "sprint_plan_under_review", "updated_at": now}},
    )
    log_activity(
        db,
        entity_type="contract",
        entity_id=sprint_plan["contract_id"],
        event_type="sprint_plan_submitted",
        actor_id=actor_id,
        meta={"sprint_plan_id": sprint_plan["_id"]},
    )


def review_sprint_plan(db, sprint_plan, action, feedback, actor_id):
    now = datetime.utcnow()
    if action == "request_revision":
        db.sprint_plans.update_one(
            {"_id": sprint_plan["_id"]},
            {"$set": {
                "status": "revision_requested",
                "client_feedback": feedback,
                "reviewed_at": now,
                "updated_at": now,
            }},
        )
        db.contracts.update_one(
            {"_id": sprint_plan["contract_id"]},
            {"$set": {"status": "awaiting_sprint_plan", "updated_at": now}},
        )
        log_activity(
            db,
            entity_type="contract",
            entity_id=sprint_plan["contract_id"],
            event_type="sprint_plan_revision_requested",
            actor_id=actor_id,
            meta={"sprint_plan_id": sprint_plan["_id"]},
        )
        return {"created_sprints": 0}

    db.sprint_plans.update_many(
        {
            "contract_id": sprint_plan["contract_id"],
            "_id": {"$ne": sprint_plan["_id"]},
            "status": {"$in": ["draft", "submitted", "revision_requested"]},
        },
        {"$set": {"status": "superseded", "updated_at": now}},
    )
    db.sprint_plans.update_one(
        {"_id": sprint_plan["_id"]},
        {"$set": {
            "status": "approved",
            "client_feedback": feedback,
            "reviewed_at": now,
            "approved_at": now,
            "updated_at": now,
        }},
    )

    db.sprints.delete_many({"contract_id": sprint_plan["contract_id"]})
    created_sprints = []
    for item in sprint_plan["sprints"]:
        sprint = sprint_schema(
            contract_id=sprint_plan["contract_id"],
            sprint_plan_id=sprint_plan["_id"],
            freelancer_id=db.contracts.find_one({"_id": sprint_plan["contract_id"]})["freelancer_id"],
            currency=sprint_plan["currency"],
            sprint_data=item,
        )
        sprint["status"] = "pending_funding" if item["sequence"] == 1 else "blocked"
        insert_result = db.sprints.insert_one(sprint)
        created_sprints.append(insert_result.inserted_id)

    current_sprint_id = created_sprints[0] if created_sprints else None
    db.contracts.update_one(
        {"_id": sprint_plan["contract_id"]},
        {"$set": {
            "status": "active",
            "active_sprint_plan_id": sprint_plan["_id"],
            "current_sprint_id": current_sprint_id,
            "total_sprints_count": len(created_sprints),
            "completed_sprints_count": 0,
            "total_estimated_amount_cents": sprint_plan["total_price_cents"],
            "total_approved_amount_cents": sprint_plan["total_price_cents"],
            "updated_at": now,
        }},
    )
    log_activity(
        db,
        entity_type="contract",
        entity_id=sprint_plan["contract_id"],
        event_type="sprint_plan_approved",
        actor_id=actor_id,
        meta={"sprint_plan_id": sprint_plan["_id"], "created_sprints": len(created_sprints)},
    )
    return {"created_sprints": len(created_sprints)}


def get_contract_sprints(db, contract_id):
    return list(db.sprints.find({"contract_id": ObjectId(contract_id)}).sort("sequence", 1))


def get_sprint_plan_by_id(db, plan_id):
    return db.sprint_plans.find_one({"_id": ObjectId(plan_id)})


def list_contract_sprint_plans(db, contract_id):
    return list(db.sprint_plans.find({"contract_id": ObjectId(contract_id)}).sort("version", -1))


def serialize_sprint_plan(sprint_plan):
    serialized = dict(sprint_plan)
    serialized["_id"] = str(serialized["_id"])
    serialized["contract_id"] = str(serialized["contract_id"])
    return serialized


def serialize_sprint(sprint):
    serialized = dict(sprint)
    serialized["_id"] = str(serialized["_id"])
    serialized["contract_id"] = str(serialized["contract_id"])
    serialized["sprint_plan_id"] = str(serialized["sprint_plan_id"])
    return serialized
