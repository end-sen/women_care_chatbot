import os
import glob
from typing import List, Dict, Any, Tuple
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    HAS_ST = True
except ImportError:
    HAS_ST = False

try:
    import chromadb
    HAS_CHROMA = True
except ImportError:
    HAS_CHROMA = False

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample_who_docs"))
CHROMA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "rag", "chroma_db"))

class LocalRAGEngine:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.doc_embeddings: List[np.ndarray] = []
        self.model = None
        self.chroma_client = None
        self.collection = None
        self.initialized = False

    def initialize(self, force_reindex: bool = False):
        """Load documents and set up embeddings & vector index."""
        if self.initialized and not force_reindex:
            return

        print(f"[RAG Engine] Loading WHO documents from {DATA_DIR}...")
        self._load_documents()

        if HAS_ST and HAS_CHROMA:
            try:
                print("[RAG Engine] Initializing SentenceTransformer ('all-MiniLM-L6-v2')...")
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                
                os.makedirs(CHROMA_PATH, exist_ok=True)
                self.chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
                
                if force_reindex:
                    try:
                        self.chroma_client.delete_collection("who_maternal_health")
                    except Exception:
                        pass

                self.collection = self.chroma_client.get_or_create_collection(
                    name="who_maternal_health",
                    metadata={"hnsw:space": "cosine"}
                )
                
                if self.collection.count() == 0 or force_reindex:
                    print("[RAG Engine] Ingesting document chunks into ChromaDB...")
                    ids = [doc["id"] for doc in self.documents]
                    texts = [doc["text"] for doc in self.documents]
                    metadatas = [
                        {
                            "source": doc["source"],
                            "title": doc["title"],
                            "topic_tag": doc["topic_tag"]
                        }
                        for doc in self.documents
                    ]
                    embeddings = self.model.encode(texts, normalize_embeddings=True).tolist()
                    
                    if force_reindex:
                        try:
                            self.collection.upsert(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
                        except Exception:
                            self.collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
                    else:
                        self.collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
                    print(f"[RAG Engine] Successfully indexed {len(texts)} chunks in ChromaDB!")

                # Store embeddings in memory for fast exact cosine similarity checks
                texts = [doc["text"] for doc in self.documents]
                encoded = self.model.encode(texts, normalize_embeddings=True)
                self.doc_embeddings = [np.array(e, dtype=np.float32) for e in encoded]

            except Exception as e:
                print(f"[RAG Engine] ChromaDB/SentenceTransformer init warning: {e}.")
                self.model = None

        self.initialized = True

    def _load_documents(self):
        """Chunk WHO text files into semantic passages and assign topic_tag metadata."""
        files = glob.glob(os.path.join(DATA_DIR, "*.txt"))
        self.documents = []

        file_meta_map = {
            "antenatal_care.txt": {
                "source": "WHO - Antenatal Care Guidelines",
                "topic_tag": "antenatal_care"
            },
            "nutrition_pregnancy.txt": {
                "source": "WHO - Daily Nutrition & Supplementation",
                "topic_tag": "nutrition"
            },
            "pregnancy_danger_signs.txt": {
                "source": "WHO - Pregnancy Danger Signs & Emergency Triage",
                "topic_tag": "danger_signs"
            },
            "family_planning_contraception.txt": {
                "source": "WHO - Family Planning & Contraceptive Methods",
                "topic_tag": "contraception"
            },
            "options_and_pregnancy_guidance.txt": {
                "source": "WHO - Reproductive Options & Clinical Guidance",
                "topic_tag": "options"
            }
        }

        for file_path in files:
            filename = os.path.basename(file_path)
            meta = file_meta_map.get(filename, {
                "source": f"WHO - {filename.replace('.txt', '').replace('_', ' ').title()}",
                "topic_tag": filename.replace('.txt', '')
            })
            
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            sections = content.split("\n\n")
            for idx, sec in enumerate(sections):
                cleaned = sec.strip()
                if len(cleaned) > 30:
                    title_line = cleaned.split("\n")[0].replace("#", "").replace("=", "").strip()
                    self.documents.append({
                        "id": f"{filename}_{idx}",
                        "source": meta["source"],
                        "topic_tag": meta["topic_tag"],
                        "title": title_line,
                        "text": cleaned
                    })

    def query(
        self,
        user_query: str,
        top_k: int = 2,
        min_similarity: float = 0.60,
        branch: str = "initial",
        history: List[Dict[str, str]] = None
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Retrieves top_k chunks matching query with threshold >= 0.60.
        Uses soft topic_tag boosting (1.35x boost for preferred tags) and conversation history for follow-up query expansion.
        Logs all chunk scores to console for debugging.
        """
        if not self.initialized:
            self.initialize()

        query_lower = user_query.lower()

        # 1. Handle Follow-up Context Expansion using History
        search_query = user_query
        followup_keywords = ["that", "it", "why", "this", "more", "tell me", "dangerous", "happen", "long", "lasts"]
        is_followup = any(kw in query_lower.split() for kw in followup_keywords)

        if history and is_followup:
            recent_user_turns = [h["content"] for h in history if h.get("role") == "user" or h.get("sender") == "user"]
            if recent_user_turns:
                last_topic = recent_user_turns[-1]
                search_query = f"{last_topic} - {user_query}"
                print(f"[RAG Engine Debug] Recognized Follow-Up Query Expansion: '{search_query}'")

        # 2. Preferred Topic Tags for Soft Boost
        preferred_tags = []
        if any(kw in query_lower for kw in ["nauseous", "nausea", "morning sickness", "vomiting", "food", "diet", "vitamin", "folic acid", "iron", "calcium", "eat", "drink", "nutrition", "trimester"]):
            preferred_tags.append("nutrition")
        if any(kw in query_lower for kw in ["bleeding", "severe pain", "fever", "headache", "vision", "danger", "emergency", "leaking"]):
            preferred_tags.append("danger_signs")
        if any(kw in query_lower for kw in ["contraceptive", "contraception", "family planning", "condom", "iud", "pill", "implants", "birth control", "prevention"]):
            preferred_tags.append("contraception")
        if any(kw in query_lower for kw in ["termination", "abortion", "adoption", "options", "pregnancy options"]):
            preferred_tags.append("options")
        if any(kw in query_lower for kw in ["backpain", "back pain", "fatigue", "swelling", "symptoms", "appointment", "anc", "schedule", "visit"]):
            preferred_tags.append("antenatal_care")

        if branch == "pregnancy_care" and not preferred_tags:
            preferred_tags = ["antenatal_care", "nutrition"]
        elif branch == "whats_right_for_me" and not preferred_tags:
            preferred_tags = ["options", "contraception"]

        print(f"\n[RAG Engine Debug] User Query: '{user_query}' | Search String: '{search_query}' | Branch: '{branch}'")
        print(f"[RAG Engine Debug] Preferred Soft Boost Tags: {preferred_tags}")

        retrieved_chunks = []
        unique_sources = set()

        if self.model and self.doc_embeddings:
            expanded_query = f"WHO maternal health medical guidelines regarding {search_query}: {search_query}"
            q_emb = self.model.encode([expanded_query], normalize_embeddings=True)[0]
            q_emb = np.array(q_emb, dtype=np.float32)

            candidates = []
            for idx, doc in enumerate(self.documents):
                d_emb = self.doc_embeddings[idx]
                raw_sim = float(np.dot(q_emb, d_emb))
                
                calibrated_sim = min(1.0, raw_sim / 0.50)

                # Soft Boost: Apply 1.35x multiplier to preferred tags, 0.70x to non-preferred
                if preferred_tags:
                    if doc["topic_tag"] in preferred_tags:
                        soft_boosted_sim = min(1.0, calibrated_sim * 1.35)
                    else:
                        soft_boosted_sim = calibrated_sim * 0.70
                else:
                    soft_boosted_sim = calibrated_sim

                is_retained = (soft_boosted_sim >= min_similarity) or (calibrated_sim >= min_similarity) or (raw_sim >= 0.28)
                
                print(
                    f"[RAG Engine Debug] Chunk: {doc['id']} | Tag: {doc['topic_tag']} | "
                    f"Raw: {raw_sim:.4f} | Calibrated: {calibrated_sim:.4f} | Boosted: {soft_boosted_sim:.4f} | "
                    f"Status: {'RETAINED' if is_retained else 'DISCARDED (<0.60)'}"
                )

                if is_retained:
                    candidates.append((soft_boosted_sim, doc))

            # Fallback if no chunks passed threshold
            if not candidates:
                print("[RAG Engine Debug] Warning: No chunks passed threshold with soft boost. Falling back to unfiltered semantic search across full KB.")
                for idx, doc in enumerate(self.documents):
                    d_emb = self.doc_embeddings[idx]
                    raw_sim = float(np.dot(q_emb, d_emb))
                    calibrated_sim = min(1.0, raw_sim / 0.50)
                    candidates.append((calibrated_sim, doc))

            candidates.sort(key=lambda x: x[0], reverse=True)
            top_candidates = candidates[:top_k]

            for score, doc in top_candidates:
                retrieved_chunks.append({
                    "text": doc["text"],
                    "source": doc["source"],
                    "topic_tag": doc["topic_tag"],
                    "similarity": score
                })
                unique_sources.add(doc["source"])

            print(f"[RAG Engine Debug] Total Retained Chunks Passed to LLM: {len(retrieved_chunks)}")

        return retrieved_chunks, list(unique_sources)

rag_engine = LocalRAGEngine()
