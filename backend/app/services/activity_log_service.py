from app.models.activity_log_model import activity_log_schema


def log_activity(db, entity_type, entity_id, event_type, actor_id=None, meta=None):
    entry = activity_log_schema(
        entity_type=entity_type,
        entity_id=entity_id,
        event_type=event_type,
        actor_id=actor_id,
        meta=meta,
    )
    db.activity_logs.insert_one(entry)
    return entry
