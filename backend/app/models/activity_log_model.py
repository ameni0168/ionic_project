from datetime import datetime


def activity_log_schema(entity_type, entity_id, event_type, actor_id=None, meta=None):
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "event_type": event_type,
        "actor_id": actor_id,
        "meta": meta or {},
        "created_at": datetime.utcnow(),
    }
