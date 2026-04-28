from datetime import datetime

def job_schema(
    title,
    description,
    budget_min,
    budget_max,
    budget_type,       # "fixed" or "hourly"
    deadline,
    category,
    experience_level,  # "beginner", "intermediate", "expert"
    client_id,
    skills=[]
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
        "category": category,
        "experience_level": experience_level,
        "client_id": client_id,
        "skills": skills,           # list of skill names/ids
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
