# Second Brain 🧠

[![Live Demo](https://img.shields.io/badge/Live%20Demo-second--brain--ten--ruddy.vercel.app-7928CA?style=for-the-badge&logo=vercel&logoColor=white)](https://second-brain-ten-ruddy.vercel.app)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express%205-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com/)

> **Second Brain** is a personal knowledge management (PKM) and productivity platform designed to bridge free-form thinking and structured action. Featuring interconnected markdown note-taking with wiki-links, an interactive 2D force-directed knowledge graph, multi-list tasks with subtask checklists, habit streak tracking, a daily reflection journal, a curated spark feed (**Lumen**), and a modular **Plugin Ecosystem** (Kanban & Pomodoro)—all secured with seamless **Google Authentication**.

---

> [!NOTE]
> ### 🏁 Project Status: Complete & Retired
> This project has reached its target milestone and is successfully deployed in production. All primary features, integrations (Google Auth, Firebase Firestore, Cloud Storage, Express API), and client-side plugins are fully operational. This repository serves as a reference architecture for full-stack PKM systems built with modern web technologies.
> 
> **Production URL:** [https://second-brain-ten-ruddy.vercel.app](https://second-brain-ten-ruddy.vercel.app)

---

## 📑 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Core Features](#-core-features)
   - [Google Authentication & Onboarding](#-google-authentication--onboarding)
   - [Interlinked Notes & 2D Knowledge Graph](#-interlinked-notes--2d-knowledge-graph)
   - [Task Management & Subtask Checklists](#-task-management--subtask-checklists)
   - [Modular Plugin Ecosystem (Kanban & Pomodoro)](#-modular-plugin-ecosystem)
   - [Habits, Daily Journal & Calendar](#-habits-daily-journal--calendar)
   - [Lumen Inspiration Feed](#-lumen-inspiration-feed)
3. [Tech Stack](#-tech-stack)
4. [Production Deployment Guide](#-production-deployment-guide)
   - [1. Firebase Setup (Auth, Firestore & Storage)](#1-firebase-setup)
   - [2. Backend Deployment on Render](#2-backend-deployment-on-render)
   - [3. Frontend Deployment on Vercel](#3-frontend-deployment-on-vercel)
   - [4. Verification & Common Gotchas](#4-deployment-verification--gotchas)
5. [Environment Variables Reference](#-environment-variables-reference)
6. [Local Development](#-local-development)
   - [Prerequisites](#prerequisites)
   - [Running Locally](#running-locally)
   - [Running with Docker Compose](#running-with-docker-compose)
7. [Repository Structure](#-repository-structure)
8. [License](#-license)

---

## 🏛️ Architecture Overview

The repository is organized as a decoupled monorepo consisting of:
- **Frontend SPA**: React 19 and Vite deployed on **Vercel** with global CDN caching and client-side SPA routing.
- **Backend API**: Express 5 on Node 20 deployed on **Render** (containerized via Docker), providing authenticated REST endpoints, Zod validation, and rate limiting.
- **Data & Auth Cloud**: **Firebase Authentication** for identity tokens, **Firestore** for document persistence, and **Firebase Cloud Storage** for file attachments.

```mermaid
flowchart TB
    subgraph Client ["Client Layer (Vercel CDN)"]
        SPA["React 19 SPA (Vite + TypeScript)"]
        GAuth["Google Identity Client SDK"]
        RQ["TanStack React Query Cache"]
        Plugins["Plugin Registry (Kanban / Pomodoro)"]
    end

    subgraph Backend ["Backend API Layer (Render Cloud)"]
        Express["Express 5 REST Server"]
        RL["Rate Limiter (100 req/15min)"]
        CORS["CORS Policy Validation"]
        AuthMid["Auth Middleware (Firebase Admin Token Verify)"]
        Zod["Zod Request Validation"]
        Routes["Resource Routers (Notes, Tasks, Habits, Calendar, Journal)"]
    end

    subgraph Firebase ["Data & Cloud Layer (Firebase)"]
        FA["Firebase Authentication"]
        FS[("Firestore Database")]
        CS[("Cloud Storage Bucket")]
    end

    GAuth -->|1. Authenticate with Google| FA
    FA -->|2. Return Firebase ID Token| GAuth
    SPA -->|3. REST API Requests + Bearer Token| RL
    RL --> CORS
    CORS --> AuthMid
    AuthMid -->|4. Verify Token via Admin SDK| FA
    AuthMid --> Zod
    Zod --> Routes
    Routes -->|Read / Write Documents| FS
    Routes -->|Stream Attachments| CS
```

---

## ✨ Core Features

### 🔐 Google Authentication & Onboarding
- **Zero-Friction Sign-In:** Authenticate seamlessly using Google Identity Services (GIS); no passwords or email verification links required.
- **Token Verification:** The backend securely validates client-issued ID tokens against Google’s cryptographic public keys using the Firebase Admin SDK.
- **Automatic User Provisioning:** First-time users are instantly provisioned with a database profile and an initialized `Inbox` task list.
- **Display Name Onboarding:** Interactive modal on first sign-in allowing users to personalize their username.
- **Offline / Dev Mode:** Integrated offline test login for quick local testing without live Firebase credentials.

### 📝 Interlinked Notes & 2D Knowledge Graph
- **Bidirectional Wiki-Links:** Connect related notes using standard `[[Note Title]]` syntax; backlinks are tracked and updated automatically.
- **Interactive 2D Force Graph:** Render your second brain as an animated, interactive force-directed network graph powered by `react-force-graph-2d`.
- **Dual Markdown Editors:** Seamlessly toggle between rich WYSIWYG editing (TipTap) and raw Markdown code (CodeMirror 6).
- **Tag Management:** Auto-indexing of tags across notes with tag filtering and fast search.

### ✅ Task Management & Subtask Checklists
- **Multi-List Organization:** Organize tasks across discrete lists (`Inbox`, `Work`, `Personal`, or custom project categories).
- **Nested Subtask Lists:** Add itemized checklists to any task with real-time completion tracking and dynamic progress bars.
- **Priorities & Dates:** Classify items by urgency (`low`, `medium`, `high`) and attach due dates with reminders.

### 🧩 Modular Plugin Ecosystem
Extensible client-side plugin architecture managed directly from the **Plugin Manager** modal:
- **📋 Kanban Board Plugin:**
  - Converts any task list into a 4-column visual kanban (*Backlog*, *Todo*, *In Progress*, *Done*).
  - Drag-and-drop workflow status updates, task drawer editor, and subtask progress indicators.
- **⏱️ Pomodoro Timer Plugin:**
  - Floating, minimizeable productivity widget with configurable focus sessions, short breaks, and long breaks.
  - Native browser notifications, celebratory chime audio, and direct task pairing.

### 🔥 Habits, Daily Journal & Calendar
- **Habit Tracker:** Log daily completion streaks, visualize consistency grids, and celebrate milestones with confetti animations.
- **Daily Reflection Journal:** Anchor your thoughts to dates with automated morning and evening prompts.
- **Unified Calendar:** Centralized calendar grid combining scheduled events, recurring rules, and task deadlines.

### 💡 Lumen Inspiration Feed
- **Curated Thought Sparking:** Daily library of philosophical paradoxes, scientific concepts, and untranslatable expressions.
- **One-Click Capture:** Instantly convert any spark or quote card into an editable note within your second brain.

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | High-performance SPA with modern React hooks & fast HMR |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) | Curated utility classes, dark mode, responsive layouts |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Polished page transitions and UI micro-animations |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/) | Crisp, modern icon set |
| **Data Fetching** | [TanStack Query v5](https://tanstack.com/query/latest) | Asynchronous state management, auto-retries, and cache synchronization |
| **HTTP Client** | [Axios](https://axios-http.com/) | Centralized client with auth token interceptors |
| **Backend Runtime** | [Node.js v20](https://nodejs.org/) + [Express 5](https://expressjs.com/) | Robust REST API server written in TypeScript |
| **Schema Validation** | [Zod](https://zod.dev/) | Runtime request body and parameter validation |
| **Rate Limiting** | [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | DDoS & brute-force mitigation (100 req / 15 min per IP) |
| **Database & Auth** | [Firebase](https://firebase.google.com/) | Firestore NoSQL Database, Firebase Auth, and Cloud Storage |
| **Hosting (Client)** | [Vercel](https://vercel.com/) | Edge network global static hosting with SPA rewrites |
| **Hosting (Server)** | [Render](https://render.com/) | Containerized cloud web service running Docker |

---

## 🚢 Production Deployment Guide

Deploying Second Brain into production requires configuring three integrated components: **Firebase**, **Render**, and **Vercel**.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Vercel as Vercel (Frontend)
    participant Render as Render (Backend API)
    participant Firebase as Firebase (Auth & Firestore)

    User->>Vercel: Load https://second-brain-ten-ruddy.vercel.app
    User->>Firebase: Google Sign-In Popup
    Firebase-->>User: Issue Google ID Token
    User->>Render: POST /api/auth/sync (Bearer Token)
    Render->>Firebase: Verify Token via Firebase Admin
    Firebase-->>Render: Valid Identity (uid, email)
    Render-->>User: Authenticated User Session
    User->>Render: GET /api/notes, /api/tasks, etc.
    Render->>Firebase: Query Firestore DB
    Firebase-->>Render: Data Documents
    Render-->>User: JSON Response
```

---

### 1. Firebase Setup

#### A. Create Firebase Project & Enable Services
1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g., `secondbrain-c2930`).
2. **Authentication:**
   - Go to **Build → Authentication → Get Started**.
   - Under the **Sign-in method** tab, enable **Google**.
   - Under the **Settings → Authorized domains** tab, add your Vercel production domain:
     ```
     second-brain-ten-ruddy.vercel.app
     ```
3. **Firestore Database:**
   - Go to **Build → Firestore Database → Create Database**.
   - Choose your preferred cloud region and start in **Production mode**.
4. **Cloud Storage:**
   - Go to **Build → Storage → Get Started** to enable attachment uploads.

#### B. Retrieve Client Configuration
1. Go to **Project Settings** (gear icon) → **General**.
2. Scroll to **Your apps**, click the **Web (`</>`)** icon, and register an app name.
3. Copy the `firebaseConfig` keys for your frontend environment variables.

#### C. Generate Service Account Key (For Backend)
1. Go to **Project Settings → Service Accounts**.
2. Under **Firebase Admin SDK**, select **Node.js** and click **Generate new private key**.
3. Open the downloaded JSON file. You will need:
   - `project_id`
   - `client_email`
   - `private_key`

---

### 2. Backend Deployment on Render

The Express backend runs inside a lightweight Node.js Alpine Docker container (`server/Dockerfile`).

1. Log into [Render Dashboard](https://dashboard.render.com/) and click **New → Web Service**.
2. Connect your GitHub repository (`siddarthsbalaji/second-brain`).
3. Configure the service settings:
   - **Name:** `second-brain-server` (or your preferred name)
   - **Region:** Choose the region closest to your Firebase region
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Docker`
   - **Health Check Path:** `/health`
4. Under **Environment Variables**, add the following:

| Variable | Value / Format | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production optimizations |
| `PORT` | `5000` | Port Express listens on |
| `JWT_SECRET` | `minimum_32_character_random_string` | Session token signing |
| `FRONTEND_ORIGINS` | `https://second-brain-ten-ruddy.vercel.app,http://localhost:5173` | CORS allowed origins |
| `FIREBASE_PROJECT_ID` | `secondbrain-c2930` | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@...iam.gserviceaccount.com` | Service account identity |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\nMIIE...-----END PRIVATE KEY-----\n"` | Admin private key (preserve newlines) |
| `FIREBASE_STORAGE_BUCKET`| `secondbrain-c2930.firebasestorage.app` | Cloud storage bucket |

5. Click **Create Web Service**. Render will automatically build the container and deploy. Note your backend URL (e.g. `https://second-brain-server.onrender.com`).

---

### 3. Frontend Deployment on Vercel

The React frontend is optimized for static serving and SPA client routing via [client/vercel.json](file:///home/siddarthsbalaji/Projects/Second%20Brain/client/vercel.json).

1. Log into [Vercel Dashboard](https://vercel.com/) and click **Add New → Project**.
2. Import the `second-brain` repository.
3. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select **`client`** *(Crucial: do not leave as root)*
   - **Build Command:** `npm run build` *(defaults to `tsc -b && vite build`)*
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-name.onrender.com` | Backend URL (**No trailing slash**) |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN`| `secondbrain-c2930.firebaseapp.com` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | `secondbrain-c2930` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `secondbrain-c2930.firebasestorage.app` | Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1053372847932` | Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:1053372847932:web:...` | Web App ID |

5. Click **Deploy**. Vercel will build the frontend bundle and publish to `https://second-brain-ten-ruddy.vercel.app`.

---

### 4. Deployment Verification & Gotchas

> [!IMPORTANT]
> ### Crucial Checklist for Seamless Deployment:
> 1. **Vite Inlines Environment Variables at Build Time:**
>    If you update any `VITE_*` variable in the Vercel dashboard, you **must trigger a new deployment** (Go to *Deployments → ... → Redeploy*) for the changes to take effect in the JavaScript bundle.
> 2. **CORS Headers (`FRONTEND_ORIGINS`):**
>    The backend server will reject browser requests with a `CORS error` if your exact Vercel URL (e.g., `https://second-brain-ten-ruddy.vercel.app`) is missing from `FRONTEND_ORIGINS` on Render.
> 3. **Firebase Authorized Domains:**
>    If users encounter `auth/unauthorized-domain` during Google sign-in, ensure the Vercel domain is added in **Firebase Console → Authentication → Settings → Authorized domains**.
> 4. **Private Key Newlines on Render:**
>    When entering `FIREBASE_PRIVATE_KEY` on Render, ensure literal newlines (`\n`) are preserved or enclosed in double quotes. The backend automatically normalizes `\n` to actual line breaks upon initialization.

---

## 🔐 Environment Variables Reference

### Client Variables (`client/.env`)
```env
# Backend API Base URL
VITE_API_URL=https://your-backend-api.onrender.com

# Firebase Client Web SDK
VITE_FIREBASE_API_KEY=AIzaSyBZNZG0BWFJUX7cOm-0-SuZtK3scBEzv80
VITE_FIREBASE_AUTH_DOMAIN=secondbrain-c2930.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=secondbrain-c2930
VITE_FIREBASE_STORAGE_BUCKET=secondbrain-c2930.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1053372847932
VITE_FIREBASE_APP_ID=1:1053372847932:web:42ab87e28cc82b528bf039
```

### Server Variables (`server/.env`)
```env
# Server & Security
NODE_ENV=production
PORT=5000
JWT_SECRET=super_secret_second_brain_jwt_token_must_be_at_least_32_chars_long
FRONTEND_ORIGINS=https://second-brain-ten-ruddy.vercel.app,http://localhost:5173

# Firebase Admin SDK
FIREBASE_PROJECT_ID=secondbrain-c2930
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@secondbrain-c2930.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=secondbrain-c2930.firebasestorage.app
```

---

## 💻 Local Development

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v9.x` or higher
- Optional: **Docker & Docker Compose**

### Running Locally

Clone the repository:
```bash
git clone https://github.com/siddarthsbalaji/second-brain.git
cd second-brain
```

#### 1. Start the Backend API:
```bash
cd server
npm install
npm run dev
# Running on http://localhost:5000
```

#### 2. Start the Frontend Client:
In a separate terminal:
```bash
cd client
npm install
npm run dev
# Running on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

### Running with Docker Compose

You can spin up the full multi-container stack with a single command:

```bash
docker compose up --build
```

- **Frontend Application:** `http://localhost:80`
- **Backend API:** `http://localhost:5000`

---

## 📂 Repository Structure

```text
second-brain/
├── client/                               # Frontend React SPA
│   ├── public/                           # Static public assets & icons
│   ├── src/
│   │   ├── api/                          # Axios API configuration
│   │   ├── auth/                         # AuthProvider, useAuth & Google auth context
│   │   ├── components/                   # UI components (Header, ThemeToggle, Modals)
│   │   │   ├── auth/                     # Username onboarding prompt
│   │   │   ├── calendar/                 # Calendar event modal & views
│   │   │   ├── notes/                    # TipTap, CodeMirror, WikiContent, TagEditor
│   │   │   ├── plugins/                  # Plugin Manager modal & UI slots
│   │   │   └── tasks/                    # Task lists, task items, new task forms
│   │   ├── context/                      # PluginContext, ThemeContext
│   │   ├── data/                         # Lumen quotes, trivia & paradox datasets
│   │   ├── hooks/                        # Custom hooks (useConfetti, useLocalStorage)
│   │   ├── lib/                          # API clients (notesApi, tasksApi, eventsApi)
│   │   ├── pages/                        # Page views
│   │   │   ├── notes/                    # NotesLayout, NoteEditPage, NoteNewPage, Graph
│   │   │   ├── CalendarPage.tsx          # Calendar agenda & month view
│   │   │   ├── HabitsPage.tsx            # Habit tracker & streaks
│   │   │   ├── HomePage.tsx              # Dashboard overview
│   │   │   ├── JournalPage.tsx           # Daily journaling interface
│   │   │   ├── LoginPage.tsx             # Google GIS authentication screen
│   │   │   ├── LumenPage.tsx             # Inspiration & trivia feed
│   │   │   └── TasksPage.tsx             # Multi-list task management & kanban
│   │   ├── plugins/                      # Modular plugin definitions
│   │   │   ├── kanban/                   # Kanban board & card drawer
│   │   │   └── pomodoro/                 # Floating Pomodoro timer widget
│   │   └── types/                        # TypeScript domain types & interfaces
│   ├── Dockerfile                        # Multi-stage production Nginx container
│   ├── nginx.conf                        # Nginx SPA fallback routing configuration
│   ├── vercel.json                       # Vercel SPA rewrites config
│   ├── vite.config.ts                    # Vite configuration
│   └── package.json
│
├── server/                               # Backend Express REST API
│   ├── src/
│   │   ├── domain/                       # Business logic & Firestore row converters
│   │   │   ├── NoteService.ts            # Note slug generation & wiki-link sync
│   │   │   └── noteRow.ts, taskRow.ts... # Domain models
│   │   ├── middleware/                   # Express middleware
│   │   │   ├── auth.ts                   # Firebase Admin token verification
│   │   │   ├── errorHandler.ts           # Centralized JSON error responder
│   │   │   └── validate.ts               # Zod validation schema runner
│   │   ├── routes/                       # Express route controllers
│   │   │   ├── auth.ts                   # /api/auth (sync, profile, username)
│   │   │   ├── notes.ts                  # /api/notes (CRUD, backlinks, tags, graph)
│   │   │   ├── tasks.ts                  # /api/tasks (tasks, lists, subtasks)
│   │   │   ├── habits.ts                 # /api/habits (habits & completions)
│   │   │   ├── calendar.ts               # /api/calendar (events & recurring rules)
│   │   │   ├── journal.ts                # /api/journal (daily reflection entries)
│   │   │   └── attachments.ts            # /api/attachments (Cloud storage uploads)
│   │   ├── db.ts                         # Firestore instance export
│   │   ├── lib/firebase.ts               # Firebase Admin SDK initialization
│   │   └── index.ts                      # Express application entry & CORS setup
│   ├── Dockerfile                        # Node 20 Alpine server container
│   ├── tsconfig.json                     # TypeScript compiler configuration
│   └── package.json
│
├── docker-compose.yml                    # Local multi-container development orchestration
└── README.md                             # Comprehensive project documentation
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by Siddarth Balaji · Finalized & Retired September 2026</sub>
</div>
