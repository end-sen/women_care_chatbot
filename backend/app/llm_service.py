import os
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

SYSTEM_PROMPT = """You are MaternityCare AI, an empathetic, highly professional maternal health assistant.

CRITICAL MEDICAL GROUNDING INSTRUCTIONS:
1. You MUST answer user questions using ONLY the provided WHO Medical Context below.
2. If the provided context does NOT contain relevant information to answer the user's question, state clearly:
   "This topic is not covered in our retrieved WHO medical database. For specific medical concerns outside our current guidelines, please consult a qualified healthcare provider."
3. Do NOT generate or infer any medical advice, diagnosis, or drug dosages outside the provided context.

You will be given the recent conversation history before the current user message. Use it to understand follow-up questions and references to earlier topics (e.g. "that", "it", "why", "is this normal").

Answer format rules — always follow these:
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
"""

def generate_grounded_response(
    user_message: str,
    retrieved_chunks: List[Dict[str, Any]],
    unique_sources: List[str],
    trimester: str = "Unspecified",
    branch: str = "General",
    history: List[Dict[str, str]] = None
) -> Tuple[str, List[str]]:
    """
    Pass top filtered RAG chunks + conversation history to Groq LLM.
    Strictly format response according to new/follow-up prompt instructions.
    """
    if not retrieved_chunks:
        return (
            "This topic is not covered in our retrieved WHO medical database. "
            "For specific medical concerns outside our current guidelines, please consult a qualified healthcare provider.",
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
                branch=branch
            )
            
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": sys_msg},
                    {"role": "user", "content": user_message}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                max_tokens=500
            )

            answer = chat_completion.choices[0].message.content.strip()
            return answer, used_sources
        except Exception as e:
            print(f"[LLM Service] Groq API call failed: {e}. Falling back to local RAG synthesis.")

    # Fallback RAG synthesis when Groq API key is absent
    msg_lower = user_message.lower()
    is_followup = any(kw in msg_lower for kw in ["why", "that", "it", "happen", "long", "more", "dangerous"])
    
    top_chunk = top_chunks[0]
    combined_text = "\n\n".join([c["text"] for c in top_chunks])
    
    raw_lines = [
        line.replace("#", "").replace("=", "").strip()
        for line in combined_text.split("\n")
        if line.strip()
    ]
    
    content_lines = [l for l in raw_lines if len(l) > 15]
    intro = content_lines[0] if content_lines else f"According to WHO guidelines for {top_chunk['source']}:"

    bullets = [p for p in content_lines if p.startswith("-") or p.startswith("•")]
    if not bullets:
        bullets = [f"• {p}" for p in content_lines[1:5]]

    body_text = "\n".join(bullets[:4])

    if is_followup:
        fallback_answer = (
            f"{intro}\n\n"
            f"Detailed WHO Medical Context:\n"
            + "\n".join(content_lines[1:6]) + "\n\n"
            f"Source: {top_chunk['source']}"
        )
    else:
        fallback_answer = (
            f"{intro}\n\n"
            f"Key WHO Recommendations:\n"
            f"{body_text}\n\n"
            f"Source: {top_chunk['source']}"
        )

    return fallback_answer, used_sources
