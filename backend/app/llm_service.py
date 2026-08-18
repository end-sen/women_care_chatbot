import os
import time
import json
import re
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

def get_groq_api_keys() -> List[str]:
    """
    Collect all available Groq API keys from environment variables.
    Supports GROQ_API_KEY, GROQ_API_KEY_2..10, and GROQ_API_KEYS (comma-separated).
    """
    keys = []
    primary = os.getenv("GROQ_API_KEY")
    if primary and primary.strip() and primary.strip() != "your_groq_api_key_here":
        keys.append(primary.strip())

    for i in range(2, 11):
        k = os.getenv(f"GROQ_API_KEY_{i}")
        if k and k.strip() and k.strip() != "your_groq_api_key_here":
            keys.append(k.strip())

    multi = os.getenv("GROQ_API_KEYS")
    if multi:
        for item in multi.split(","):
            item_clean = item.strip()
            if item_clean and item_clean != "your_groq_api_key_here":
                keys.append(item_clean)

    return list(dict.fromkeys(keys))

def get_groq_clients() -> List[Tuple[str, Any]]:
    """
    Instantiate Groq clients for all available API keys in the key pool.
    Returns list of (key_identifier, GroqClient) tuples.
    """
    clients = []
    keys = get_groq_api_keys()
    for idx, key in enumerate(keys, 1):
        try:
            from groq import Groq
            client = Groq(api_key=key)
            masked = key[:7] + "..." + key[-4:] if len(key) > 11 else f"Key#{idx}"
            clients.append((masked, client))
        except Exception as e:
            print(f"[LLM Service] Failed to initialize Groq client for key index {idx}: {e}")
    return clients

groq_clients = get_groq_clients()
groq_client = groq_clients[0][1] if groq_clients else None

FALLBACK_MODELS = [
    os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
    "openai/gpt-oss-20b",
    "allam-2-7b",
    "qwen/qwen3.6-27b",
    "groq/compound-mini"
]

def call_groq_with_retry(messages: list, model: str = None, temperature: float = 0.2, max_tokens: int = 500, max_retries: int = 1) -> str:
    """
    Call Groq API with multi API key rotation and model fallback.
    If an API key hits a rate limit or quota error (429), it automatically fails over to the next API key in the pool.
    """
    active_clients = get_groq_clients()
    if not active_clients:
        raise RuntimeError("No valid Groq API clients available in key pool")

    models_to_try = []
    if model:
        models_to_try.append(model)
    for m in FALLBACK_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    last_err = None

    # Iterate through all available API keys in the key pool
    for client_name, client in active_clients:
        key_rate_limited = False
        for target_model in models_to_try:
            if key_rate_limited:
                break
            for attempt in range(max_retries + 1):
                try:
                    completion = client.chat.completions.create(
                        messages=messages,
                        model=target_model,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                    return completion.choices[0].message.content.strip()
                except Exception as e:
                    last_err = e
                    err_msg = str(e).lower()
                    print(f"[LLM Service] Groq key '{client_name}' model '{target_model}' attempt {attempt + 1} failed: {e}")
                    
                    # If rate limited (429 / quota exceeded), failover to next API key immediately
                    if any(rate_kw in err_msg for rate_kw in ["429", "rate_limit", "rate limit", "quota", "limit exceeded", "tpd", "tpm"]):
                        print(f"[LLM Service] Rate limit hit on API key '{client_name}'. Rotational failover to next API key in pool...")
                        key_rate_limited = True
                        break
                    
                    # If model not found or decommissioned, try next model for current key
                    if any(model_kw in err_msg for model_kw in ["model_not_found", "404", "does not exist", "decommissioned", "400"]):
                        break
                    
                    if attempt < max_retries:
                        time.sleep(1)

    raise last_err

import json

INTENT_CLASSIFIER_PROMPT = """You are an intent and safety classifier for a maternal health assistant.
Analyze the user's message and respond ONLY with a JSON object containing "topic" and "distress_flag".

"topic" MUST be one of:
- "pregnancy_confirmation"
- "missed_period"
- "antenatal_care"
- "postpartum"
- "nutrition"
- "termination"
- "safety_coercion_concern"
- "general_question"
- "no_who_topic_match"

"distress_flag" MUST be a boolean (true or false):
- Set to true ONLY if the message contains explicit signals of fear, abuse, coercion, pressure from others, threat, or danger.
- Set to false for all neutral or informational statements, such as "tested positive", "missed period for 2 months", "what are the symptoms", "I want to explore options", etc.

Respond with ONLY valid JSON, e.g.: {"topic": "missed_period", "distress_flag": false}
"""

def classify_user_intent(message: str) -> Dict[str, Any]:
    """
    Lightweight Groq LLM intent & distress classifier call (not keyword matching).
    Returns dict: {"topic": str, "distress_flag": bool}
    """
    if not groq_client:
        return {"topic": "general_question", "distress_flag": False}

    try:
        raw_res = call_groq_with_retry(
            messages=[
                {"role": "system", "content": INTENT_CLASSIFIER_PROMPT},
                {"role": "user", "content": message}
            ],
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
            temperature=0.0,
            max_tokens=100,
            max_retries=2
        )

        cleaned = re.sub(r'<think>.*?(?:</think>|$)', '', raw_res, flags=re.DOTALL).strip()
        data = json.loads(cleaned)
        return {
            "topic": str(data.get("topic", "general_question")),
            "distress_flag": bool(data.get("distress_flag", False))
        }
    except Exception as e:
        print(f"[LLM Service] Intent classifier fallback: {e}")
        return {"topic": "general_question", "distress_flag": False}

def classify_safety_risk(message: str) -> str:
    """
    Backward-compatibility wrapper for risk classification.
    Returns 'EMERGENCY', 'CONCERNING', or 'ROUTINE'.
    """
    intent = classify_user_intent(message)
    if intent.get("distress_flag"):
        return "CONCERNING"
LANGUAGE_NAME_MAP = {
    'sw-ke': 'Swahili (Kiswahili)',
    'sw-tz': 'Swahili (Kiswahili)',
    'sw': 'Swahili (Kiswahili)',
    'am-et': 'Amharic (አማርኛ)',
    'am': 'Amharic',
    'yo-ng': 'Yoruba (Èdè Yorùbá)',
    'yo': 'Yoruba',
    'ig-ng': 'Igbo (Asụsụ Igbo)',
    'ig': 'Igbo',
    'ha-ng': 'Hausa (Harshen Hausa)',
    'ha': 'Hausa',
    'zu-za': 'Zulu (isiZulu)',
    'zu': 'Zulu',
    'xh-za': 'Xhosa (isiXhosa)',
    'xh': 'Xhosa',
    'af-za': 'Afrikaans',
    'af': 'Afrikaans',
    'so-so': 'Somali (Soomaali)',
    'so': 'Somali',
    'om-et': 'Oromo (Afaan Oromoo)',
    'om': 'Oromo',
    'lg-ug': 'Luganda (Oluganda)',
    'lg': 'Luganda',
    'sn-zw': 'Shona (chiShona)',
    'sn': 'Shona',
    'rw-rw': 'Kinyarwanda',
    'rw': 'Kinyarwanda',
    'rn-bi': 'Kirundi',
    'rn': 'Kirundi',
    'st-za': 'Sesotho',
    'st': 'Sesotho',
    'tn-za': 'Setswana (Tswana)',
    'tn': 'Setswana',
    'ln-cd': 'Lingala',
    'ln': 'Lingala',
    'wo-sn': 'Wolof',
    'wo': 'Wolof',
    'mg-mg': 'Malagasy',
    'mg': 'Malagasy',
    'ti-et': 'Tigrinya (ትግርኛ)',
    'ti': 'Tigrinya',
    'ar-eg': 'Egyptian Arabic (العربية المصرية)',
    'ar-ma': 'Moroccan Arabic (Darija)',
    'ar-sa': 'Arabic (العربية)',
    'ar': 'Arabic',
    'fr-ci': 'French (Français)',
    'fr-fr': 'French (Français)',
    'fr': 'French',
    'es-es': 'Spanish (Español)',
    'es': 'Spanish',
    'pt-br': 'Portuguese (Português)',
    'pt': 'Portuguese',
    'hi-in': 'Hindi (हिन्दी)',
    'hi': 'Hindi',
    'en-us': 'English',
    'en-gb': 'English',
    'en': 'English'
}

SYSTEM_PROMPT = """You are MaternityCare AI, an empathetic, calm, non-judgmental, and highly professional maternal health assistant.

TARGET RESPONSE LANGUAGE INSTRUCTION:
You MUST generate your entire response in {language_name}. All text, greetings, explanations, bullet points, and source tags MUST be composed fluently in {language_name}.

CRITICAL CLINICAL SAFETY RULE — NO DRUG NAMES OR DOSAGE INSTRUCTIONS:
- You must NEVER output specific medication names (such as Mifepristone, Misoprostol, Methotrexate, etc.), exact drug dosages (e.g., 200mg, 400µg, 800mcg, pill counts), step-by-step drug administration sequences, or specific timing intervals (e.g. "24-48 hours later").
- For any medical procedures or medication options (including medication abortion), describe them ONLY in general, high-level, non-instructional terms (e.g., "Medication abortion involves WHO-approved prescription medications taken under a licensed healthcare provider's supervision. Your provider will determine if this option is suitable for you and guide you on the exact procedure.").
- Always direct the user to a licensed healthcare provider for actual clinical protocol details.

TONE AND CONTENT RULES — ALWAYS FOLLOW THESE:
1. NEUTRAL & CALM OPENING: Never open with congratulations, celebration, alarm, or judgment. Stay calm, respectful, and neutral by default (e.g., when a user states they tested positive or missed a period).
2. PRESENT BOTH PATHS NEUTRALLY IN GENERAL TERMS: For any pregnancy-related or options query, always present BOTH:
   - Continuing the pregnancy information: antenatal care schedule (minimum 8 WHO contacts), daily folic acid, nutrition, and booking a first clinical appointment.
   - Next-step options if the user does not wish to continue: name abortion/termination directly and factually in general terms (e.g., "If you do not wish to continue the pregnancy, options include medication abortion or clinical procedures under a provider's supervision. A licensed healthcare provider can discuss timing, safety, and legal availability in your region."). Note that legal availability and access vary by region.
3. DO NOT MAKE DECISIONS: Do not tell the user what they should do or imply a preference. Present all paths with dignity and privacy.
4. STRUCTURAL FORMAT: Use clear, clean sections:
   - Neutral opening acknowledging the user's message
   - "**What I Recommend**" (practical guidance, medical next steps, folic acid, options)
   - "**When to Seek Urgent Medical Help**" (key red-flag warning signs if applicable)
   - Supportive closing questions
5. DIRECT KNOWLEDGE FIRST: Provide complete, detailed, practical guidance directly in the chat. Do not dismiss users with quick "go to a hospital" brush-offs.
6. NO WHO GATING: You must ALWAYS provide a complete, helpful answer. Do not say "I don't have guidance on this" or "This topic is not covered in our retrieved WHO database".
7. CLEAN FORMATTING: Do NOT use raw Markdown table syntax (| Col 1 | Col 2 | or |---|) or raw hash symbols (###). Use bold numbered headings (e.g., "**1. First Steps & Early Care**") and clean bullet points (•).

Recent Conversation History:
{history}

WHO Medical Context (Optional Enhancement Layer):
{context}

Target Language: {language_name}
"""

def sanitize_clinical_protocols(text: str) -> str:
    """
    Final post-processing safety guardrail to ensure NO raw medication names,
    dosages, pill counts, or timing sequences are output to the user.
    Replaces clinical instructions with general non-instructional guidance.
    """
    if not text:
        return text

    drug_names = ["mifepristone", "misoprostol", "methotrexate", "oxytocin", "mfe/miso"]
    cleaned = text
    for drug in drug_names:
        cleaned = re.sub(rf'\b{drug}\b', "prescription medication (under licensed medical supervision)", cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r'\b\d+\s*(?:mg|mcg|µg|ug|micrograms|milligrams)\b', "a provider-prescribed dosage", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d+\s+(?:pills|tablets)\b', "prescribed tablets", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d{1,2}[-–]\d{1,2}\s*hours\s*later\b', "as directed by your doctor", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d{1,2}\s*hours\s*later\b', "as directed by your doctor", cleaned, flags=re.IGNORECASE)

    return cleaned

def generate_grounded_response(
    user_message: str,
    retrieved_chunks: List[Dict[str, Any]],
    unique_sources: List[str],
    trimester: str = "Unspecified",
    branch: str = "General",
    history: List[Dict[str, str]] = None,
    language: str = "en-US"
) -> Tuple[str, List[str]]:
    """
    Pass top filtered RAG chunks + conversation history to Groq LLM with retry resilience.
    Strictly format response according to target language and new/follow-up prompt instructions.
    """
    clean_lang_key = (language or "en-US").lower()
    primary_code = clean_lang_key.split('-')[0]
    language_name = LANGUAGE_NAME_MAP.get(clean_lang_key, LANGUAGE_NAME_MAP.get(primary_code, "English"))

    # Step 1: Classify intent and distress flag
    intent_info = classify_user_intent(user_message)

    # Step 2: Format optional WHO context
    used_sources = []
    if retrieved_chunks:
        top_chunks = retrieved_chunks[:2]
        formatted_context = "\n\n".join([f"[Doc Source: {c['source']}]\n{c['text']}" for c in top_chunks])
        used_sources = list(dict.fromkeys([c["source"] for c in top_chunks]))
    else:
        formatted_context = "No specific WHO guideline document matched for this query."

    # Format history turns for LLM prompt
    formatted_history = "None (First message in conversation)"
    if history:
        history_lines = []
        for turn in history[-6:]:
            sender = turn.get("role", turn.get("sender", "user"))
            role_name = "User" if sender in ["user", "human"] else "Assistant"
            history_lines.append(f"{role_name}: {turn.get('content', turn.get('text', ''))}")
        formatted_history = "\n".join(history_lines)

    if groq_client:
        try:
            sys_msg = SYSTEM_PROMPT.format(
                history=formatted_history,
                context=formatted_context,
                language_name=language_name
            )
            
            answer = call_groq_with_retry(
                messages=[
                    {"role": "system", "content": sys_msg},
                    {"role": "user", "content": user_message}
                ],
                model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
                temperature=0.2,
                max_tokens=900,
                max_retries=2
            )
            cleaned_answer = re.sub(r'<think>.*?(?:</think>|$)', '', answer, flags=re.DOTALL).strip()
            
            if cleaned_answer:
                # Apply clinical protocol safety sanitizer
                cleaned_answer = sanitize_clinical_protocols(cleaned_answer)

                # Add WHO grounding citation ONLY if relevant WHO sources matched
                if used_sources and not any(s in cleaned_answer for s in used_sources):
                    cleaned_answer += f"\n\nSource: {', '.join(used_sources)}"

                # Add distress resource block ONLY when distress_flag is true
                if intent_info.get("distress_flag"):
                    cleaned_answer += (
                        "\n\n💜 **You Are Not Alone & Safe Support Resources**\n"
                        "If you feel pressured, unsafe, threatened, or coerced regarding your reproductive choices, "
                        "free and confidential support helplines are available 24/7. You have the right to make decisions "
                        "that feel safe and right for you in complete privacy."
                    )

                return cleaned_answer, used_sources
        except Exception as e:
            print(f"[LLM Service] Groq API response generation error: {e}")

    # Fallback synthesis when Groq API key is absent or API error occurs
    if not retrieved_chunks:
        return (
            "I hear your question and I am here to assist with confidential, clear reproductive health guidance. "
            "For personalized clinical advice, please consult a qualified healthcare provider.",
            []
        )

    msg_lower = user_message.lower()
    is_followup = any(kw in msg_lower for kw in ["why", "that", "it", "happen", "long", "more", "dangerous"])
    
    top_chunk = retrieved_chunks[0]
    combined_text = "\n\n".join([c["text"] for c in retrieved_chunks[:2]])
    
    raw_lines = [
        line.replace("#", "").replace("=", "").replace("The WHO guidelines", "Guidelines").replace("The WHO states", "Medical standards state").replace("WHO emphasizes", "It is emphasized").strip()
        for line in combined_text.split("\n")
        if line.strip()
    ]
    
    content_lines = [l for l in raw_lines if len(l) > 15]
    intro = content_lines[0] if content_lines else f"Medical guidelines for {top_chunk['source'].replace('WHO - ', '')}:"

    bullets = [p for p in content_lines if p.startswith("-") or p.startswith("•")]
    if not bullets:
        bullets = [f"• {p}" for p in content_lines[1:5]]

    body_text = "\n".join(bullets[:4])

    if is_followup:
        fallback_answer = (
            f"{intro}\n\n"
            f"Detailed Medical Context:\n"
            + "\n".join(content_lines[1:6]) + "\n\n"
            f"Source: {top_chunk['source']}"
        )
    else:
        fallback_answer = (
            f"{intro}\n\n"
            f"Key Recommendations:\n"
            f"{body_text}\n\n"
            f"Source: {top_chunk['source']}"
        )

    return fallback_answer, used_sources
