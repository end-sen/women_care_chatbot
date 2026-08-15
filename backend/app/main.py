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

class ChatResponse(BaseModel):
    response: str
    sources: List[str]
    triggered_guardrail: Optional[str] = None
    action: Optional[Dict[str, Any]] = None
    support_card: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "MaternityCare AI", "rag_initialized": rag_engine.initialized}

@app.get("/api/facilities")
def list_facilities(
    type: Optional[str] = Query(None, description="Filter by facility type: antenatal, family_planning, general"),
    search: Optional[str] = Query(None, description="Search query")
):
    facilities = get_mock_facilities(facility_type=type, search=search)
    return {"facilities": facilities, "total": len(facilities)}

@app.post("/api/chat", response_model=ChatResponse)
def handle_chat(req: ChatRequest):
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # 1. Global Pre-Processing Safety Layer
    guardrail_result = check_safety_guardrails(user_msg)
    if guardrail_result:
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
        branch=req.branch or "initial",
        history=req.history
    )

    # 3. LLM Response Generation (Groq / Grounded fallback)
    answer, final_sources = generate_grounded_response(
        user_message=user_msg,
        retrieved_chunks=retrieved_chunks,
        unique_sources=sources,
        trimester=req.trimester or "Unspecified",
        branch=req.branch or "General",
        history=req.history
    )

    return ChatResponse(
        response=answer,
        sources=final_sources,
        triggered_guardrail=None,
        action=None,
        support_card=None
    )

@app.post("/api/rag/ingest")
def reingest_who_docs():
    rag_engine.initialized = False
    rag_engine.initialize(force_reindex=True)
    return {"status": "success", "message": "WHO document collection successfully re-indexed in RAG engine"}
