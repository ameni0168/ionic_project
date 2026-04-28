from datetime import datetime


def contract_schema(
    job_id,
    proposal_id,
    client_id,
    freelancer_id,
    title,
    description_snapshot,
    workflow_type="sprint_based",
    source_type="job",
    currency="USD",
):
    now = datetime.utcnow()
    return {
        "job_id": job_id,
        "proposal_id": proposal_id,
        "client_id": client_id,
        "freelancer_id": freelancer_id,
        "source_type": source_type,
        "workflow_type": workflow_type,
        "title": title,
        "description_snapshot": description_snapshot,
        "currency": currency,
        "pricing_type": "fixed_by_sprint",
        "total_estimated_amount_cents": 0,
        "total_approved_amount_cents": 0,
        "escrow_enabled": True,
        "status": "awaiting_sprint_plan",
        "active_sprint_plan_id": None,
        "current_sprint_id": None,
        "completed_sprints_count": 0,
        "total_sprints_count": 0,
        "start_date": None,
        "target_end_date": None,
        "completed_at": None,
        "cancelled_at": None,
        "created_at": now,
        "updated_at": now,
    }
