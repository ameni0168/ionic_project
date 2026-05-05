from datetime import datetime


def _normalize_categories(value):
    if isinstance(value, list):
        items = value
    elif value is None:
        items = []
    else:
        items = [value]

    normalized = []
    for item in items:
        text = str(item).strip()
        if text and text not in normalized:
            normalized.append(text)
    return normalized


def job_schema(
    title,
    description,
    budget_min,
    budget_max,
    budget_type,
    deadline,
    category,
    experience_level,
    client_id,
    skills=None,
):
    return {
        "title": title,
        "description": description,
        "budget_min": float(budget_min),
        "budget_max": float(budget_max),
        "budget_min_cents": int(round(float(budget_min) * 100)),
        "budget_max_cents": int(round(float(budget_max) * 100)),
        "budget_type": budget_type,
        "deadline": deadline,
        "category": _normalize_categories(category),
        "experience_level": experience_level,
        "client_id": client_id,
        "skills": skills or [],
        "status": "open",
        "approval_status": "pending",
        "review_note": "",
        "created_at": datetime.utcnow(),
        "reviewed_at": None,
        "workflow_type": "single_delivery",
        "engagement_mode": "job_post",
        "hiring_status": "open",
        "selected_proposal_id": None,
        "selected_freelancer_id": None,
        "contract_id": None,
        "status": "open",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "proposals_count": 0
    }
