import os
import json
import time
import datetime
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from app.guardrails import check_safety_guardrails
from app.rag_engine import rag_engine
from app.llm_service import generate_grounded_response
from app.facilities import get_mock_facilities

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[MaternityCare Backend] Starting up and initializing RAG vector database...")
    rag_engine.initialize()
    yield
    print("[MaternityCare Backend] Shutting down...")

app = FastAPI(
    title="MaternityCare AI Backend",
    description="African-Utopia Maternal Health Chatbot API with RAG & Safety Guardrails",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    branch: Optional[str] = "initial"
    trimester: Optional[str] = "unspecified"
    gestational_stage: Optional[str] = None
    health_status: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None
    session_id: Optional[str] = "default_session"
    language: Optional[str] = "en-US"

class ChatResponse(BaseModel):
    response: str
    sources: List[str]
    triggered_guardrail: Optional[str] = None
    action: Optional[Dict[str, Any]] = None
    support_card: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "MaternityCare AI", "rag_initialized": rag_engine.initialized}

@app.get("/api/metadata")
def get_metadata():
    return {
        "app_name": "MaternityCare AI",
        "last_updated": "August 2026",
        "version": "1.0.0-utopia",
        "sources": [
            {
                "title": "WHO Antenatal Care Guidelines",
                "filename": "antenatal_care.txt",
                "tag": "antenatal_care",
                "url": "https://www.who.int/publications/i/item/9789241549912"
            },
            {
                "title": "WHO Daily Nutrition & Supplementation in Pregnancy",
                "filename": "nutrition_pregnancy.txt",
                "tag": "nutrition",
                "url": "https://www.who.int/publications/i/item/9789241549912"
            },
            {
                "title": "WHO Pregnancy Danger Signs & Emergency Triage",
                "filename": "pregnancy_danger_signs.txt",
                "tag": "danger_signs",
                "url": "https://www.who.int/news-room/fact-sheets/detail/maternal-mortality"
            },
            {
                "title": "WHO Family Planning & Contraceptive Methods",
                "filename": "family_planning_contraception.txt",
                "tag": "contraception",
                "url": "https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception"
            },
            {
                "title": "WHO Reproductive Options & Clinical Guidance",
                "filename": "options_and_pregnancy_guidance.txt",
                "tag": "options",
                "url": "https://www.who.int/publications/i/item/9789240039483"
            }
        ]
    }

@app.get("/api/facilities")
def list_facilities(
    type: Optional[str] = Query(None, description="Filter by facility type: antenatal, family_planning, general"),
    search: Optional[str] = Query(None, description="Search query")
):
    facilities = get_mock_facilities(facility_type=type, search=search)
    return {"facilities": facilities, "total": len(facilities)}

LOGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logs"))
REQUESTS_AUDIT_FILE = os.path.join(LOGS_DIR, "requests_audit.jsonl")

# Per-session rate limiting storage (Phase 4c)
SESSION_MESSAGE_TIMESTAMPS: Dict[str, List[float]] = {}
MAX_MESSAGES_PER_MINUTE = 20

def check_rate_limit(session_id: str):
    """
    Enforce max 20 messages per minute per session ID.
    Raises HTTP 429 Too Many Requests if limit is exceeded.
    """
    now = time.time()
    one_min_ago = now - 60.0
    
    timestamps = SESSION_MESSAGE_TIMESTAMPS.get(session_id, [])
    valid_timestamps = [t for t in timestamps if t > one_min_ago]
    
    if len(valid_timestamps) >= MAX_MESSAGES_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a minute before sending more messages."
        )
    
    valid_timestamps.append(now)
    SESSION_MESSAGE_TIMESTAMPS[session_id] = valid_timestamps

def log_request_audit(session_id: str, branch: str, retrieved_chunks: List[Dict[str, Any]], classifier_label: str, response_length: int, latency_ms: float, error: Optional[str] = None):
    """
    Structured request audit logger (JSON Lines format) for systematically reviewing
    retrieval performance, classifier decisions, response lengths, and latencies.
    """
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
        chunk_info = [
            {"id": c.get("id", c.get("source", "chunk")), "similarity": round(c.get("similarity", 0.0), 4)}
            for c in (retrieved_chunks or [])
        ]
        log_entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "session_id": session_id,
            "branch": branch,
            "retrieved_chunks": chunk_info,
            "classifier_label": classifier_label,
            "response_length": response_length,
            "latency_ms": round(latency_ms, 2),
            "error": error
        }
        with open(REQUESTS_AUDIT_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"[Audit Log Error] {e}")

@app.post("/api/chat", response_model=ChatResponse)
def handle_chat(req: ChatRequest):
    start_time = time.time()
    session_id = req.session_id or "default_session"
    branch = req.branch or "initial"

    # Enforce Phase 4c per-session rate limit
    check_rate_limit(session_id)

    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # 1. Global Pre-Processing Safety Layer
        guardrail_result = check_safety_guardrails(user_msg, session_id=session_id)
        if guardrail_result:
            latency_ms = (time.time() - start_time) * 1000
            label = "EMERGENCY" if guardrail_result["type"] == "danger_sign" else "CONCERNING"
            log_request_audit(
                session_id=session_id,
                branch=branch,
                retrieved_chunks=[],
                classifier_label=label,
                response_length=len(guardrail_result["response"]),
                latency_ms=latency_ms,
                error=None
            )
            return ChatResponse(
                response=guardrail_result["response"],
                sources=guardrail_result.get("sources", []),
                triggered_guardrail=guardrail_result["type"],
                action=guardrail_result.get("action"),
                support_card=guardrail_result.get("support_card")
            )

        # 2. RAG Retrieval from ChromaDB / SentenceTransformer vector store
        retrieved_chunks, sources = rag_engine.query(
            user_query=user_msg,
            top_k=2,
            min_similarity=0.60,
            branch=branch,
            history=req.history
        )

        # 3. LLM Response Generation (Groq / Grounded fallback)
        answer, final_sources = generate_grounded_response(
            user_message=user_msg,
            retrieved_chunks=retrieved_chunks,
            unique_sources=sources,
            trimester=req.trimester or "Unspecified",
            branch=req.branch or "General",
            history=req.history,
            language=req.language or "en-US"
        )

        latency_ms = (time.time() - start_time) * 1000
        log_request_audit(
            session_id=session_id,
            branch=branch,
            retrieved_chunks=retrieved_chunks,
            classifier_label="ROUTINE",
            response_length=len(answer),
            latency_ms=latency_ms,
            error=None
        )

        return ChatResponse(
            response=answer,
            sources=final_sources,
            triggered_guardrail=None,
            action=None,
            support_card=None
        )
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        log_request_audit(
            session_id=session_id,
            branch=branch,
            retrieved_chunks=[],
            classifier_label="ERROR",
            response_length=0,
            latency_ms=latency_ms,
            error=str(e)
        )
        print(f"[Backend Error] Exception handling chat: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/ingest")
def reingest_who_docs():
    rag_engine.initialized = False
    rag_engine.initialize(force_reindex=True)
    return {"status": "success", "message": "WHO document collection successfully re-indexed in RAG engine"}
