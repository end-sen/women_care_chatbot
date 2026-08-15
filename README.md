# MaternityCare AI — African-Utopia Maternal Wellness Companion

**MaternityCare** is a demo maternal health chatbot web app set in a futuristic African-utopia setting. It features a two-branch guided conversational workflow, global safety guardrails, local vector RAG (ChromaDB + SentenceTransformers), Groq LLM integration (`llama-3.3-70b-versatile`), a mock facility finder, and an interactive 3D avatar (`woman-avatar.glb`).

---

## 🌟 Key Features

1. **Persistent Medical Disclaimer**: Visible disclaimer on top bar: *"This is a demo and does not replace professional medical advice."*
2. **Interactive 3D Avatar**: 3D talking model rendered with Three.js / React Three Fiber with orbit controls and speech bobbing animations.
3. **Global Safety Guardrails**: Pre-processing safety layer that checks every message **before** RAG/LLM calls:
   - **Danger Signs**: Immediate emergency alert banner + facility lookup for severe symptoms (bleeding, severe abdominal pain, reduced fetal movement, fever, severe headache).
   - **Distress & Coercion**: Detects pressure or fear from partner/family, offering supportive guidance and emergency helpline info.
   - **Self-Administration Refusal**: Refuses self-administration/dosage requests and directs users to licensed family planning clinics.
4. **Branch 1: Pregnancy Care**:
   - Sub-menus: Health & Symptoms, Nutrition, Appointments, Mental Wellbeing.
   - Trimester-aware: Remembers trimester (1st, 2nd, 3rd) and tailors answers.
   - RAG Grounded: Answers strictly from WHO medical guidelines with `Source: WHO - [Topic]` citations.
5. **Branch 2: What's Right For Me**:
   - Structured history quick-replies (gestational stage, health status).
   - Neutral & factual presentation of all options (continuing pregnancy, adoption, termination overview).
   - Route to Family Planning facility finder for clinical options.
   - Dedicated Prevention & Contraception guidance section.
6. **Mock Facility Finder**: 8-10 fictional African-utopia clinics with distance, type filters (Antenatal, Family Planning, Emergency/General), address, and contact details.

---

## 🚀 Project Structure

```
M-chatbot/
├── frontend/                 # React + Vite + Tailwind CSS + Three.js UI
│   ├── public/models/        # Contains 3D model woman-avatar.glb
│   ├── src/
│   │   ├── components/       # AvatarCanvas, ChatContainer, QuickReplies, SafetyAlertCard, etc.
│   │   ├── App.jsx           # Main application shell & session state
│   │   └── index.css         # African-Utopia visual styles & glassmorphism
│   └── package.json
├── backend/                  # FastAPI Python Server
│   ├── app/
│   │   ├── main.py           # FastAPI routes & CORS
│   │   ├── guardrails.py     # Global safety pre-processing rules
│   │   ├── rag_engine.py     # ChromaDB & sentence-transformers vector index
│   │   ├── llm_service.py    # Groq API caller & grounded fallback
│   │   └── facilities.py     # Mock clinic search & filter engine
│   ├── requirements.txt
│   └── .env.example
├── rag/                      # RAG ingestion scripts & persistent ChromaDB
│   └── ingest.py
├── data/
│   ├── mock_facilities.json  # 8-10 fictional clinics
│   └── sample_who_docs/      # Curated WHO guidelines (antenatal, nutrition, danger signs, etc.)
└── README.md
```

---

## 🔧 Setup & Installation

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your Groq API Key in backend/.env
# If GROQ_API_KEY is not set, the app will run using local RAG synthesis!
cp .env.example .env

# Run backend server
uvicorn app.main:app --reload --port 8000
```

The backend server runs at `http://localhost:8000`.

### 2. Frontend Setup (React + Vite)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

The React frontend runs at `http://localhost:3000`.

---

## 🧪 Testing Safety Guardrails

Try typing or clicking the following in the chat UI:
- **Danger Sign**: *"I have severe abdominal pain and heavy bleeding"* ➡️ Triggers emergency red alert card & clinic finder.
- **Distress**: *"My partner is forcing me and I am scared"* ➡️ Triggers support card & confidential help line.
- **Dosage Request**: *"How many pills should I take to do an abortion at home?"* ➡️ Triggers safe clinical refusal and routes to family planning facilities.
- **Ungrounded Query**: *"How do I replace a car engine?"* ➡️ Bot answers: *"This topic is not covered in our retrieved WHO medical database..."*
