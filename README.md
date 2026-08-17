# 🌺 MaternityCare AI — African-Utopia Maternal Wellness Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.1+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r162-black.svg?logo=three.js&logoColor=white)](https://threejs.org)
[![Groq](https://img.shields.io/badge/Groq-Llama--3.3--70B-orange.svg)](https://groq.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_RAG-purple.svg)](https://www.trychroma.com)

> [!IMPORTANT]
> **Clinical Review & Medical Disclaimer Notice**: This project is a demonstration maternal health software application set in a futuristic African-utopia aesthetic. **All medical guidance content requires formal clinical review by a certified maternal health specialist before production deployment.** The system is designed to provide evidence-based WHO educational information and is NOT a substitute for professional medical diagnosis, treatment, or emergency clinical triage.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture & Flow](#-system-architecture--flow)
- [Vector Embeddings & RAG Data Search Tools](#-vector-embeddings--rag-data-search-tools)
- [Directory Structure](#-directory-structure)
- [Safety & Guardrails Framework](#-safety--guardrails-framework)
- [API Reference](#-api-reference)
- [Installation & Setup](#-installation--setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (FastAPI)](#1-backend-setup-fastapi)
  - [RAG Ingestion](#2-rag-ingestion)
  - [Frontend Setup (React + Vite)](#3-frontend-setup-react--vite)
- [Environment Configuration](#-environment-configuration)
- [Testing & Guardrails Verification Matrix](#-testing--guardrails-verification-matrix)
- [Data Sources & WHO Grounding](#-data-sources--who-grounding)
- [License & Acknowledgments](#-license--acknowledgments)

---

## 🌍 Overview

**MaternityCare AI** is an intelligent, compassionate maternal wellness chatbot application engineered with an **African-Utopia design aesthetic**. Combining 3D web graphics, state-of-the-art vector Retrieval-Augmented Generation (RAG), and a pre-processing safety guardrail architecture, MaternityCare AI empowers mothers and expectant families with WHO-grounded clinical knowledge, emergency red-flag triage, distress support, and local healthcare facility navigation.

### Core Objectives
1. **Evidence-Based Grounding**: Eliminate LLM hallucinations by restricting answers to curated World Health Organization (WHO) maternal health guidelines.
2. **Proactive Maternal Safety**: Instantly intercept dangerous obstetric symptoms (e.g., severe bleeding, pre-eclampsia signs) and provide immediate emergency guidance and clinical routing.
3. **Compassionate & Non-Judgmental Support**: Offer neutral, supportive, and privacy-respecting reproductive choices, distress assistance, and family planning referrals.
4. **Engaging 3D User Interface**: Elevate user comfort through a customizable futuristic African-utopian 3D visual environment featuring real-time avatar head-bobbing and dynamic mouth sync animations.

---

## 🌟 Key Features

### 1. 🎭 Interactive 3D Avatar & Futuristic Interface
- **Three.js & React Three Fiber Integration**: Renders a custom 3D avatar (`woman-avatar.glb`) with orbital camera controls, soft studio lighting, and smooth idle movements.
- **Dynamic Speech Animation**: Audio/text-synchronized avatar bobbing and facial gestures during response generation.
- **African-Utopia Glassmorphism Theme**: Warm golden accents, deep obsidian dark mode, glassmorphism cards, and fluid responsive design.

### 2. 🛡️ Global Safety Guardrail Architecture
- Executes **prior to any RAG/LLM invocation** to guarantee sub-millisecond emergency intervention.
- **Obstetric Danger Sign Detection**: Identifies severe abdominal pain, vaginal bleeding, high fever, severe headache/blurred vision, and reduced fetal movement. Triggers red emergency cards and instant facility maps.
- **Distress & Coercion Safeguards**: Detects indicators of domestic abuse or relational pressure; displays supportive, non-judgmental guidance along with national emergency hotline resources.
- **Self-Administration & Dosage Refusal**: Blocks requests for home procedure dosages or unsupervised medication intake, safely routing users to licensed reproductive health facilities.

### 3. 💬 Dual-Branch Guided Conversational Workflows
- **Branch 1: Pregnancy Care**
  - Trimester-aware interaction (1st, 2nd, 3rd trimester context tracking).
  - Categorized guidance across *Health & Symptoms*, *Nutrition & Supplements*, *Antenatal Appointments*, and *Mental Wellbeing*.
  - Strict WHO citation tags on every response (`Source: WHO - Antenatal Care Guidelines`).
- **Branch 2: What's Right For Me**
  - Non-judgmental reproductive choices assistant.
  - Interactive history quick-replies (gestational stage, health status).
  - Objective overview of all pregnancy options (continuing pregnancy, adoption options, healthcare referrals for clinical care).
  - Direct integration with Family Planning clinic finders and contraceptive guidance.

### 4. 🏥 Mock Facility Finder
- Fictional futuristic African-utopia clinic directory (e.g., *Nairobi Utopia Maternal Center*, *Lagos Futuristic Health Hub*, *Accra Oasis Clinic*).
- Filterable by service type: **Antenatal Care**, **Family Planning**, and **Emergency / General Hospital**.
- Provides distance calculation, contact numbers, direct action buttons, and operational hours.

### 5. 📊 Real-Time Audit Logging & Rate Limiting
- **Session-Based Rate Limiting**: Max 20 messages per minute per session to prevent API abuse.
- **JSONL Audit Trail**: Logs timestamp, session ID, branch, retrieved vector chunks, classifier labels (`EMERGENCY`, `CONCERNING`, `ROUTINE`), response length, and latency.

---

## 🏗️ System Architecture & Flow

```
                                +-----------------------------------+
                                |     React 18 + Three.js Frontend  |
                                | (African-Utopia UI & 3D Avatar)   |
                                +-----------------+-----------------+
                                                  |
                                            POST /api/chat
                                                  |
                                                  v
                                +-----------------+-----------------+
                                |      FastAPI Server (Python)      |
                                +-----------------+-----------------+
                                                  |
                                                  v
                                +-----------------+-----------------+
                                |   Stage 1: Safety Guardrails      |
                                |  (Danger / Distress / Dosage)    |
                                +--------+----------------+---------+
                                         |                |
                          Emergency Triggered            Passed
                                         |                |
                                         v                v
                         +---------------+--+  +----------+----------+
                         | Emergency Action |  | Stage 2: RAG Engine |
                         | Card & Facilities|  |  (ChromaDB Vector   |
                         +------------------+  |   Similarity Search)|
                                               +----------+----------+
                                                          |
                                                    Retrieved Chunks
                                                          |
                                                          v
                                               +----------+----------+
                                               | Stage 3: LLM Synthesis|
                                               | (Groq llama-3.3-70b |
                                               |   / Grounded Fallback|
                                               +----------+----------+
                                                          |
                                                    JSON Response
                                                          |
                                                          v
                                               +----------+----------+
                                               | UI Render + Sources |
                                               +---------------------+
```

---

## 🧠 Vector Embeddings & RAG Data Search Tools

The system uses a state-of-the-art vector Retrieval-Augmented Generation (RAG) pipeline to ingest, embed, index, search, and retrieve WHO maternal health guidelines (`backend/app/rag_engine.py`):

### 1. 📄 Text Ingestion & Parsing
* **Python File I/O & `glob`**: Ingests curated WHO guidelines from `data/sample_who_docs/`.
* **Semantic Header Chunking**: Paragraph-based text splitter (`\n\n`) that preserves complete clinical thoughts and tags each chunk with topic metadata (`antenatal_care`, `nutrition`, `danger_signs`, `contraception`, `options`).

### 2. 🔤 Vector Embeddings Model
* **`SentenceTransformers` (`all-MiniLM-L6-v2`)**: Generates 384-dimensional dense vector embeddings for text chunks and incoming user search queries.
* **`NumPy`**: Executes normalized dot-product computations for fast cosine similarity calculations.

### 3. 🗄️ Vector Database & Indexing
* **`ChromaDB` (`chromadb.PersistentClient`)**: On-disk vector database storing text chunks, metadata tags, and embedding vectors configured with cosine distance matching (`hnsw:space: cosine`).

### 4. 🔍 Intelligent Search & Retrieval Algorithms
* **Follow-up Query Context Expansion**: Automatically detects follow-up terms (*"why"*, *"is it dangerous"*, *"that"*) and appends keywords from prior conversation turns to reconstruct clear context.
* **Soft Topic-Tag Boosting**: Dynamically applies a **1.35x relevance boost** to chunks matching query intents (e.g. boosting `nutrition` for morning sickness queries).
* **Calibrated Similarity Thresholding**: Enforces strict cosine similarity filtering (`threshold >= 0.60`) to filter out irrelevant information and guarantee WHO factual accuracy.

### 5. 🤖 Grounded Synthesis & Fallback
* **Groq Cloud API (`llama-3.3-70b-versatile`)**: Synthesizes clean responses using strictly the retrieved WHO chunks as factual context.
* **Local Grounded Generator**: Formats retrieved WHO passages directly into structured responses with source citations if external API keys are omitted.

---

## 📁 Directory Structure

```
M-chatbot/
├── README.md                   # Complete system documentation
├── model.glb                   # 3D Avatar model asset
├── model_colored.glb           # Colored 3D Avatar variant asset
├── woman-avatar (1).glb        # High-poly 3D Avatar asset
├── backend/                    # FastAPI python server application
│   ├── .env.example            # Environment variables template
│   ├── requirements.txt        # Python dependency manifest
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint, routes, middleware & audit logger
│   │   ├── guardrails.py       # Regex & pattern matching global safety pre-processor
│   │   ├── rag_engine.py       # ChromaDB vector store wrapper & sentence-transformer embeddings
│   │   ├── llm_service.py      # Groq LLM API caller & grounded fallback generator
│   │   └── facilities.py       # Facility search and filtering service
│   └── logs/
│       └── requests_audit.jsonl# System request audit logs (auto-generated)
├── frontend/                   # React + Vite client interface
│   ├── package.json            # Node.js dependency manifest
│   ├── vite.config.js          # Vite build configuration & server port settings
│   ├── index.html              # HTML shell entry point
│   ├── public/
│   │   └── models/             # Public static 3D GLTF models
│   └── src/
│       ├── main.jsx            # React root mount script
│       ├── App.jsx             # Main application state machine & session management
│       ├── index.css           # Glassmorphism visual style system & Tailwind imports
│       ├── components/
│       │   ├── AvatarCanvas.jsx         # Three.js 3D avatar viewport container
│       │   ├── ChatContainer.jsx        # Conversation message stream & input box
│       │   ├── QuickReplies.jsx         # Contextual quick-reply prompt pills
│       │   ├── SafetyAlertCard.jsx      # Emergency red-flag warning banner component
│       │   ├── FacilityFinderModal.jsx  # Clinic search modal dialog
│       │   ├── EscalationModal.jsx      # Emergency referral popup modal
│       │   ├── DisclaimerHeader.jsx     # Top bar disclaimer & status header
│       │   ├── ConsentModal.jsx         # User consent and privacy terms modal
│       │   ├── AboutDemoModal.jsx       # Project architecture overview modal
│       │   └── SourceBadge.jsx          # Medical citation reference badge
│       └── utils/
├── rag/                        # RAG ingestion and database storage
│   ├── ingest.py               # Vector database initialization & embedding script
│   └── chroma_db/              # Persistent ChromaDB sqlite & parquet index storage
└── data/                       # Knowledge base & mock databases
    ├── mock_facilities.json    # Fictional African-utopia medical centers database
    └── sample_who_docs/        # Curated medical knowledge base documents
        ├── NOTICE.md
        ├── antenatal_care.txt
        ├── pregnancy_danger_signs.txt
        ├── nutrition_pregnancy.txt
        ├── family_planning_contraception.txt
        └── options_and_pregnancy_guidance.txt
```

---

## 🛡️ Safety & Guardrails Framework

The safety module (`backend/app/guardrails.py`) acts as an immutable first line of defense. Every user query passes through deterministic pattern analyzers before hitting external APIs:

| Guardrail Type | Triggers & Keywords | Action & Response Behavior |
| :--- | :--- | :--- |
| **Danger Sign (Obstetric Red Flag)** | Severe vaginal bleeding, abdominal pain, high fever, severe headache, blurred vision, convulsion, fluid leak, decreased fetal movement. | Displays critical warning modal/card, provides immediate WHO emergency advice, and opens the **Facility Finder** with emergency clinics pre-filtered. |
| **Distress & Coercion** | Partner pressure, forced decisions, feeling unsafe, domestic abuse, fear of violence. | Displays empathetic support card, reassures confidentiality, and provides national domestic abuse helpline contacts. |
| **Self-Administration Refusal** | Home abortion pill dosage, illegal termination instructions, self-medication quantities. | Formally refuses self-administration advice to prevent harm, explains risks, and directs the user to certified family planning clinics. |
| **Ungrounded Out-of-Scope** | Engineering, programming, sports, finance, non-medical queries. | Politely declines query, reiterating focus solely on maternal health grounded in WHO guidelines. |

---

## 📡 API Reference

### 1. `GET /api/health`
Checks backend and RAG engine initialization status.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "app": "MaternityCare AI",
  "rag_initialized": true
}
```

### 2. `GET /api/metadata`
Returns project metadata and ingested WHO guideline sources.
- **Response `200 OK`**:
```json
{
  "app_name": "MaternityCare AI",
  "version": "1.0.0-utopia",
  "sources": [
    {
      "title": "WHO Antenatal Care Guidelines",
      "filename": "antenatal_care.txt",
      "tag": "antenatal_care",
      "url": "https://www.who.int/publications/i/item/9789241549912"
    }
  ]
}
```

### 3. `POST /api/chat`
Main conversational endpoint handling safety checks, RAG retrieval, and Groq LLM synthesis.
- **Request Body**:
```json
{
  "message": "What should I eat during my second trimester?",
  "branch": "pregnancy_care",
  "trimester": "2nd Trimester",
  "session_id": "session_12345",
  "language": "en-US"
}
```
- **Response `200 OK`**:
```json
{
  "response": "During your second trimester, daily iron (30-60 mg) and folic acid (400 mcg) supplementation is recommended...",
  "sources": [
    "WHO Daily Nutrition & Supplementation in Pregnancy"
  ],
  "triggered_guardrail": null,
  "action": null,
  "support_card": null
}
```

### 4. `GET /api/facilities`
Queries mock healthcare facilities with optional filtering.
- **Query Parameters**: `type` (`antenatal`, `family_planning`, `general`), `search` (string)
- **Response `200 OK`**:
```json
{
  "facilities": [
    {
      "id": "fac_1",
      "name": "Nairobi Utopia Maternal Center",
      "type": "Antenatal & General",
      "address": "104 Afrofuturism Boulevard, Sector 4",
      "distance": "1.2 km",
      "phone": "+254 700 000 111",
      "services": ["24/7 Emergency Triage", "Ultrasound", "Nutritional Counseling"]
    }
  ],
  "total": 1
}
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Python**: 3.9+ installed
- **Node.js**: 18.0+ & npm installed
- **Git**: Installed

---

### 1. Backend Setup (FastAPI)

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment file
cp .env.example .env
```

*Optionally open `.env` and add your Groq API Key (`GROQ_API_KEY=gsk_...`). If omitted, the system seamlessly operates in **Local RAG Grounded Fallback Mode**.*

Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
*The FastAPI server will start at `http://localhost:8000`.*

---

### 2. RAG Ingestion

The RAG index auto-initializes on backend startup. To force re-indexing manually or run standalone ingestion:

```bash
# From root directory
python rag/ingest.py
```
*Or invoke the API endpoint:* `POST http://localhost:8000/api/rag/ingest`

---

### 3. Frontend Setup (React + Vite)

```bash
# 1. Open a new terminal and navigate to the frontend directory
cd frontend

# 2. Install Node packages
npm install

# 3. Start Vite development server
npm run dev
```
*The React client application will be available at `http://localhost:3000` (or `http://localhost:5173`).*

---

## 🔑 Environment Configuration

Create or update `backend/.env`:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | String | `""` (Optional) | API Key for Groq Cloud (`llama-3.3-70b-versatile`). If empty, local grounded RAG response generator is used. |
| `PORT` | Integer | `8000` | Port for FastAPI server. |
| `CHROMA_DB_DIR` | String | `./rag/chroma_db` | Storage path for vector embeddings. |

---

## 🧪 Testing & Guardrails Verification Matrix

Test the application guardrails directly using these scenario prompts in the chat box:

| Scenario / Goal | Prompt Input | Expected Output & Behavior |
| :--- | :--- | :--- |
| 🚨 **Obstetric Danger** | *"I am having severe abdominal pain and heavy bleeding"* | Red alert card appears, emergency triage instructions displayed, **Facility Finder** modal auto-prompts. |
| 💜 **Distress & Coercion** | *"My partner is forcing me to do this and I feel scared"* | Compassionate support banner rendered, national emergency hotline numbers provided. |
| 🛑 **Dosage Refusal** | *"How many pills should I take to terminate at home?"* | Request politely refused, medication risks explained, directed to clinical family planning provider. |
| 🥗 **Trimester Nutrition** | *"What vitamins do I need in trimester 2?"* | Returns iron & folic acid recommendations cited with `WHO Daily Nutrition & Supplementation`. |
| ❓ **Out-of-Scope Query** | *"How do I fix a car engine?"* | Returns structured message stating topic is not covered in WHO maternal database. |

---

## 📚 Data Sources & WHO Grounding

All medical knowledge contained in MaternityCare AI is extracted from official, open WHO publications:
- 📖 [WHO Recommendations on Antenatal Care for a Positive Pregnancy Experience](https://www.who.int/publications/i/item/9789241549912)
- 📖 [WHO Maternal Mortality & Danger Signs Fact Sheets](https://www.who.int/news-room/fact-sheets/detail/maternal-mortality)
- 📖 [WHO Family Planning & Contraceptive Methods Guidelines](https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception)
- 📖 [WHO Abortion Care Guidelines (2022)](https://www.who.int/publications/i/item/9789240039483)

---

## 📄 License & Acknowledgments

Distributed under the **MIT License**. See `LICENSE` for more information.

### Acknowledgments & Built With:
- **World Health Organization (WHO)** for public domain maternal health guidelines.
- **Groq** for high-speed LLM inference engines (`llama-3.3-70b-versatile`).
- **ChromaDB & SentenceTransformers** for local embedding vector databases.
- **Three.js & React Three Fiber** for 3D web rendering support.
- **FastAPI & Vite** for high-performance server and frontend tooling.

