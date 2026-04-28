from datetime import datetime


def sprint_plan_schema(
    contract_id,
    version,
    created_by,
    summary,
    currency,
    sprints,
):
    now = datetime.utcnow()
    total_price_cents = sum(int(item.get("price_cents", 0)) for item in sprints)
    total_duration_days = sum(int(item.get("duration_days", 0)) for item in sprints)

    normalized_sprints = []
    for index, item in enumerate(sprints, start=1):
        normalized_sprints.append({
            "sequence": item.get("sequence", index),
            "title": item["title"],
            "description": item.get("description", ""),
            "goals": item.get("goals", []),
            "deliverables": item.get("deliverables", []),
            "duration_days": int(item["duration_days"]),
            "price_cents": int(item["price_cents"]),
            "max_revisions": int(item.get("max_revisions", 2)),
        })

    return {
        "contract_id": contract_id,
        "version": version,
        "created_by": created_by,
        "summary": summary,
        "currency": currency,
        "total_price_cents": total_price_cents,
        "total_duration_days": total_duration_days,
        "status": "draft",
        "client_feedback": None,
        "sprints": normalized_sprints,
        "submitted_at": None,
        "reviewed_at": None,
        "approved_at": None,
        "rejected_at": None,
        "created_at": now,
        "updated_at": now,
    }
