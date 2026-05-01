from datetime import datetime

from bson import ObjectId

from app.models.contract_model import contract_schema
from app.services.activity_log_service import log_activity


def create_contract(db, job, proposal, currency="USD", actor_id=None):
    contract = contract_schema(
        job_id=job["_id"],
        proposal_id=proposal["_id"],
        client_id=proposal["client_id"],
        freelancer_id=proposal["freelancer_id"],
        title=job.get("title", ""),
        description_snapshot=job.get("description", ""),
        workflow_type=job.get("workflow_type", "sprint_based"),
        source_type="job",
        currency=currency,
    )
    result = db.contracts.insert_one(contract)
    contract["_id"] = result.inserted_id

    now = datetime.utcnow()
    db.jobs.update_one(
        {"_id": job["_id"]},
        {"$set": {
            "workflow_type": "sprint_based",
            "selected_proposal_id": proposal["_id"],
            "selected_freelancer_id": proposal["freelancer_id"],
            "contract_id": result.inserted_id,
            "status": "active",
            "hiring_status": "contract_created",
            "updated_at": now,
        }},
    )

    log_activity(
        db,
        entity_type="contract",
        entity_id=result.inserted_id,
        event_type="contract_created",
        actor_id=actor_id,
        meta={
            "job_id": job["_id"],
            "proposal_id": proposal["_id"],
            "freelancer_id": proposal["freelancer_id"],
        },
    )
    return contract


def get_contract_by_id(db, contract_id):
    return db.contracts.find_one({"_id": ObjectId(contract_id)})


def list_contracts(db, filters=None):
    query = {}
    filters = filters or {}

    for key in ["client_id", "freelancer_id", "status", "job_id"]:
        value = filters.get(key)
        if value:
            if key in ["client_id", "freelancer_id", "job_id"] and ObjectId.is_valid(value):
                # Handle both string and ObjectId storage formats
                query[key] = {"$in": [ObjectId(value), value]}
            else:
                query[key] = value

    return list(db.contracts.find(query).sort("updated_at", -1))


def serialize_contract(contract):
    if not contract:
        return None

    serialized = dict(contract)
    serialized["_id"] = str(serialized["_id"])
    for field in [
        "job_id",
        "proposal_id",
        "client_id",
        "freelancer_id",
        "active_sprint_plan_id",
        "current_sprint_id",
    ]:
        if serialized.get(field) is not None:
            serialized[field] = str(serialized[field])
    return serialized
