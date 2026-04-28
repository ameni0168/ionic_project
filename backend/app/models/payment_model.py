from datetime import datetime


def payment_schema(
    contract_id,
    sprint_id,
    client_id,
    freelancer_id,
    amount_cents,
    currency="USD",
    payment_method_id=None,
):
    now = datetime.utcnow()
    return {
        "contract_id": contract_id,
        "sprint_id": sprint_id,
        "client_id": client_id,
        "freelancer_id": freelancer_id,
        "type": "escrow_release",
        "amount_cents": int(amount_cents),
        "currency": currency,
        "status": "held",
        "provider": "manual",
        "provider_reference": payment_method_id,
        "funded_at": now,
        "released_at": None,
        "failed_at": None,
        "refunded_at": None,
        "meta": {
            "fee_cents": 0,
            "tax_cents": 0,
        },
        "created_at": now,
        "updated_at": now,
    }
