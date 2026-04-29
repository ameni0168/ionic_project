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
        "budget_type": budget_type,
        "deadline": deadline,
        "category": category,
        "experience_level": experience_level,
        "client_id": client_id,
        "skills": skills,           # list of skill names/ids
        "status": "open",           # open | in_progress | closed
        "approval_status": "pending",
        "review_note": "",
        "created_at": datetime.utcnow(),
        "reviewed_at": None,
        "proposals_count": 0
    }
