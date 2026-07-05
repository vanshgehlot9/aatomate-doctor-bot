"""
Medical Report Service
Handles: upload, AI processing (OCR + Gemini), retrieval (timeline), search, comparison.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import uuid

from app.db.supabase import db
from app.schemas.report import (
    MedicalReportCreate,
    MedicalReportInDB,
    MedicalReportUpdate,
    ReportStatus,
)

logger = logging.getLogger(__name__)

REPORTS_COLLECTION = "medical_reports"


class ReportService:

    # ── CRUD ──────────────────────────────────────────────────────────────────

    @staticmethod
    def create_report(tenant_id: str, report_in: MedicalReportCreate) -> MedicalReportInDB:
        if not db: return None
        
        now = datetime.utcnow()
        data = report_in.dict()
        data["tenant_id"] = tenant_id
        data["created_at"] = now.isoformat()
        data["updated_at"] = now.isoformat()
        
        response = db.table(REPORTS_COLLECTION).insert(data).execute()
        if response.data:
            return MedicalReportInDB(**response.data[0])
        return None

    @staticmethod
    def get_report(tenant_id: str, report_id: str) -> Optional[MedicalReportInDB]:
        if not db: return None
        
        response = db.table(REPORTS_COLLECTION).select("*").eq("tenant_id", tenant_id).eq("id", report_id).execute()
        if response.data:
            return MedicalReportInDB(**response.data[0])
        return None

    @staticmethod
    def update_report(tenant_id: str, report_id: str, update: MedicalReportUpdate) -> Optional[MedicalReportInDB]:
        if not db: return None
        
        patch = {k: v for k, v in update.dict().items() if v is not None}
        patch["updated_at"] = datetime.utcnow().isoformat()
        
        # Ensure enums are unwrapped
        if "status" in patch and hasattr(patch["status"], "value"):
            patch["status"] = patch["status"].value
            
        response = db.table(REPORTS_COLLECTION).update(patch).eq("tenant_id", tenant_id).eq("id", report_id).execute()
        
        if response.data:
            return MedicalReportInDB(**response.data[0])
        return None

    # ── Timeline (chronological, newest first) ────────────────────────────────

    @staticmethod
    def get_patient_reports(
        tenant_id: str,
        patient_id: str,
        limit: int = 50
    ) -> List[MedicalReportInDB]:
        """Return reports for a patient, newest first."""
        if not db: return []
        
        try:
            response = db.table(REPORTS_COLLECTION).select("*").eq("tenant_id", tenant_id).eq("patient_id", patient_id).order("created_at", desc=True).limit(limit).execute()
            
            if response.data:
                return [MedicalReportInDB(**row) for row in response.data]
            return []
        except Exception as e:
            logger.error(f"[ReportService] get_patient_reports error: {e}")
            return []

    # ── Search ────────────────────────────────────────────────────────────────

    @staticmethod
    def search_reports(
        tenant_id: str,
        patient_id: Optional[str],
        query: str,
        limit: int = 10
    ) -> List[MedicalReportInDB]:
        """Simple tag/type search. Returns reports whose tags or report_type contain the query."""
        if not db: return []
        
        try:
            q = query.strip().lower()
            
            # Using ilike for search on Supabase (Postgres)
            # Searching multiple columns with OR is supported via PostgREST syntax or multiple ilike conditions
            
            query_builder = db.table(REPORTS_COLLECTION).select("*").eq("tenant_id", tenant_id)
            if patient_id:
                query_builder = query_builder.eq("patient_id", patient_id)
                
            # For simplicity, we fetch them and filter locally like before, or we could build a complex OR query
            response = query_builder.execute()
            
            results = []
            if response.data:
                for row in response.data:
                    tags = [t.lower() for t in row.get("tags", [])]
                    rtype = row.get("report_type", "").lower()
                    ocr = row.get("ocr_text", "").lower()
                    if q in tags or q in rtype or q in ocr:
                        results.append(MedicalReportInDB(**row))
                    if len(results) >= limit:
                        break
            return results
        except Exception as e:
            logger.error(f"[ReportService] search_reports error: {e}")
            return []

    # ── AI Processing (background task) ───────────────────────────────────────

    @staticmethod
    def process_report_async(tenant_id: str, report_id: str, image_bytes: bytes, mime_type: str):
        """
        Call this as a FastAPI BackgroundTask.
        Runs OCR + AI extraction + summary, then updates the report doc.
        """
        if not db: return
        
        try:
            from app.services.ocr_engine import ocr_engine
            from app.schemas.report import MedicalReportUpdate, ReportStatus

            # Mark as processing
            db.table(REPORTS_COLLECTION).update({
                "status": ReportStatus.PROCESSING.value,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("tenant_id", tenant_id).eq("id", report_id).execute()

            # Run AI extraction
            result = ocr_engine.extract_report(image_bytes, mime_type)

            update = MedicalReportUpdate(
                report_type=result.get("report_type", "Other"),
                category=result.get("category", "Other"),
                report_date=result.get("report_date"),
                ocr_text=result.get("ocr_text", ""),
                structured_data=result.get("structured_data", {}),
                ai_summary=result.get("ai_summary", ""),
                ai_recommendation=result.get("ai_recommendation", ""),
                tags=result.get("tags", []),
                status=ReportStatus.PROCESSED,
            )
            ReportService.update_report(tenant_id, report_id, update)
            logger.info(f"[ReportService] Report {report_id} processed successfully.")
        except Exception as e:
            logger.error(f"[ReportService] process_report_async error for {report_id}: {e}")
            try:
                db.table(REPORTS_COLLECTION).update({
                    "status": ReportStatus.FAILED.value,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("tenant_id", tenant_id).eq("id", report_id).execute()
            except Exception:
                pass

    # ── Report Comparison (AI) ────────────────────────────────────────────────

    @staticmethod
    def compare_reports(tenant_id: str, report_id_1: str, report_id_2: str) -> str:
        """Use Gemini to compare two reports and explain parameter trends."""
        try:
            r1 = ReportService.get_report(tenant_id, report_id_1)
            r2 = ReportService.get_report(tenant_id, report_id_2)
            if not r1 or not r2:
                return "One or both reports not found."

            import google.generativeai as genai
            import os, json
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
Compare the following two medical reports for the same patient and highlight improvements, regressions, and stable parameters.

Report 1 (Date: {r1.report_date or r1.created_at}):
{json.dumps(r1.structured_data or {}, indent=2)}

Report 2 (Date: {r2.report_date or r2.created_at}):
{json.dumps(r2.structured_data or {}, indent=2)}

Return a concise clinical comparison in plain text. Use ↑ for improvement, ↓ for worsening, → for stable.
"""
            resp = model.generate_content(prompt)
            return resp.text
        except Exception as e:
            logger.error(f"[ReportService] compare_reports error: {e}")
            return "Unable to generate comparison at this time."

    # ── Formatted timeline text for WhatsApp ─────────────────────────────────

    @staticmethod
    def format_timeline_for_whatsapp(reports: List[MedicalReportInDB]) -> str:
        """Group reports by month and return a human-readable WhatsApp string."""
        if not reports:
            return "No reports found."

        from collections import defaultdict
        grouped: Dict[str, List[MedicalReportInDB]] = defaultdict(list)
        for r in reports:
            dt = r.created_at if isinstance(r.created_at, datetime) else datetime.utcnow()
            key = dt.strftime("%B %Y")
            grouped[key].append(r)

        lines = ["📋 *Your Medical Reports*\n"]
        for month, reps in grouped.items():
            lines.append(f"*{month}*")
            for r in reps:
                icon = "🔬" if r.category == "Laboratory" else "🩻" if r.category == "Radiology" else "💊"
                lines.append(f"  {icon} {r.report_type}  _{r.report_date or '—'}_")
            lines.append("")
        return "\n".join(lines)
