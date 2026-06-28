from fastapi import APIRouter, Request, Response, HTTPException, BackgroundTasks
from app.core.config import settings
from app.services.ai_receptionist import AIReceptionist
from app.core.crypto import (
    decrypt_whatsapp_flow_request,
    encrypt_whatsapp_flow_response,
    get_public_key_fingerprint,
    get_keyring_status,
    invalidate_key_cache,
    PRIVATE_KEY_PATH,
    PUBLIC_KEY_PATH,
)
from typing import Dict, Any
import requests as _requests
import logging
import os
import time
import json
import base64
from datetime import date, datetime, timedelta
from app.services.doctor_service import DoctorService
from app.services.schedule_service import ScheduleService
from app.services.appointment_service import AppointmentService
from app.schemas.appointment import AppointmentCreate, AppointmentStatus

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Constants ──────────────────────────────────────────────────────────────────
WA_API_VERSION = "v20.0"
_ROOT     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
DEBUG_LOG = os.path.join(_ROOT, "whatsapp_debug.log")

# ── Message deduplication (in-memory) ────────────────────────────────────────
_processed_message_ids: Dict[str, float] = {}
_DEDUP_TTL = 300

def _is_duplicate(mid: str) -> bool:
    now = time.time()
    expired = [k for k, v in _processed_message_ids.items() if now - v > _DEDUP_TTL]
    for k in expired:
        del _processed_message_ids[k]
    if mid in _processed_message_ids:
        return True
    _processed_message_ids[mid] = now
    return False

def _debug_log(msg: str):
    logger.info(msg)
    try:
        with open(DEBUG_LOG, "a") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except Exception:
        pass

# ── WhatsApp send helpers ──────────────────────────────────────────────────────
def send_whatsapp_message(to_number: str, text: str, phone_number_id: str) -> bool:
    if not settings.WHATSAPP_TOKEN or not phone_number_id:
        logger.error("[send] WHATSAPP_TOKEN or phone_number_id missing.")
        return False
    url = f"https://graph.facebook.com/{WA_API_VERSION}/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": text, "preview_url": False},
    }
    try:
        resp = _requests.post(
            url,
            headers={"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}", "Content-Type": "application/json"},
            json=payload, timeout=10,
        )
        _debug_log(f"[send] TO={to_number} STATUS={resp.status_code} BODY={resp.text[:200]}")
        return resp.status_code == 200
    except Exception as e:
        logger.error(f"[send] Exception: {e}")
        return False

def send_whatsapp_reaction(to_number: str, message_id: str, emoji: str, phone_number_id: str):
    if not settings.WHATSAPP_TOKEN or not phone_number_id:
        return
    try:
        _requests.post(
            f"https://graph.facebook.com/{WA_API_VERSION}/{phone_number_id}/messages",
            headers={"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}", "Content-Type": "application/json"},
            json={"messaging_product": "whatsapp", "recipient_type": "individual",
                  "to": to_number, "type": "reaction",
                  "reaction": {"message_id": message_id, "emoji": emoji}},
            timeout=5,
        )
    except Exception:
        pass

# ── WhatsApp Flow CTA Helper ────────────────────────────────────────────────────
def send_flow_cta_message(to_number: str, phone_number_id: str, profile_name: str = "") -> bool:
    if not settings.WHATSAPP_TOKEN or not phone_number_id:
        logger.error("[send CTA] Missing token or phone_number_id")
        return False
        
    flow_id = os.environ.get("WHATSAPP_FLOW_ID", "1569884864659929")
    
    # Compact state payload serialized into URL-Safe Base64 flow_token
    state = {"p": to_number, "n": profile_name[:30]}
    encoded_state = base64.urlsafe_b64encode(json.dumps(state).encode()).decode().rstrip("=")
    flow_token = f"tk_{encoded_state}"
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_number,
        "type": "interactive",
        "interactive": {
            "type": "flow",
            "header": {
                "type": "text",
                "text": "Book Your Appointment 🏥"
            },
            "body": {
                "text": "Welcome to *Aatomate LLP Clinic*! \n\nTap below to book an appointment with our specialists."
            },
            "footer": {
                "text": "Secure Medical Booking"
            },
            "action": {
                "name": "flow",
                "parameters": {
                    "flow_message_version": "3",
                    "flow_token": flow_token,
                    "flow_id": flow_id,
                    "flow_cta": "Book Appointment",
                    "mode": "published",
                    "flow_action": "data_exchange"
                }
            }
        }
    }
    url = f"https://graph.facebook.com/{WA_API_VERSION}/{phone_number_id}/messages"
    try:
        resp = _requests.post(
            url,
            headers={"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}", "Content-Type": "application/json"},
            json=payload, timeout=10,
        )
        _debug_log(f"[send CTA] TO={to_number} STATUS={resp.status_code}")
        return resp.status_code == 200
    except Exception as e:
        logger.error(f"[send CTA] Exception: {e}")
        return False

# ── Message processor ─────────────────────────────────────────────────────────
def process_whatsapp_message(body: Dict[Any, Any]):
    try:
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                if "statuses" in value and "messages" not in value:
                    return
                if "messages" not in value:
                    return
                metadata        = value.get("metadata", {})
                phone_number_id = metadata.get("phone_number_id", "")
                
                # Extract profile name
                contacts = value.get("contacts", [])
                profile_name = ""
                if contacts and len(contacts) > 0:
                    profile_name = contacts[0].get("profile", {}).get("name", "")

                for message in value["messages"]:
                    message_id   = message.get("id", "")
                    from_number  = message.get("from", "")
                    message_type = message.get("type", "")
                    if not from_number or not phone_number_id:
                        continue
                    if _is_duplicate(message_id):
                        logger.info(f"[process] Duplicate {message_id}, skipping.")
                        continue
                    _debug_log(f"[process] NEW MSG from={from_number} type={message_type} id={message_id}")
                    if message_type == "text":
                        text_body = message.get("text", {}).get("body", "").strip()
                        if not text_body:
                            continue
                        send_whatsapp_reaction(from_number, message_id, "\U0001f440", phone_number_id)
                        ok = send_flow_cta_message(from_number, phone_number_id, profile_name)
                        if ok:
                            send_whatsapp_reaction(from_number, message_id, "\u2705", phone_number_id)
                    elif message_type in ("image", "document", "audio", "video"):
                        send_whatsapp_message(from_number,
                            "\U0001f4ce I received your file. Our team will review it shortly.", phone_number_id)
    except Exception as e:
        logger.exception(f"[process] Error: {e}")

# ── Webhook endpoints ─────────────────────────────────────────────────────────
@router.get("/webhook")
def verify_webhook(request: Request):
    mode      = request.query_params.get("hub.mode")
    token     = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    if mode and token:
        if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
            logger.info("[webhook] Verified.")
            return Response(content=challenge, media_type="text/plain")
        raise HTTPException(status_code=403, detail="Verification failed")
    raise HTTPException(status_code=400, detail="Missing hub params")

@router.post("/webhook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.json()
    except Exception:
        return Response(content="EVENT_RECEIVED", status_code=200)
    _debug_log(f"[webhook] object={body.get('object')} entries={len(body.get('entry', []))}")
    if body.get("object") == "whatsapp_business_account":
        background_tasks.add_task(process_whatsapp_message, body)
    return Response(content="EVENT_RECEIVED", status_code=200)

# ── Flow health / management endpoints ───────────────────────────────────────
@router.get("/flow/health")
async def flow_crypto_health():
    ring = get_keyring_status()
    ok   = ring.get("key_count", 0) > 0
    return {
        "status": "ok" if ok else "error",
        "private_key_path_exists": os.path.exists(PRIVATE_KEY_PATH),
        "public_key_path_exists":  os.path.exists(PUBLIC_KEY_PATH),
        **ring,
        "hint": (
            "Run `python sync_keys.py` to generate and upload keys." if not ok else
            "Keyring active. If 421 persists after running sync_keys.py, wait 5 min for Meta CDN."
        ),
    }

@router.post("/flow/rotate-keys")
async def flow_rotate_keys():
    invalidate_key_cache()
    ring = get_keyring_status()
    return {"status": "reloaded", **ring}

# ── Flow data endpoint ────────────────────────────────────────────────────────
@router.post("/flow")
async def whatsapp_flow_endpoint(request: Request):
    """
    WhatsApp Flows Data Endpoint.
    Handles both encrypted (production) and unencrypted (development) requests.
    """
    body = await request.json()

    enc_key_b64  = body.get("encrypted_aes_key", "")
    enc_flow_b64 = body.get("encrypted_flow_data", "")
    enc_iv_b64   = body.get("initial_vector", "")
    has_enc      = bool(enc_key_b64 and enc_flow_b64 and enc_iv_b64)

    # Decode flow token for autofill
    flow_token_val = body.get("flow_token", "")
    if not flow_token_val and has_enc:
        # In prod, it's inside decrypted_body, but we haven't decrypted yet.
        pass
        
    _debug_log(
        f"[flow] REQUEST has_enc={has_enc} "
        f"aes_len={len(enc_key_b64)} flow_len={len(enc_flow_b64)} iv_len={len(enc_iv_b64)}"
    )

    # If this is a standard WhatsApp webhook, delegate to the message handler
    if body.get("object") == "whatsapp_business_account":
        import asyncio
        await asyncio.to_thread(process_whatsapp_message, body)
        return Response(content="EVENT_RECEIVED", status_code=200)

    if has_enc:
        # Log decoded byte lengths for debugging
        def _safe_b64(v):
            v = v.replace("-", "+").replace("_", "/")
            v += "=" * ((-len(v)) % 4)
            return base64.b64decode(v)
        try:
            raw_aes  = _safe_b64(enc_key_b64)
            raw_flow = _safe_b64(enc_flow_b64)
            raw_iv   = _safe_b64(enc_iv_b64)
            _debug_log(f"[flow] DECODED aes={len(raw_aes)}B flow={len(raw_flow)}B iv={len(raw_iv)}B")
        except Exception as e:
            _debug_log(f"[flow] Base64 decode error: {e}")

        try:
            decrypted_body, aes_key, iv = decrypt_whatsapp_flow_request(
                enc_key_b64, enc_flow_b64, enc_iv_b64)
            action = decrypted_body.get("action")
            _debug_log(f"[flow] DECRYPTED action={action} screen={decrypted_body.get('screen')}")
        except FileNotFoundError as e:
            logger.error(f"[flow] Key missing: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        except ValueError as e:
            logger.info(f"[flow] Client used old encryption key. Returning 421 to trigger automatic key rotation (this is normal behavior).")
            return Response(status_code=421, content="Decryption failed")
        except Exception as e:
            import traceback
            logger.error(f"[flow] Unexpected: {e}\n{traceback.format_exc()}")
            return Response(status_code=421, content=f"Decryption failed: {e}")
    else:
        decrypted_body = body
        action         = decrypted_body.get("action")
        aes_key, iv    = None, None

    screen = decrypted_body.get("screen")
    data   = decrypted_body.get("data", {})
    flow_token_val = decrypted_body.get("flow_token", "")
    
    phone_prefill, name_prefill = "", ""
    if flow_token_val and flow_token_val.startswith("tk_"):
        try:
            encoded_state = flow_token_val[3:]
            padding = len(encoded_state) % 4
            if padding:
                encoded_state += "=" * (4 - padding)
            state_json = base64.urlsafe_b64decode(encoded_state).decode()
            state = json.loads(state_json)
            phone_prefill = state.get("p", "")
            name_prefill = state.get("n", "")
            _debug_log(f"[flow] Extracted prefill: name='{name_prefill}', phone='{phone_prefill}'")
        except Exception as e:
            _debug_log(f"[flow] Failed to decode flow_token: {e}")

    # ── Flow State Machine ────────────────────────────────────────────────────
    response_data = None
    tenant_id = settings.DEFAULT_TENANT_ID

    if action == "ping":
        response_data = {"version": "3.0", "data": {"status": "active"}}

    elif action == "INIT":
        doctors = DoctorService.get_all_doctors(tenant_id)
        specialties_set = set(doc.specialization for doc in doctors if doc.specialization)
        specialties = [{"id": s, "title": s} for s in sorted(specialties_set)]
        
        response_data = {
            "version": "3.0", "screen": "DOCTOR_SELECTION",
            "data": {
                "specialties": specialties,
                "doctors": [], "is_doctor_enabled": False,
                "patient_name_prefill": name_prefill,
                "patient_phone_prefill": phone_prefill,
            },
        }

    elif action == "data_exchange":
        trigger = data.get("trigger", "")

        if screen == "DOCTOR_SELECTION":
            if trigger == "specialty_selected":
                specialty = data.get("specialty", "")
                doctors = DoctorService.get_all_doctors(tenant_id)
                available = [{"id": d.id, "title": f"Dr. {d.name}"} for d in doctors if d.specialization == specialty]
                
                specialties_set = set(doc.specialization for doc in doctors if doc.specialization)
                specialties = [{"id": s, "title": s} for s in sorted(specialties_set)]

                response_data = {
                    "version": "3.0", "screen": "DOCTOR_SELECTION",
                    "data": {
                        "specialties": specialties,
                        "doctors": available, "is_doctor_enabled": bool(available),
                        "patient_name_prefill": name_prefill,
                        "patient_phone_prefill": phone_prefill,
                    },
                }
            elif trigger == "doctor_selected_continue":
                specialty = data.get("specialty", "")
                doctor    = data.get("doctor", "")
                
                today = date.today()
                dates_list = [
                    {"id": (today + timedelta(days=i)).isoformat(), "title": (today + timedelta(days=i)).strftime("%A, %b %-d")}
                    for i in range(14)
                ]
                
                response_data = {
                    "version": "3.0", "screen": "DATE_TIME_SELECTION",
                    "data": {
                        "dates": dates_list,
                        "times": [], "is_time_enabled": False,
                        "specialty": specialty, "doctor": doctor,
                        "patient_name_prefill": name_prefill,
                        "patient_phone_prefill": phone_prefill,
                    },
                }

        elif screen == "DATE_TIME_SELECTION":
            if trigger == "date_selected":
                date_sel  = data.get("date", "")
                specialty = data.get("specialty", "")
                doctor    = data.get("doctor", "")
                
                today = date.today()
                dates_list = [
                    {"id": (today + timedelta(days=i)).isoformat(), "title": (today + timedelta(days=i)).strftime("%A, %b %-d")}
                    for i in range(14)
                ]
                
                times_list = []
                try:
                    target_date = datetime.strptime(date_sel, "%Y-%m-%d").date()
                    slots = ScheduleService.get_available_slots(tenant_id, doctor, target_date)
                    for s in slots:
                        t_obj = datetime.strptime(s.start_time, "%H:%M")
                        times_list.append({"id": s.start_time, "title": t_obj.strftime("%I:%M %p")})
                except Exception as e:
                    logger.error(f"[flow] Error fetching slots: {e}")

                response_data = {
                    "version": "3.0", "screen": "DATE_TIME_SELECTION",
                    "data": {
                        "dates": dates_list,
                        "times": times_list,
                        "is_time_enabled": bool(times_list),
                        "specialty": specialty, "doctor": doctor,
                        "patient_name_prefill": name_prefill,
                        "patient_phone_prefill": phone_prefill,
                    },
                }

        elif screen == "PATIENT_DETAILS":
            if trigger == "patient_details_submit":
                specialty = data.get("specialty", "")
                doctor_id = data.get("doctor", "")
                date_str  = data.get("date", "")
                time_str  = data.get("time", "")
                name      = data.get("name", "")
                phone     = data.get("phone", "")
                email     = data.get("email", "")
                symptoms  = data.get("symptoms", "")
                
                # Fetch doctor name for summary display
                doc_obj = DoctorService.get_doctor(tenant_id, doctor_id)
                doctor_name = doc_obj.name if doc_obj else doctor_id
                
                summary   = (f"\U0001fa7a Doctor: Dr. {doctor_name}\n"
                             f"\U0001f4c5 Date: {date_str} at {time_str}\n\n"
                             f"\U0001f464 Patient Name: {name}\n"
                             f"\U0001f4de Phone: {phone}\n"
                             f"\U0001f4dd Symptoms: {symptoms}")
                
                response_data = {
                    "version": "3.0", "screen": "SUMMARY",
                    "data": {
                        "summary_text": summary,
                        "specialty": specialty, "doctor": doctor_id,
                        "date": date_str, "time": time_str,
                        "name": name, "phone": phone, "email": email, "symptoms": symptoms,
                    },
                }

        elif screen == "SUMMARY":
            if trigger == "final_confirm":
                try:
                    date_obj     = datetime.strptime(data.get("date", ""), "%Y-%m-%d").date()
                    time_str     = data.get("time", "09:00")
                    patient_phone = data.get("phone", "")
                    patient_name  = data.get("name", "")

                    # Derive a stable patient_id from phone (strip non-digits)
                    patient_id = "wa_" + "".join(filter(str.isdigit, patient_phone or "unknown"))

                    # Calculate end time (30-minute slots)
                    t_obj     = datetime.strptime(time_str, "%H:%M")
                    end_obj   = t_obj + timedelta(minutes=30)
                    end_str   = end_obj.strftime("%H:%M")

                    appt_in = AppointmentCreate(
                        patient_id=patient_id,
                        doctor_id=data.get("doctor", ""),
                        appointment_date=date_obj,
                        appointment_time=time_str,
                        appointment_end=end_str,
                        reason_for_visit=data.get("symptoms", ""),
                        status=AppointmentStatus.CONFIRMED,
                    )
                    created = AppointmentService.create_appointment(tenant_id, appt_in)

                    # Also store the patient's display info as metadata on the appointment doc, and ensure the patient exists
                    if created:
                        try:
                            from app.db.firebase import db as _db
                            _db.collection("tenants").document(tenant_id)\
                               .collection("appointments").document(created.id)\
                               .update({
                                   "patient_name":  patient_name,
                                   "patient_phone": patient_phone,
                                   "patient_email": data.get("email", ""),
                               })
                               
                            # Use None instead of empty string for email to satisfy EmailStr
                            patient_email = data.get("email", "").strip() or None
                            from datetime import datetime
                            now = datetime.utcnow()
                            _db.collection("tenants").document(tenant_id)\
                               .collection("patients").document(patient_id)\
                               .set({
                                   "name": patient_name,
                                   "mobile_number": patient_phone,
                                   "email": patient_email,
                                   "gender": "Unknown",
                                   "dob": "1970-01-01",
                                   "created_at": now,
                                   "updated_at": now,
                               }, merge=True)
                        except Exception:
                            pass  # non-critical

                    status_val = "appointment_confirmed"
                except Exception as e:
                    logger.error(f"[flow] Error creating appointment: {e}")
                    status_val = "error"
                    
                response_data = {
                    "version": "3.0", "screen": "SUCCESS",
                    "data": {"extension_message_response": {"params": {
                        "flow_token": decrypted_body.get("flow_token", ""),
                        "status": status_val,
                        "doctor": data.get("doctor", ""),
                    }}},
                }

    if response_data is None:
        response_data = {
            "version": "3.0", "screen": "SUCCESS",
            "data": {"extension_message_response": {"params": {"status": "error"}}},
        }

    # ── Encrypt response if we have an AES key ────────────────────────────────
    if aes_key and iv:
        try:
            encrypted = encrypt_whatsapp_flow_response(response_data, aes_key, iv)
            _debug_log(f"[flow] RESPONSE encrypted OK len={len(encrypted)}")
            return Response(content=encrypted, media_type="text/plain")
        except Exception as e:
            logger.error(f"[flow] Encrypt failed: {e}")
            raise HTTPException(status_code=500, detail="Encryption failed")

    # Development mode — base64 encode unencrypted response
    b64_resp = base64.b64encode(json.dumps(response_data).encode()).decode()
    return Response(content=b64_resp, media_type="text/plain")
