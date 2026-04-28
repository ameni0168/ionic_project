from datetime import datetime, timedelta


def sprint_schema(contract_id, sprint_plan_id, freelancer_id, currency, sprint_data):
    now = datetime.utcnow()
    planned_start_date = sprint_data.get("planned_start_date")
    due_date = sprint_data.get("due_date")

    if not due_date and planned_start_date and sprint_data.get("duration_days"):
        due_date = planned_start_date + timedelta(days=int(sprint_data["duration_days"]))

    return {
        "contract_id": contract_id,
        "sprint_plan_id": sprint_plan_id,
        "freelancer_id": freelancer_id,
        "sequence": int(sprint_data["sequence"]),
        "title": sprint_data["title"],
        "description": sprint_data.get("description", ""),
        "goals": sprint_data.get("goals", []),
        "deliverables": sprint_data.get("deliverables", []),
        "duration_days": int(sprint_data["duration_days"]),
        "price_cents": int(sprint_data["price_cents"]),
        "currency": currency,
        "status": "blocked",
        "planned_start_date": planned_start_date,
        "start_date": None,
        "due_date": due_date,
        "actual_submitted_at": None,
        "approved_at": None,
        "rejected_at": None,
        "revision_count": 0,
        "max_revisions": int(sprint_data.get("max_revisions", 2)),
        "submission_note": None,
        "client_feedback": None,
        "attachments": [],
        "created_at": now,
        "updated_at": now,
    }
