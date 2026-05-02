from bson import ObjectId
from app.services.sprint_plan_service import serialize_sprint
from app.services.sprint_service import start_sprint, submit_sprint, review_sprint
from app.services.sprint_plan_service import get_contract_sprints


def get_sprint_by_id(db, sprint_id):
    """Get a single sprint by its ID."""
    return db.sprints.find_one({"_id": ObjectId(sprint_id)})


def get_sprint_by_id_serialized(db, sprint_id):
    """Get a single sprint by its ID and serialize it for API response."""
    sprint = get_sprint_by_id(db, sprint_id)
    if sprint:
        return serialize_sprint(sprint)
    return None


def list_sprints(db, contract_id=None, freelancer_id=None, status=None):
    """List sprints with optional filters."""
    query = {}
    if contract_id:
        query["contract_id"] = ObjectId(contract_id)
    if freelancer_id:
        query["freelancer_id"] = freelancer_id
    if status:
        query["status"] = status

    return list(db.sprints.find(query).sort("sequence", 1))


def list_sprints_serialized(db, contract_id=None, freelancer_id=None, status=None):
    """List sprints with optional filters, serialized for API response."""
    sprints = list_sprints(db, contract_id, freelancer_id, status)
    return [serialize_sprint(s) for s in sprints]


def get_contract_sprints_serialized(db, contract_id):
    """Get all sprints for a contract, serialized."""
    sprints = get_contract_sprints(db, contract_id)
    return [serialize_sprint(s) for s in sprints]


def check_sprint_exists(db, sprint_id):
    """Check if a sprint exists by ID."""
    return db.sprints.count_documents({"_id": ObjectId(sprint_id)}) > 0


def can_start_sprint(db, sprint_id):
    """Check if a sprint can be started."""
    sprint = get_sprint_by_id(db, sprint_id)
    if not sprint:
        return False, "Sprint not found"
    if sprint["status"] not in ["ready", "pending_funding"]:
        return False, "Sprint is not ready to start"
    return True, None


def can_submit_sprint(db, sprint_id):
    """Check if a sprint can be submitted."""
    sprint = get_sprint_by_id(db, sprint_id)
    if not sprint:
        return False, "Sprint not found"
    if sprint["status"] not in ["in_progress", "changes_requested"]:
        return False, "Sprint cannot be submitted in current state"
    return True, None


def can_review_sprint(db, sprint_id):
    """Check if a sprint can be reviewed."""
    sprint = get_sprint_by_id(db, sprint_id)
    if not sprint:
        return False, "Sprint not found"
    if sprint["status"] != "submitted":
        return False, "Only submitted sprints can be reviewed"
    return True, None
