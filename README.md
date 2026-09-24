# PhishGuard

**Full-Stack Cybersecurity Awareness & Phishing Detection Platform**

PhishGuard is a comprehensive web application designed to educate users about phishing attacks and provide real-time URL threat intelligence analysis. Built as a college cybersecurity capstone project, it combines machine learning, threat intelligence integration, and interactive fraud simulation to deliver a complete security awareness experience.

---

## 🎯 Project Overview

PhishGuard helps users understand, detect, and defend against phishing attacks through:

- **Real-time URL Analysis**: Multi-provider threat intelligence (VirusTotal, URLhaus, URLScan.io)
- **Machine Learning Detection**: Local scikit-learn model trained on phishing patterns
- **Interactive Fraud Simulator**: Realistic phishing scenarios with live monitoring
- **Educational Content**: Comprehensive guides on phishing techniques and prevention
- **Pattern Recognition Training**: Learn to identify suspicious URL patterns

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS + Framer Motion
- React Router v7

**Backend:**
- FastAPI (Python)
- SQLAlchemy (ORM)
- scikit-learn (ML)
- PostgreSQL/SQLite

**ML/Data:**
- scikit-learn Random Forest Classifier
- Feature extraction pipeline
- Real-time prediction API

---

## 📁 Project Structure

```
PhishGuard/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Config, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   │       ├── ml/         # ML predictor
│   │       ├── risk_engine/
│   │       └── threat_intel/
│   └── requirements.txt
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   └── styles/         # Global styles
│   └── package.json
│
├── ml/                     # ML training & models
│   ├── phishing_model.pkl
│   └── feature_columns.json
│
└── start_backend.py        # Quick start script
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **pip** and **npm**

### Installation

**1. Clone the repository:**
```bash
git clone <your-repo-url>
cd PhishGuard
```

**2. Install backend dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**3. Install frontend dependencies:**
```bash
cd frontend
npm install
```

### Running the Application

**Option 1: Using the startup script (Recommended)**
```bash
python start_backend.py
```

**Option 2: Manual start**

Terminal 1 - Backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🎓 Features

### 1. URL Intelligence Check
- Multi-provider threat intelligence lookup
- ML-based phishing detection
- Explainable risk scoring
- Visual risk breakdown

### 2. Fraud Simulation Engine
- **7 realistic phishing scenarios:**
  - Account/Login fraud
  - Subscription/Billing scams
  - Storage upgrade phishing
  - Delivery/Package fraud
  - Reward/Prize scams
  - Tech support scams
  - HR/Document impersonation

- **Live monitoring dashboard:**
  - Real-time event tracking
  - Interaction pipeline visualization
  - Captured credential display
  - Session history logs

- **Educational debrief:**
  - Attack breakdown
  - Red flag identification
  - Manipulation techniques
  - Safe action guidance

### 3. Pattern Recognition Training
- Common phishing URL patterns
- Domain spoofing techniques
- Suspicious character usage
- Social engineering indicators

### 4. Security Awareness Education
- How phishing works
- Attack flow visualization
- Warning signs
- Prevention strategies
- Real-world consequences

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
# Database
DATABASE_URL=sqlite:///./phishguard.db

# Threat Intel API Keys (Optional)
VIRUSTOTAL_API_KEY=your_key_here
URLSCAN_API_KEY=your_key_here

# Security
SECRET_KEY=your-secret-key-here
```

### Frontend Configuration

The frontend automatically connects to `http://localhost:8000` in development.

For production, update `frontend/src/services/api/client.ts`.

---

## 🧪 ML Model

The machine learning model is a **Random Forest Classifier** trained on:
- 10,000+ phishing and legitimate URLs
- 15+ extracted features (domain length, special chars, TLD patterns, etc.)
- ~95% accuracy on test set

**Model location:** `ml/phishing_model.pkl`

**Feature extraction:** `backend/app/services/ml/predictor.py`

**Retraining:** Run `ml/train_model.py` with updated dataset

---

## 📊 API Endpoints

### Core Analysis
- `POST /api/analyze` - Analyze URL for phishing risk
- `GET /api/health` - Health check

### Fraud Simulator
- `GET /api/simulator/templates` - Get simulation scenarios
- `POST /api/simulator/send-email` - Dispatch simulation email
- `POST /api/simulator/session` - Create simulation session
- `POST /api/simulator/event` - Record interaction event
- `GET /api/simulator/events/latest` - Get latest event
- `GET /api/simulator/sessions` - Get all sessions
- `POST /api/simulator/credentials` - Capture credentials
- `POST /api/simulator/reset` - Reset all sessions

Full API documentation: http://localhost:8000/docs

---

## 🎨 UI/UX Design

PhishGuard features a **dark-themed glassmorphism design** inspired by Vesper.ai:

- **Color scheme:** Deep blacks, subtle gradients, neon accents
- **Typography:** Inter (body), Instrument Serif (display)
- **Animations:** Framer Motion for smooth transitions
- **Responsive:** Mobile-first design with tablet/desktop optimization

---

## 🔐 Security Features

- **No real credential storage:** Simulator captures are educational only
- **Safe credential handling:** Demo data never persists
- **Clear educational warnings:** Every simulation displays safety notices
- **Isolated simulation environment:** No connection to real services

---

## 📝 Development

### Code Structure

**Backend follows clean architecture:**
- `api/` - Route handlers
- `services/` - Business logic
- `models/` - Database models
- `schemas/` - Request/response validation

**Frontend follows component-based architecture:**
- `pages/` - Route pages
- `components/` - Reusable UI components
- `services/` - API integration

### Adding a New Simulation Scenario

1. Add template to `backend/app/data/simulator_templates.json`
2. Define scenario type in `frontend/src/pages/SimulatorPage.tsx`
3. Create interaction template in `frontend/src/components/SimulationInteractPage.tsx`
4. Add scenario icon and colors to `SCENARIO_ICONS` and `SCENARIO_COLORS`

---

## 🧹 Maintenance

### Database Reset
```bash
# Delete database file
rm backend/phishguard.db

# Restart backend - tables will be recreated
python start_backend.py
```

### Clear Simulation History
Use the "Reset All" button in the Live Monitor tab, or:
```bash
curl -X POST http://localhost:8000/api/simulator/reset
```

---

## 📚 Resources

- **Threat Intel Providers:**
  - [VirusTotal](https://www.virustotal.com/)
  - [URLhaus](https://urlhaus.abuse.ch/)
  - [URLScan.io](https://urlscan.io/)

- **ML Resources:**
  - [scikit-learn Documentation](https://scikit-learn.org/)
  - [Phishing Dataset (Kaggle)](https://www.kaggle.com/datasets)

---

## 🤝 Contributing

This is a college capstone project. Contributions, suggestions, and feedback are welcome!

---

## 📄 License

This project is built for educational purposes as part of a college cybersecurity program.

---

## 👨‍💻 Author

**Pranav Patil**  
College Capstone Project - Cybersecurity Awareness Platform

---

## 🔗 Links

- **Live Demo:** [Add your deployment URL]
- **Project Review:** https://forms.gle/X4TrbPDcde1axTqo7
- **Documentation:** See `documentation.md` for detailed technical documentation

---

## 🎯 Future Enhancements

- [ ] Email phishing simulator with real email dispatch
- [ ] User authentication and progress tracking
- [ ] Custom simulation campaign builder
- [ ] Extended ML model with deep learning
- [ ] Browser extension for real-time protection
- [ ] Multi-language support

---

**Built with ❤️ for cybersecurity education**
