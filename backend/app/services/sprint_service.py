from datetime import datetime

from bson import ObjectId

from app.services.activity_log_service import log_activity
from app.models.sprint_review_model import sprint_review_schema
from app.services.payment_service import release_payment_for_sprint


def start_sprint(db, sprint_id, actor_id=None):
    sprint = db.sprints.find_one({"_id": ObjectId(sprint_id)})
    if not sprint:
        return None, ("Sprint not found", 404)

    if sprint["status"] not in ["ready", "pending_funding"]:
        return None, ("Only ready or pending_funding sprints can be started", 400)

    contract = db.contracts.find_one({"_id": sprint["contract_id"]})
    if not contract:
        return None, ("Contract not found", 404)

    current_sprint_id = contract.get("current_sprint_id")
    if current_sprint_id and current_sprint_id != sprint["_id"]:
        current = db.sprints.find_one({"_id": current_sprint_id})
        if current and current.get("status") in ["ready", "in_progress", "submitted", "changes_requested"]:
            return None, ("Another sprint is already active for this contract", 400)

    now = datetime.utcnow()
    db.sprints.update_one(
        {"_id": sprint["_id"]},
        {"$set": {
            "status": "in_progress",
            "start_date": now,
            "updated_at": now,
        }},
    )
    db.contracts.update_one(
        {"_id": contract["_id"]},
        {"$set": {
            "current_sprint_id": sprint["_id"],
            "updated_at": now,
        }},
    )
    log_activity(
        db,
        entity_type="contract",
        entity_id=contract["_id"],
        event_type="sprint_started",
        actor_id=actor_id,
        meta={"sprint_id": sprint["_id"], "sequence": sprint["sequence"]},
    )
    sprint["status"] = "in_progress"
    sprint["start_date"] = now
    sprint["updated_at"] = now
    return sprint, None


def submit_sprint(db, sprint_id, submission_note=None, attachments=None, actor_id=None):
    sprint = db.sprints.find_one({"_id": ObjectId(sprint_id)})
    if not sprint:
        return None, ("Sprint not found", 404)

    if sprint["status"] not in ["in_progress", "changes_requested"]:
        return None, ("Only in_progress or changes_requested sprints can be submitted", 400)

    now = datetime.utcnow()
    review = sprint_review_schema(
        contract_id=sprint["contract_id"],
        sprint_id=sprint["_id"],
        submitted_by=actor_id,
        submission_note=submission_note,
        attachments=attachments,
    )
    db.sprint_reviews.insert_one(review)
    db.sprints.update_one(
        {"_id": sprint["_id"]},
        {"$set": {
            "status": "submitted",
            "submission_note": submission_note,
            "attachments": attachments or [],
            "actual_submitted_at": now,
            "updated_at": now,
        }},
    )
    log_activity(
        db,
        entity_type="contract",
        entity_id=sprint["contract_id"],
        event_type="sprint_submitted",
        actor_id=actor_id,
        meta={"sprint_id": sprint["_id"], "sequence": sprint["sequence"]},
    )
    sprint["status"] = "submitted"
    sprint["submission_note"] = submission_note
    sprint["attachments"] = attachments or []
    sprint["actual_submitted_at"] = now
    sprint["updated_at"] = now
    return sprint, None


def review_sprint(db, sprint_id, action, feedback=None, actor_id=None):
    sprint = db.sprints.find_one({"_id": ObjectId(sprint_id)})
    if not sprint:
        return None, None, ("Sprint not found", 404)

    if sprint["status"] != "submitted":
        return None, None, ("Only submitted sprints can be reviewed", 400)

    contract = db.contracts.find_one({"_id": sprint["contract_id"]})
    if not contract:
        return None, None, ("Contract not found", 404)

    latest_review = db.sprint_reviews.find_one(
        {"sprint_id": sprint["_id"]},
        sort=[("created_at", -1)],
    )
    now = datetime.utcnow()

    if action == "request_changes":
        next_revision_count = int(sprint.get("revision_count", 0)) + 1
        db.sprints.update_one(
            {"_id": sprint["_id"]},
            {"$set": {
                "status": "changes_requested",
                "client_feedback": feedback,
                "revision_count": next_revision_count,
                "updated_at": now,
            }},
        )
        if latest_review:
            db.sprint_reviews.update_one(
                {"_id": latest_review["_id"]},
                {"$set": {
                    "review_result": "changes_requested",
                    "reviewed_by": actor_id,
                    "review_note": feedback,
                    "reviewed_at": now,
                }},
            )
        log_activity(
            db,
            entity_type="contract",
            entity_id=contract["_id"],
            event_type="sprint_changes_requested",
            actor_id=actor_id,
            meta={"sprint_id": sprint["_id"], "revision_count": next_revision_count},
        )
        sprint["status"] = "changes_requested"
        sprint["client_feedback"] = feedback
        sprint["revision_count"] = next_revision_count
        sprint["updated_at"] = now
        return sprint, None, None

    db.sprints.update_one(
        {"_id": sprint["_id"]},
        {"$set": {
            "status": "approved",
            "approved_at": now,
            "client_feedback": feedback,
            "updated_at": now,
        }},
    )
    if latest_review:
        db.sprint_reviews.update_one(
            {"_id": latest_review["_id"]},
            {"$set": {
                "review_result": "approved",
                "reviewed_by": actor_id,
                "review_note": feedback,
                "reviewed_at": now,
            }},
        )

    payment = release_payment_for_sprint(db, sprint["_id"], actor_id=actor_id)
    next_sprint = db.sprints.find_one(
        {
            "contract_id": contract["_id"],
            "sequence": sprint["sequence"] + 1,
            "status": "blocked",
        }
    )
    completed_sprints_count = int(contract.get("completed_sprints_count", 0)) + 1
    contract_update = {
        "completed_sprints_count": completed_sprints_count,
        "updated_at": now,
    }
    if next_sprint:
        db.sprints.update_one(
            {"_id": next_sprint["_id"]},
            {"$set": {
                "status": "pending_funding",
                "updated_at": now,
            }},
        )
        contract_update["current_sprint_id"] = next_sprint["_id"]
    else:
        contract_update["current_sprint_id"] = None
        contract_update["status"] = "completed"
        contract_update["completed_at"] = now

    db.contracts.update_one({"_id": contract["_id"]}, {"$set": contract_update})

    final_status = "payment_released" if payment else "approved"
    db.sprints.update_one(
        {"_id": sprint["_id"]},
        {"$set": {
            "status": final_status,
            "updated_at": now,
        }},
    )
    log_activity(
        db,
        entity_type="contract",
        entity_id=contract["_id"],
        event_type="sprint_approved",
        actor_id=actor_id,
        meta={"sprint_id": sprint["_id"], "payment_released": bool(payment)},
    )

    sprint["status"] = final_status
    sprint["approved_at"] = now
    sprint["client_feedback"] = feedback
    sprint["updated_at"] = now
    return sprint, payment, None
