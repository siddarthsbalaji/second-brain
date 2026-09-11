# Second Brain 🧠

A modern, full-stack personal knowledge management (PKM) and productivity suite. Second Brain brings together interconnected note-taking, an interactive 2D knowledge graph, task and checklist management, habit tracking, a daily journal, an inspiration feed (**Lumen**), and a modular **Plugin Ecosystem** (Kanban Board, Pomodoro Timer)—all secured with **Google Sign-In**.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
  - [Google Authentication & Onboarding](#-google-authentication--onboarding)
  - [Modular Plugin Ecosystem](#-modular-plugin-ecosystem)
  - [Lumen (Daily Sparks & Trivia)](#-lumen-daily-sparks--trivia)
  - [Notes & 2D Knowledge Graph](#-notes--2d-knowledge-graph)
  - [Tasks, Subtasks & Checklists](#-tasks-subtasks--checklists)
  - [Habits, Journal & Calendar](#-habits-journal--calendar)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Firebase Configuration Guide](#firebase-configuration-guide)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Running with Docker Compose](#running-with-docker-compose)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🏛️ Architecture Overview

The application is structured as a decoupled monorepo containing a high-performance **React Single Page Application (SPA)** and a secure **Express REST API** connected to **Firebase Firestore**.

```mermaid
graph TD
    subgraph Browser ["Client (React + Vite SPA on Vercel)"]
        FBAuth["Firebase Auth (Google Sign-In)"]
        UI["Modern UI (Tailwind + Framer Motion)"]
        Plugins["Plugin System (Kanban, Pomodoro)"]
        Query["React Query Cache"]
    end

    subgraph Backend ["Server (Express 5 + TypeScript)"]
        RateLimit["Rate Limiting (express-rate-limit)"]
        AuthMiddleware["Auth Middleware (adminAuth.verifyIdToken)"]
        Validation["Zod Validation Middleware"]
        StorageHandler["Storage Route (Firebase Cloud Storage)"]
        APIRoutes["Resource APIs (Notes, Tasks, Habits, Journal)"]
    end

    subgraph Cloud ["Firebase Cloud Ecosystem"]
        FBApi["Firebase Authentication Service"]
        FBStorage[("Firebase Cloud Storage")]
        DB[("Firestore (NoSQL Database)")]
    end

    FBAuth -->|Google Popup Sign-In| FBApi
    FBApi -->|ID Token (JWT)| UI
    UI -->|REST API over Axios (Bearer Token)| RateLimit
    RateLimit --> AuthMiddleware
    AuthMiddleware -->|Verify Token| FBApi
    AuthMiddleware --> Validation
    Validation --> APIRoutes
    StorageHandler -->|Stream Attachments| FBStorage
    APIRoutes --> DB
```

- **Client:** React 19, Vite, TypeScript, Tailwind CSS, Framer Motion for micro-interactions, React Query for resilient caching, and React Router v7.
- **Server:** Node.js with Express 5, TypeScript, Zod validation, Rate Limiting, and JWT session signing.
- **Database:** Firebase Firestore (NoSQL database) configured via Firebase Admin SDK.

---

## ✨ Key Features

### 🔐 Google Authentication & Onboarding
- **Google Identity Services (GIS):** Seamless one-tap and button sign-in directly in the browser; no passwords to remember.
- **Audience Verification:** Backend validates Google ID tokens against `GOOGLE_CLIENT_ID` via Firebase Admin SDK.
- **Instant Account Provisioning:** New users automatically receive an account and a default `Inbox` task list on first sign-in.
- **Personalized Username Modal:** First-time sign-ins trigger an onboarding modal to customize their display name.
- **Dev Bypass Mode:** Built-in development bypass for fast offline testing in non-production environments.

### 🧩 Modular Plugin Ecosystem
Extensible plugin architecture managed via the **Plugin Manager** modal (`Blocks` icon in header). Plugins can hook into predefined UI slots:
- **📋 Kanban Board:** 
  - Visual task management view for your tasks.
  - Organize tasks across customizable workflow columns (*Backlog*, *Todo*, *In Progress*, *Done*).
  - Drag-and-drop workflow status updates, task drawer editor, priority badges, and subtask progress bars.
- **⏱️ Pomodoro Timer:** 
  - Floating productivity widget with customizable focus duration, short breaks, and long breaks.
  - Audio chimes, automated session tracking, and direct pairing with current active tasks.
- **Configurable Settings:** Each plugin stores persistent, user-specific settings.

### 💡 Lumen (Sources For Inspiration)
- **Daily Inspiration Feed (`/lumen`):** Curated library of thought-provoking paradoxes, philosophical ideas, and untranslatable words.
- **Interactive Cards:** Flip/reveal trivia answers, shuffle through sparks, or copy with one click.
- **One-Click Note Creation:** Directly capture any spark or quote into your Second Brain as an editable Markdown note with backlink tags.

### 📝 Notes & 2D Knowledge Graph
- **Bidirectional Wiki-Links:** Interlink notes seamlessly using `[[Note Title]]` syntax with automatic backlink tracking.
- **Dual Markdown Editors:** Toggle between rich WYSIWYG editing (TipTap) and raw Markdown formatting (CodeMirror).
- **Interactive Knowledge Graph:** Visualize connections across your second brain with a physics-driven 2D force-directed graph (`react-force-graph-2d`).

### ✅ Tasks, Subtasks & Checklists
- **Multi-List Management:** Organize tasks into multiple lists (default *Inbox*, *Work*, *Personal*, or custom projects).
- **Subtask Checklists:** Break complex tasks down into itemized checklists with real-time completion percentages.
- **Priorities & Due Dates:** Filter and sort by priority (`urgent`, `high`, `medium`, `low`) and due dates with calendar integration.

### 🔥 Habits, Journal & Calendar
- **Habit Tracker:** Log daily streaks, track completion histories, and maintain momentum with optimistic UI updates.
- **Daily Journal:** Date-anchored daily reflection logs linked with notes and tasks for that day.
- **Calendar:** Unified view of scheduled deadlines, events, and recurring habits.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **State & Data Fetching** | TanStack React Query v5, Axios, React Context API |
| **Routing & Navigation** | React Router v7 |
| **Editor & Graph** | TipTap Starter Kit, CodeMirror v6, `react-force-graph-2d`, `canvas-confetti` |
| **Backend** | Express 5, Node.js (v20+), TypeScript, `express-rate-limit`, `ts-node`, `nodemon` |
| **Auth & Security** | Google Identity Services (GIS), Firebase Admin, JWT (`jsonwebtoken`), CORS |
| **Database** | Firebase Firestore (NoSQL) |
| **Validation** | Zod |
| **Testing** | Vitest, Supertest, Playwright (E2E) |
| **Infrastructure** | Docker, Docker Compose, Nginx, Vercel |

---

## 📂 Repository Structure

```text
second-brain/
├── client/                               # Frontend React SPA
│   ├── public/                           # Static assets (favicons, icons)
│   ├── src/
│   │   ├── api/                          # Axios instance & interceptors
│   │   ├── auth/                         # AuthProvider, useAuth & auth context
│   │   ├── components/                   # Core UI components & AppShell
│   │   │   ├── auth/                     # UsernamePromptModal & auth modals
│   │   │   ├── plugins/                  # PluginManagerModal & UI slots
│   │   │   └── tasks/                    # Task lists, forms, & modals
│   │   ├── context/                      # ThemeContext, PluginContext
│   │   ├── data/                         # Lumen quotes, facts, and trivia cards
│   │   ├── lib/                          # API clients (notes, tasks)
│   │   ├── pages/                        # Routes (Home, Notes, Tasks, Habits,
│   │   │                                 #  Journal, Calendar, Lumen, Login)
│   │   ├── plugins/                      # Built-in modular plugins
│   │   │   ├── kanban/                   # Kanban board & card drawer
│   │   │   └── pomodoro/                 # Floating Pomodoro timer widget
│   │   └── types/                        # TypeScript interfaces & types
│   ├── index.html                        # HTML entry point (loads Google GSI)
│   ├── vite.config.ts                    # Vite configuration
│   └── Dockerfile                        # Multi-stage Nginx build
├── server/                               # Backend Express API
│   ├── src/
│   │   ├── domain/                       # Core domain entities & business logic
│   │   ├── middleware/                   # JWT auth, validation, rate limiting, error handlers
│   │   ├── routes/                       # Express routes (auth, notes, tasks, habits, etc.)
│   │   ├── utils/                        # Async handlers & utility functions
│   │   ├── db.ts                         # Firebase Firestore configuration
│   │   └── index.ts                      # Server bootstrap & middleware setup
│   └── Dockerfile                        # Server container configuration
└── docker-compose.yml                    # Local multi-container setup
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm** or **pnpm**
- **Google Cloud / Firebase Account**: For Google Sign-In OAuth credentials and Firestore database.

---

### Firebase Configuration Guide

#### 1. Enable Google Authentication in Firebase
1. In the [Firebase Console](https://console.firebase.google.com/), select your project.
2. Go to **Build** → **Authentication** → **Sign-in method**.
3. Click **Add new provider** → select **Google** → toggle **Enable** → enter your support email → click **Save**.

#### 2. Enable Firebase Cloud Storage & Firestore
1. Go to **Build** → **Storage** → click **Get Started**.
2. Go to **Build** → **Firestore Database** → click **Create Database**.
3. Select **Start in production mode** (or test mode) and choose your preferred Cloud region.

---

### Environment Variables

#### 1. Server Environment (`server/.env`)
Create `server/.env` (based on `server/.env.example`):
```env
# Secret key for JWT signing (at least 32 characters, e.g. `openssl rand -base64 32`)
JWT_SECRET=super_secret_second_brain_jwt_token_must_be_at_least_32_chars_long

# Allowed frontend origins (comma-separated for CORS)
FRONTEND_ORIGINS=http://localhost:5173

# Server port
PORT=5000
NODE_ENV=development

# Firebase Admin SDK (Project Settings -> Service Accounts -> Generate New Private Key)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
```

#### 2. Client Environment (`client/.env`)
Create `client/.env` (based on `client/.env.example`):
```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Firebase Web App Config (Project Settings -> General -> Your Apps)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...
```

---

### Running Locally

Run both the server and client concurrently:

#### Terminal 1 — Backend:
```bash
cd server
npm install
npm run dev
# Server starts at http://localhost:5000
```

#### Terminal 2 — Frontend:
```bash
cd client
npm install
npm run dev
# Client starts at http://localhost:5173
```

Open your browser at **`http://localhost:5173`** to access Second Brain.

---

### Running with Docker Compose

You can also orchestrate the entire stack (Express backend, and React/Nginx frontend) with Docker:

```bash
docker compose up --build
```
- **Web App:** `http://localhost:80`
- **Backend API:** `http://localhost:5000`

---

## 🚢 Deployment

### Frontend (Vercel)
1. Import the repository in [Vercel](https://vercel.com).
2. Set the **Root Directory** to `client`.
3. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend-api.com`
4. Add your Vercel deployment domain to **Authorized JavaScript origins** in Google Cloud Console.

### Backend
- Deploy the Express API to [Render](https://render.com), [Railway](https://railway.app), or any VPS.
- Set environment variables (`JWT_SECRET`, `FRONTEND_ORIGINS`, and Firebase credentials).

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
