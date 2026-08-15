# Cadence — AI Learning Assistant & Personalized Study Planner

Cadence is a full-stack study platform: a React/TypeScript frontend and an Express/TypeScript
backend that talks to Google Gemini, the YouTube Data API, Google OAuth, and MongoDB. It
generates real AI-graded mock tests and study material analysis from uploaded documents, gives
students a real conversational AI tutor (with relevant video suggestions), and supports both
email/password and "Sign in with Google" authentication.

## Repository structure

```
HackInMotion-TeamCode/
├── frontend/             # React + TypeScript frontend (Vite, Tailwind, Framer Motion)
│   └── src/
├── backend/              # Express + TypeScript backend
│   └── src/
│       ├── lib/          # Gemini, YouTube, MongoDB, Google OAuth verification, PDF/DOCX extraction
│       └── routes/       # /api/auth, /api/documents, /api/tutor, /api/mocktest, /api/studyplan
├── docs/                 # Architecture diagram, API documentation, presentation
├── assets/               # Supporting images/media
└── README.md
```

The frontend never talks to Gemini, YouTube, or MongoDB directly — all of that is proxied through
the backend so API keys and database credentials stay server-side.

### Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, Recharts
- **Backend:** Node.js, Express, TypeScript (`tsx` for dev), MongoDB driver, `bcryptjs`, `jsonwebtoken`
- **AI / external services:** Google Gemini (`@google/generative-ai`), YouTube Data API v3,
  Google Identity Services (OAuth), `pdf-parse` + `mammoth` for document text extraction
- **Database:** MongoDB (user accounts)

### Key features

- **Real AI Tutor chat** — Gemini-backed conversational tutor with concise answers, quizzing on
  request, and relevant embedded YouTube videos when a topic benefits from one.
- **Document-grounded mock tests** — upload a PDF/DOCX/image (syllabus, question bank, notes) and
  Gemini analyzes it (topics, priorities, difficulty spread) and generates exam questions grounded
  in that document's actual content.
- **Manual mock test generation** — generate practice questions for any subject/topic/difficulty
  without needing a document, also via Gemini.
- **AI-generated study plans** — Gemini builds a real, ordered session-by-session schedule from
  your goal, subjects, deadline, and weak topics.
- **Real progress & achievements** — computed live from your actual study plan completions and
  mock test history, not static placeholder data.
- **Authentication** — email/password (bcrypt-hashed, JWT sessions) and real Google OAuth, both
  backed by MongoDB.

## Getting started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongodb://localhost:27017/` works for development)
- API keys/credentials (see below) — the app degrades gracefully and reports clear config errors
  for any that are missing, rather than faking results

### 1. Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure environment variables

Copy the example env files and fill them in:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

**`frontend/.env`**

| Variable                 | Required | Notes                                                     |
| ------------------------ | -------- | ----------------------------------------------------------- |
| `VITE_API_URL`           | Yes      | Backend URL, e.g. `http://localhost:3002/api`               |
| `VITE_GOOGLE_CLIENT_ID`  | Optional | Enables the "Continue with Google" button. Same value as `GOOGLE_CLIENT_ID` below. |

**`backend/.env`**

| Variable            | Required | Notes                                                                 |
| -------------------- | -------- | ---------------------------------------------------------------------- |
| `PORT`               | Yes      | Backend port                                                          |
| `CLIENT_ORIGIN`      | Yes      | Frontend origin, for CORS                                             |
| `JWT_SECRET`         | Yes      | Long random string used to sign session tokens                       |
| `GEMINI_API_KEY`     | Yes      | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — powers document analysis, mock test generation, study plans, and the AI tutor |
| `GEMINI_MODEL`       | No       | Defaults to `gemini-flash-lite-latest`                                |
| `YOUTUBE_API_KEY`    | Optional | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) — enables video suggestions in the AI tutor |
| `MONGODB_URI`        | Yes      | e.g. `mongodb://localhost:27017/`                                     |
| `MONGODB_DB_NAME`    | No       | Defaults to `nova`                                                    |
| `GOOGLE_CLIENT_ID`   | Optional | OAuth client ID (Web application type) — same value as `VITE_GOOGLE_CLIENT_ID` |

None of these are committed to git — `.env` is gitignored in both the frontend and backend.

### 3. Run the app

In two separate terminals:

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`. A demo account (`harshit.dubey@example.com` / `demo1234`) is
seeded automatically on backend startup for quick exploration without signing up.

## Scripts

Run from `frontend/` or `backend/` respectively:

| Command             | What it does                          |
| -------------------- | -------------------------------------- |
| `npm run dev`         | Start the dev server                |
| `npm run build`       | Type-check and build for production |
| `npm run typecheck`   | Run TypeScript with no emit         |
| `npm run lint`        | Run ESLint (frontend only)          |

## Notes on data

- User accounts are the only thing persisted server-side (MongoDB).
- Learning goals, study plans, and progress stats currently live in browser `localStorage` —
  they are per-browser and not yet synced to an account across devices.
- Document analysis results are cached in-memory on the backend for one hour, keyed to the
  signed-in user, then discarded.
