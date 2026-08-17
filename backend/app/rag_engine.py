import os
import glob
from typing import List, Dict, Any, Tuple
import numpy as np

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_ST = True
except Exception:
    HAS_ST = False

try:
    import chromadb
    HAS_CHROMA = True
except Exception:
    HAS_CHROMA = False

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample_who_docs"))
CHROMA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "rag", "chroma_db"))

# Detect low memory environments (like Render Free Tier with 512MB RAM limit)
IS_LOW_MEMORY = os.getenv("RENDER") is not None or os.getenv("LOW_MEMORY") == "1"

class LocalRAGEngine:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.doc_embeddings = None
        self.model = None
        self.tfidf_vectorizer = None
        self.chroma_client = None
        self.collection = None
        self.initialized = False

    def initialize(self, force_reindex: bool = False):
        """Load WHO medical documents and set up embeddings & vector index."""
        if self.initialized and not force_reindex:
            return

        print(f"[RAG Engine] Loading WHO documents from {DATA_DIR}...")
        self._load_documents()

        # In low-memory environments (Render 512MB RAM), use ultra-fast TF-IDF (<20MB RAM)
        if IS_LOW_MEMORY or not (HAS_ST and HAS_CHROMA):
            self._initialize_tfidf()
        else:
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

                texts = [doc["text"] for doc in self.documents]
                encoded = self.model.encode(texts, normalize_embeddings=True)
                self.doc_embeddings = [np.array(e, dtype=np.float32) for e in encoded]
            except Exception as e:
                print(f"[RAG Engine] SentenceTransformer OOM/Init warning: {e}. Switching to lightweight TF-IDF...")
                self._initialize_tfidf()

        self.initialized = True

    def _initialize_tfidf(self):
        """Ultra-fast TF-IDF vector engine requiring <20MB RAM for Render Free Tier."""
        print("[RAG Engine] Initializing lightweight TF-IDF vector engine (<20MB RAM)...")
        if HAS_SKLEARN:
            texts = [doc["text"] for doc in self.documents]
            self.tfidf_vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            self.doc_embeddings = self.tfidf_vectorizer.fit_transform(texts)
            print(f"[RAG Engine] Successfully indexed {len(texts)} WHO document passages with TF-IDF engine!")
        else:
            print("[RAG Engine] Warning: scikit-learn not available. Falling back to keyword matching.")

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
        Retrieves top_k chunks matching query with similarity thresholding and soft topic_tag boosting.
        """
        if not self.initialized:
            self.initialize()

        query_lower = user_query.lower()

        # Handle Follow-up Context Expansion using History
        search_query = user_query
        followup_keywords = ["that", "it", "why", "this", "more", "tell me", "dangerous", "happen", "long", "lasts"]
        is_followup = any(kw in query_lower.split() for kw in followup_keywords)

        if history and is_followup:
            recent_user_turns = [h["content"] for h in history if h.get("role") == "user" or h.get("sender") == "user"]
            if recent_user_turns:
                last_topic = recent_user_turns[-1]
                search_query = f"{last_topic} - {user_query}"

        # Preferred Topic Tags for Soft Boost
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

        retrieved_chunks = []
        unique_sources = set()

        # Case A: TF-IDF Vector Engine (Low RAM / Render Free Tier)
        if self.tfidf_vectorizer is not None and self.doc_embeddings is not None:
            q_vec = self.tfidf_vectorizer.transform([search_query])
            sim_scores = cosine_similarity(q_vec, self.doc_embeddings)[0]

            candidates = []
            for idx, doc in enumerate(self.documents):
                raw_sim = float(sim_scores[idx])
                calibrated_sim = min(1.0, raw_sim / 0.35)

                if preferred_tags and doc["topic_tag"] in preferred_tags:
                    soft_boosted_sim = min(1.0, calibrated_sim * 1.35)
                else:
                    soft_boosted_sim = calibrated_sim

                candidates.append((soft_boosted_sim, doc))

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

        # Case B: SentenceTransformer Engine (High RAM / Local / HF Spaces)
        elif self.model and self.doc_embeddings:
            expanded_query = f"WHO maternal health medical guidelines regarding {search_query}: {search_query}"
            q_emb = self.model.encode([expanded_query], normalize_embeddings=True)[0]
            q_emb = np.array(q_emb, dtype=np.float32)

            candidates = []
            for idx, doc in enumerate(self.documents):
                d_emb = self.doc_embeddings[idx]
                raw_sim = float(np.dot(q_emb, d_emb))
                calibrated_sim = min(1.0, raw_sim / 0.50)

                if preferred_tags and doc["topic_tag"] in preferred_tags:
                    soft_boosted_sim = min(1.0, calibrated_sim * 1.35)
                else:
                    soft_boosted_sim = calibrated_sim * 0.70

                candidates.append((soft_boosted_sim, doc))

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

        # Case C: Fallback Keyword Search if no vector match
        if not retrieved_chunks and self.documents:
            words = set(query_lower.split())
            scores = []
            for doc in self.documents:
                doc_text = doc["text"].lower()
                matches = sum(1 for w in words if w in doc_text and len(w) > 3)
                scores.append((matches, doc))
            scores.sort(key=lambda x: x[0], reverse=True)
            for s, doc in scores[:top_k]:
                retrieved_chunks.append({
                    "text": doc["text"],
                    "source": doc["source"],
                    "topic_tag": doc["topic_tag"],
                    "similarity": 0.70
                })
                unique_sources.add(doc["source"])

        return retrieved_chunks, list(unique_sources)

rag_engine = LocalRAGEngine()
