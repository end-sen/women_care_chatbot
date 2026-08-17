import os
import time
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

try:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY) if (GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here") else None
except Exception as e:
    print(f"[LLM Service] Groq client init warning: {e}")
    groq_client = None

FALLBACK_MODELS = [
    os.getenv("GROQ_MODEL", "groq/compound-mini"),
    "groq/compound-mini",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "groq/compound",
    "allam-2-7b"
]

def call_groq_with_retry(messages: list, model: str = None, temperature: float = 0.2, max_tokens: int = 500, max_retries: int = 1) -> str:
    """
    Call Groq API with exponential backoff retries and automatic model fallback.
    """
    if not groq_client:
        raise RuntimeError("Groq client is not initialized or API key is missing")

    models_to_try = []
    if model:
        models_to_try.append(model)
    for m in FALLBACK_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    last_err = None
    for target_model in models_to_try:
        for attempt in range(max_retries + 1):
            try:
                completion = groq_client.chat.completions.create(
                    messages=messages,
                    model=target_model,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return completion.choices[0].message.content.strip()
            except Exception as e:
                last_err = e
                err_msg = str(e).lower()
                print(f"[LLM Service] Groq model '{target_model}' attempt {attempt + 1} failed: {e}")
                if "model_not_found" in err_msg or "404" in err_msg or "does not exist" in err_msg:
                    break  # Immediately try next model in fallback list
                if attempt < max_retries:
                    time.sleep(1)

    raise last_err

TRIAGE_CLASSIFIER_PROMPT = (
    "You are a triage classifier for a maternal health chatbot. Classify the user's message based "
    "on maternal health risk. Respond with ONLY one word: EMERGENCY, CONCERNING, or ROUTINE. "
    "EMERGENCY = signs of a medical emergency (bleeding, severe pain, reduced fetal movement, severe headache/vision changes, high fever, water breaking early). "
    "CONCERNING = signs of emotional distress, coercion, or pressure from others regarding the pregnancy. "
    "ROUTINE = general questions or standard feature menu selections."
)

import re

NAVIGATION_PROMPTS = [
    "what's right for me",
    "whats right for me",
    "i want to explore what's right for me.",
    "i want to explore pregnancy care.",
    "pregnancy care",
    "first trimester",
    "second trimester",
    "third trimester"
]

def classify_safety_risk(message: str) -> str:
    """
    Lightweight Groq LLM safety triage classifier with retry resilience.
    Returns 'EMERGENCY', 'CONCERNING', or 'ROUTINE'.
    """
    msg_lower = message.lower().strip()
    if any(nav in msg_lower for nav in NAVIGATION_PROMPTS):
        return "ROUTINE"

    if not groq_client:
        return "ROUTINE"

    try:
        raw_res = call_groq_with_retry(
            messages=[
                {"role": "system", "content": TRIAGE_CLASSIFIER_PROMPT},
                {"role": "user", "content": message}
            ],
            model="groq/compound-mini",
            temperature=0.0,
            max_tokens=150,
            max_retries=2
        )

        # Strip reasoning tags <think>...</think> if model output includes thought process
        cleaned = re.sub(r'<think>.*?</think>', '', raw_res, flags=re.DOTALL).strip().upper()
        lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
        target_token = lines[-1] if lines else cleaned

        if target_token == "EMERGENCY" or target_token.startswith("EMERGENCY"):
            return "EMERGENCY"
        elif target_token == "CONCERNING" or target_token.startswith("CONCERNING"):
            return "CONCERNING"
        elif target_token == "ROUTINE" or target_token.startswith("ROUTINE"):
            return "ROUTINE"

        if re.search(r'\bEMERGENCY\b', target_token):
            return "EMERGENCY"
        elif re.search(r'\bCONCERNING\b', target_token):
            return "CONCERNING"
        else:
            return "ROUTINE"
    except Exception as e:
        print(f"[LLM Service] Safety risk classifier retries exhausted: {e}")
        return "ROUTINE"

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

SYSTEM_PROMPT = """You are MaternityCare AI, an empathetic, highly professional maternal health assistant.

CRITICAL MEDICAL GROUNDING INSTRUCTIONS:
1. You MUST answer user questions using ONLY the provided WHO Medical Context below.
2. If the provided context does NOT contain relevant information to answer the user's question, state clearly in the target language:
   "This topic is not covered in our retrieved WHO medical database. For specific medical concerns outside our current guidelines, please consult a qualified healthcare provider."
3. Do NOT generate or infer any medical advice, diagnosis, or drug dosages outside the provided context.

TARGET RESPONSE LANGUAGE INSTRUCTION:
You MUST generate your entire response in {language_name}. All text, greetings, explanations, bullet points, and source tags MUST be composed fluently in {language_name}.

Answer format rules — always follow these:
- Writing Style: Write in direct, supportive, and natural language. Do NOT repeatedly say "The WHO states", "WHO guidelines emphasize", "The WHO emphasizes", or "According to WHO" inside the response body. State the facts directly. Mention WHO ONLY ONCE at the very end in the mandatory "Source: WHO - [topic]" line.
- If the current message is a NEW question on a different topic, follow the short-answer format rules: maximum 3-4 sentences total, structure with 1 short intro sentence and 2-4 relevant remedies/bullet points.
- If the current message is a FOLLOW-UP asking for more depth on something already discussed in this conversation, you may give a longer, more detailed answer — still grounded only in retrieved context, still no unrelated topics mixed in.
- Only answer what was specifically asked — do not include unrelated topics, headers, or numbered medical sections even if they exist in retrieved context.
- End with a single line: "Source: WHO - [topic]" citing only the source(s) actually used in this answer, not all sources in the knowledge base.
- Exception: if the query matches a danger-sign trigger phrase, ignore all the above and return the fixed urgent-care template instead.

Recent Conversation History:
{history}

WHO Medical Context:
{context}

User Trimester: {trimester}
Current Workflow Branch: {branch}
Target Language: {language_name}
"""

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

    if not retrieved_chunks:
        return (
            f"This topic is not covered in our retrieved WHO medical database. "
            f"For specific medical concerns outside our current guidelines, please consult a qualified healthcare provider.",
            []
        )

    top_chunks = retrieved_chunks[:2]
    formatted_context = "\n\n".join(
        [f"[Doc Source: {c['source']}]\n{c['text']}" for c in top_chunks]
    )

    used_sources = list(dict.fromkeys([c["source"] for c in top_chunks]))

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
                trimester=trimester,
                branch=branch,
                language_name=language_name
            )
            
            answer = call_groq_with_retry(
                messages=[
                    {"role": "system", "content": sys_msg},
                    {"role": "user", "content": user_message}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                max_tokens=500,
                max_retries=2
            )
            return answer, used_sources
        except Exception as e:
            print(f"[LLM Service] Groq API response generation failed: {e}. Falling back to local WHO document synthesis.")

    # Fallback RAG synthesis when Groq API key is absent
    msg_lower = user_message.lower()
    is_followup = any(kw in msg_lower for kw in ["why", "that", "it", "happen", "long", "more", "dangerous"])
    
    top_chunk = top_chunks[0]
    combined_text = "\n\n".join([c["text"] for c in top_chunks])
    
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
