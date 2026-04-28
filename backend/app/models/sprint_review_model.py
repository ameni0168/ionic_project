from datetime import datetime


def sprint_review_schema(
    contract_id,
    sprint_id,
    submitted_by,
    submission_note=None,
    attachments=None,
):
    return {
        "contract_id": contract_id,
        "sprint_id": sprint_id,
        "submitted_by": submitted_by,
        "submission_note": submission_note,
        "attachments": attachments or [],
        "status": "submitted",
        "review_result": None,
        "reviewed_by": None,
        "review_note": None,
        "created_at": datetime.utcnow(),
        "reviewed_at": None,
    }
