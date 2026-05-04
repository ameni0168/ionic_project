from datetime import datetime
from bson import ObjectId

def proposal_schema(
    job_id,
    freelancer_id,
    client_id,
    message,
    price,
    estimated_days=None,
    attachments=None
):
    return {
        "job_id": job_id,
        "freelancer_id": freelancer_id,
        "client_id": client_id,
        "message": message,
        "price": price,
        "price_cents": int(round(float(price) * 100)),
        "currency": "USD",
        "proposal_type": "job_application",
        "pricing_model": "fixed_total",
        "initial_sprint_outline": [],
        "revision_notes": [],
        "estimated_days": estimated_days,
        "attachments": attachments or [],
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
