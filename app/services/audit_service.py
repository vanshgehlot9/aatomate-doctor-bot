from app.db.supabase import db
from datetime import datetime

class AuditService:
    @staticmethod
    def log_action(tenant_id: str, user_id: str, action: str, entity: str, entity_id: str, details: dict = None):
        """
        Logs an audit event to the 'audit_logs' table of a tenant.
        """
        if not db:
            return
            
        try:
            log_data = {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "action": action,
                "entity": entity,
                "entity_id": entity_id,
                "details": details or {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            db.table("audit_logs").insert(log_data).execute()
        except Exception as e:
            # Audit logging shouldn't break the main flow, so we catch and print
            print(f"Failed to create audit log: {e}")
