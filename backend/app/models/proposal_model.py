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
        "estimated_days": estimated_days,
        "attachments": attachments or [],
        "status": "pending",  # pending, accepted, rejected
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }