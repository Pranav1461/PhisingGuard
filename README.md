# PhishGuard — URL Intelligence & Cybersecurity Awareness

> **100% Free & Open Source** · Zero-cost operation

PhishGuard is a full-stack cybersecurity platform that combines **security awareness training**, **real-time URL threat intelligence**, **machine learning**, and a **controlled phishing simulator** into one explainable, professional product.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript%20%2B%20Vite-61DAFB)
![Stack](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688)
![Stack](https://img.shields.io/badge/ML-scikit--learn-F7931E)
![Stack](https://img.shields.io/badge/DB-Supabase%20PostgreSQL-3ECF8E)

---

## 🧩 Features

| Feature | Description |
|---|---|
| 🔍 **URL Website Checker** | Paste a URL → checked against VirusTotal, urlscan.io, URLhaus, URL-structure analysis, and a local ML model → explainable SAFE / SUSPICIOUS / PHISHING verdict. |
| 🔒 **Security Awareness** | What phishing is, why attackers use it, common techniques, warning signs, consequences, and protections. |
| 🧠 **Pattern Learning** | Visual breakdown of URL anatomy and the recurring structural characteristics of phishing URLs — with honest caveats that signals are not proof. |
| 🎭 **Phishing Simulator** | Controlled, fictional login-page demo ("NordVault Mail") with a monitoring dashboard. Passwords are **never sent, stored, hashed, or logged** — only a boolean flag. |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (React/Vite)                      │
│      Home · Check · Learn · Patterns · Simulator (SPA, dark-mode)    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  REST API (/api)
┌──────────────────────────────▼──────────────────────────────────────┐
│                        Backend (FastAPI)                             │
│                                                                      │
│   URL Validation & SSRF Protection  →  Threat-Intel Orchestrator     │
│        ↓                                        ↓                    │
│   Feature Extraction (18 signals)    VirusTotal · urlscan · URLhaus  │
│        ↓                                                             │
│   ML Model (scikit-learn Random Forest)                              │
│        ↓                                                             │
│   Explainable Risk Engine  →  SAFE / SUSPICIOUS / PHISHING           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ SQLAlchemy / Alembic
                        ┌──────▼──────┐
                        │  Database    │
                        │ (Supabase    │
                        │  PostgreSQL) │
                        └─────────────┘
```

## 📁 Project Structure

```
phishguard/
├── frontend/                 # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/layout/      # Navbar, Footer, Layout
│   │   ├── pages/                  # Home, Check, Learn, Patterns, Simulator
│   │   ├── services/api/           # Axios API layer (analysis, simulator, types)
│   │   ├── assets/
│   │   └── index.css               # Tailwind v4 theme (light + dark)
│   ├── index.html
│   ├── vite.config.ts             # Vite proxy: /api → localhost:8000
│   └── package.json
│
├── backend/                  # Python + FastAPI
│   └── app/
│       ├── api/                     # analyze · simulator · health · router
│       ├── core/                    # security (SSRF) · config · database
│       ├── models/                  # SQLAlchemy models
│       ├── schemas/                 # Pydantic schemas
│       └── services/
│           ├── threat_intel/        # virustotal · urlscan · urlhaus · orchestrator
│           ├── ml/                  # predictor.py
│           └── risk_engine/         # engine.py (explainable scoring)
│
├── ml/
│   ├── features/url_features.py     # Shared deterministic feature extraction
│   ├── generate_dataset.py          # Built 10k synthetic samples
│   ├── data/dataset.csv
│   └── models/phishing_model.joblib # Trained Random Forest
│
├── tests/                   # pytest suite (analyze, ml, risk, simulator, ssrf)
├── prd.md                   # Product Requirements
├── techstack.md             # Technical Stack & Architecture
├── requirements.txt         # Python dependencies
├── vercel.json              # Vercel frontend config
└── package.json             # Root convenience scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 20 and npm
- **Python** ≥ 3.10 and pip
- Built-in SQLite database (zero setup required)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd phishguard

# Frontend
cd frontend
npm install
cd ..

# Backend
python -m venv .venv
# Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
# Backend — copy template and add your API keys (server-side only)
cp backend/.env.example backend/.env
# edit backend/.env → add VIRUSTOTAL_API_KEY, URLSCAN_API_KEY, URLHAUS_AUTH_KEY, DATABASE_URL

# Frontend (optional — leave empty for local dev, Vite proxies /api)
cp frontend/.env.example frontend/.env.local
```

Get free API keys:
- **VirusTotal**: https://www.virustotal.com (Public API — 500 req/day, 4 req/min)
- **urlscan.io**: https://urlscan.io (Free plan)
- **URLhaus**: https://urlhaus.abuse.ch (Community API)

### 3. Train the ML model (optional — a trained model is included)

```bash
python ml/generate_dataset.py     # builds dataset.csv 
# Then run the training notebook/script to export ml/models/phishing_model.joblib
```

### 4. Run the backend

```bash
# From the project root (imports use backend.app.* paths)
uvicorn backend.app.main:app --reload --port 8000
```

FastAPI auto-docs: http://localhost:8000/docs

### 5. Run the frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to the backend on `:8000`.

### 6. Run tests

```bash
pytest
```

---

## ☁️ Deploying to Vercel

This repo is configured so **the React frontend deploys to Vercel** (SPA build with client-side routing), while the FastAPI backend can be hosted on a free serverless/long-running service (see below).

### Frontend → Vercel

1. Push the repo to GitHub.
2. In Vercel, **Import Project** → select the repo.
3. **Framework Preset:** Vite (auto-detected via `vercel.json`).
4. Build settings are read from `vercel.json`:
   - Build command: `cd frontend && npm install && npm run build`
   - Output directory: `frontend/dist`
5. Add an environment variable (when your backend is live):
   - `VITE_API_BASE_URL=https://<your-backend-url>/api`
6. Deploy. 🎉

`vercel.json` also adds an SPA rewrite so deep links (e.g. `/check`) work on refresh, and long-cache headers for hashed assets.

### Backend → free hosting (optional)

The FastAPI backend is a standard Python app. Free options:
- **Render** (free tier web service) — `uvicorn backend.app.main:app`
- **Railway** — `pip install -r requirements.txt` + run command above
- **Supabase** for the PostgreSQL database (free)

Set the same env vars (`VIRUSTOTAL_API_KEY`, etc.) in the host's dashboard.

---

## 🔒 Security & Privacy

- **No real credentials** are ever stored: the simulator persists only `password_entered: true/false`.
- **SSRF protection** blocks loopback, private, link-local, and internal IP ranges before any server-side URL fetch.
- **Provider independence**: if VirusTotal / urlscan / URLhaus is down or rate-limited, the app continues with the other sources and clearly marks the provider as unavailable — it never fabricates results and never treats "provider unavailable" as "website is safe."
- **Honest ML**: prediction probability is presented as a model output, not a guarantee.
- Secrets stay **server-side only**; CORS is locked to allowed origins.

## 📚 Documentation

- [PRD](prd.md) — full product requirements (features, privacy, success criteria)
- [techstack.md](techstack.md) — technical architecture, providers, ML pipeline

## 📄 License

Open source. All data and API integrations respect the terms of their respective free providers.

---

*Built with React, TypeScript, Vite, FastAPI, scikit-learn, SQLAlchemy, and Supabase — entirely at ₹0 cost.*
