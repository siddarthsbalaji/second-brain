# Second Brain — Client Application 💻

Frontend Single Page Application (SPA) for Second Brain, built with React 19, Vite, TypeScript, and Tailwind CSS.

## 🚀 Features & Architecture

- **Auth:** Google Identity Services (GIS) Sign-In with automatic account provisioning and username setup modal.
- **Plugins:** Modular plugin system supporting header slots, floating widgets, and settings panels (Web Clipper, Kanban Board, Pomodoro Timer).
- **Inspiration:** Lumen daily sparks, facts, and trivia cards with direct note saving.
- **Editor:** WYSIWYG editing via TipTap and raw Markdown mode with CodeMirror 6.
- **Knowledge Graph:** Interactive force-directed 2D relationship graph.
- **State Management:** TanStack React Query v5 for server state caching and optimistic updates.

## 🛠️ Development Scripts

```bash
# Install dependencies
npm install

# Start Vite development server (http://localhost:5173)
npm run dev

# Typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint

# Run Playwright End-to-End tests
npm run test:e2e
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```env
# URL to your backend Express server
VITE_API_URL=http://localhost:5000

# Google OAuth 2.0 Web Client ID from Google Cloud Console
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

> For the complete project documentation, system diagrams, and backend setup, see the root [README.md](../README.md).
