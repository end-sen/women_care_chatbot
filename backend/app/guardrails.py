import os
import json
import datetime
from typing import Dict, Any, Optional
from app.llm_service import classify_safety_risk

LOGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logs"))
SAFETY_LOG_FILE = os.path.join(LOGS_DIR, "safety_triage.log")

def log_safety_event(session_id: str, label: str, message: str):
    """
    Log non-ROUTINE safety classification events to local audit log.
    Includes timestamp, session_id, label, and message text (no PII).
    """
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
        log_entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "session_id": session_id,
            "label": label,
            "message": message
        }
        with open(SAFETY_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"[Guardrails] Error writing to safety log: {e}")

DANGER_SIGN_PHRASES = [
    "heavy bleeding",
    "severe abdominal pain",
    "reduced fetal movement",
    "baby stopped moving",
    "fetal movement reduced",
    "severe headache",
    "vision changes",
    "blurred vision",
    "high fever",
    "fever",
    "fluid leaking",
    "water broke",
    "vaginal bleeding",
    "severe cramps",
    "severe pain",
]

DISTRESS_COERCION_PHRASES = [
    "forced me",
    "he makes me",
    "husband makes me",
    "pressured by",
    "scared of partner",
    "afraid of my husband",
    "scared of my husband",
    "threatened me",
    "domestic violence",
    "being abused",
    "family is forcing",
    "have no choice",
    "scared of my family",
]

SELF_ADMIN_DOSAGE_PHRASES = [
    "dosage",
    "how many pills to take",
    "how many pills",
    "how to perform abortion",
    "home remedy abortion",
    "self administer",
    "drink to end pregnancy",
    "herbal abortion",
    "diy abortion",
    "take to terminate",
    "how to do abortion at home",
    "what pill can i take",
]

ROUTINE_NAV_MESSAGES = [
    "what's right for me",
    "whats right for me",
    "i want to explore what's right for me",
    "i want to explore pregnancy care",
    "pregnancy care",
    "first trimester",
    "second trimester",
    "third trimester",
    "health tips",
    "nutrition guide",
    "symptoms check",
    "overview of termination care",
    "safe termination guidance",
    "what general maternal health tips and guidelines should i follow?",
    "what vitamins, foods, and nutrition are recommended during pregnancy?",
    "what common symptoms require medical attention during pregnancy?",
    "what options exist for safe clinical termination care, who clinical standards, and licensed provider requirements?",
    "what are the exact ways and methods for pregnancy termination (medical abortion with mifepristone & misoprostol, manual vacuum aspiration mva, d&e), how they work, expected symptoms, and safety precautions?"
]

def check_safety_guardrails(message: str, session_id: str = "default_session") -> Optional[Dict[str, Any]]:
    """
    Two-layer pre-processing check against global safety guardrails:
    Layer 1: Fast keyword matching.
    Layer 2: Groq LLM risk classifier (EMERGENCY, CONCERNING, ROUTINE).
    Returns a response dict if EMERGENCY or CONCERNING is flagged, else None.
    """
    msg_lower = message.lower().strip()

    # Fast-pass for known routine navigation prompts
    if any(nav in msg_lower for nav in ROUTINE_NAV_MESSAGES):
        return None

    # Layer 1: Keyword Check
    kw_flag = None
    for phrase in DANGER_SIGN_PHRASES:
        if phrase in msg_lower:
            kw_flag = ("EMERGENCY", "danger_sign", phrase)
            break

    if not kw_flag:
        for phrase in DISTRESS_COERCION_PHRASES:
            if phrase in msg_lower:
                kw_flag = ("CONCERNING", "distress_coercion", phrase)
                break

    if not kw_flag:
        for phrase in SELF_ADMIN_DOSAGE_PHRASES:
            if phrase in msg_lower:
                kw_flag = ("CONCERNING", "self_admin_refusal", phrase)
                break

    # Layer 2: LLM Intent & Distress Classifier Check
    from app.llm_service import classify_user_intent
    intent_info = classify_user_intent(message)
    distress_flag = intent_info.get("distress_flag", False)

    is_emergency = False
    if kw_flag and kw_flag[0] == "EMERGENCY":
        is_emergency = True

    is_concerning = (kw_flag and kw_flag[0] == "CONCERNING") or distress_flag or (intent_info.get("topic") == "safety_coercion_concern")

    # 1. Handle EMERGENCY Trigger
    if is_emergency:
        matched_text = kw_flag[2] if (kw_flag and kw_flag[0] == "EMERGENCY") else "reported symptoms"
        log_safety_event(session_id, "EMERGENCY", message)
        return {
            "triggered": True,
            "type": "danger_sign",
            "matched_phrase": matched_text,
            "response": (
                "⚠️ URGENT MEDICAL WARNING: The symptoms described (" + matched_text + ") "
                "can be signs of a severe pregnancy complication requiring IMMEDIATE emergency clinical evaluation. "
                "Please do not wait for an online reply or routine appointment. Seek emergency obstetric care right away."
            ),
            "action": {
                "type": "open_facility_finder",
                "filter": "antenatal",
                "label": "🚨 Find Emergency Maternal Clinics Now"
            },
            "sources": ["WHO - Emergency Obstetric Danger Signs"]
        }

    # 2. Handle CONCERNING / Distress / Coercion Trigger
    if is_concerning:
        log_safety_event(session_id, "CONCERNING", message)
        if kw_flag and kw_flag[1] == "self_admin_refusal":
            return {
                "triggered": True,
                "type": "self_admin_refusal",
                "matched_phrase": kw_flag[2],
                "response": (
                    "🛡️ SAFE MEDICAL GUIDANCE: For your health and safety, specific medication dosages or self-administered procedure instructions "
                    "cannot be provided. Any reproductive health care or termination procedure must be evaluated and performed directly by a licensed healthcare provider "
                    "in a certified clinic setting. Attempting unverified home methods carries severe medical risks."
                ),
                "action": {
                    "type": "open_facility_finder",
                    "filter": "family_planning",
                    "label": "🏥 Connect With Licensed Family Planning Clinics"
                },
                "sources": ["WHO - Safe Reproductive Health & Clinical Standards"]
            }

        return {
            "triggered": True,
            "type": "distress_coercion",
            "matched_phrase": kw_flag[2] if kw_flag else "distress detected",
            "response": (
                "💜 YOU ARE NOT ALONE & YOUR SAFETY MATTERS: It sounds like you might be experiencing pressure, distress, or fear. "
                "Every person has the right to safe, compassionate, and confidential healthcare free from coercion or fear of harm. "
                "Support and confidential counseling services are available to help you."
            ),
            "support_card": {
                "title": "Confidential Support & Help Resources",
                "helpline": "National Maternal & Wellness Care Line: 0800-112-233 (Toll-Free, 24/7)",
                "shelter_info": "Safe Haven Emergency Support Services Available",
                "guidance": "You can speak to a trained healthcare counselor in total privacy."
            },
            "action": {
                "type": "open_facility_finder",
                "filter": "general",
                "label": "📍 Find Safe Confidential Clinics"
            },
            "sources": ["WHO & UN - Respectful Care & Rights Standards"]
        }

    return None
