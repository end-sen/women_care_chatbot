import re
from typing import Dict, Any, Optional

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

def check_safety_guardrails(message: str) -> Optional[Dict[str, Any]]:
    """
    Pre-processing check against global safety guardrails.
    Returns a dict with guardrail response if triggered, or None if safe.
    """
    msg_lower = message.lower().strip()

    # 1. Check Danger Signs
    for phrase in DANGER_SIGN_PHRASES:
        if phrase in msg_lower:
            return {
                "triggered": True,
                "type": "danger_sign",
                "matched_phrase": phrase,
                "response": (
                    "⚠️ URGENT MEDICAL WARNING: The symptoms you described (" + phrase + ") "
                    "can be a sign of a severe pregnancy complication requiring IMMEDIATE emergency clinical evaluation. "
                    "Please do not wait for an online reply or routine appointment. Seek emergency obstetric care right away."
                ),
                "action": {
                    "type": "open_facility_finder",
                    "filter": "antenatal",
                    "label": "🚨 Find Emergency Maternal Clinics Now"
                },
                "sources": ["WHO - Emergency Obstetric Danger Signs"]
            }

    # 2. Check Self-Administration / Dosage Requests
    for phrase in SELF_ADMIN_DOSAGE_PHRASES:
        if phrase in msg_lower:
            return {
                "triggered": True,
                "type": "self_admin_refusal",
                "matched_phrase": phrase,
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

    # 3. Check Distress / Coercion
    for phrase in DISTRESS_COERCION_PHRASES:
        if phrase in msg_lower:
            return {
                "triggered": True,
                "type": "distress_coercion",
                "matched_phrase": phrase,
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
