import os
import sys

# Add backend app directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.rag_engine import rag_engine

def run_ingestion():
    print("=== MaternityCare RAG Ingestion Pipeline ===")
    rag_engine.initialize()
    print("Ingestion complete. ChromaDB index updated!")

if __name__ == "__main__":
    run_ingestion()
