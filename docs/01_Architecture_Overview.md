# 🏛️ Architecture Overview - Ouse Passar

## 1. Project Summary
**Ouse Passar** is a mobile-first, gamified educational platform for competitive exam preparation (Concursos Públicos) in Brazil. It combines standard quiz functionality with advanced AI features (Gemini), social elements (PvP, Ranking), and adaptive learning (SRS).

## 2. Tech Stack (Current - MVP)
*   **Frontend:** React 19 (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **AI Provider:** Google Gemini SDK (`@google/genai`)
*   **State Management:** React `useState` + `localStorage` (Persistence)
*   **Routing:** Conditional Rendering (SPA) in `App.tsx`

## 3. Directory Structure
```
/
├── src/
│   ├── components/       # UI Components (Views and Widgets)
│   │   ├── Dashboard.tsx # Main Hub
│   │   ├── QuestionCard.tsx # Core Logic for solving questions
│   │   └── ...
│   ├── services/         # External Integrations
│   │   └── geminiService.ts # AI Prompts and API calls
│   ├── types.ts          # TypeScript Interfaces (Data Models)
│   ├── constants.ts      # Mock Data & Configuration
│   └── App.tsx           # Main Controller & Router
├── docs/                 # Project Documentation
└── ...config files
```

## 4. Key Architectural Concepts

### A. View-Based Routing
Currently, the app does not use `react-router-dom`. Instead, it uses a state variable `currentView` in `App.tsx` to render components conditionally.
*   *Pros:* Simple for MVP, keeps state in memory easily.
*   *Cons:* No browser history/URL routing.
*   *Future:* Migrate to Next.js or React Router.

### B. "Fake" Persistence
All user data (XP, Owned Courses, Answer History) is stored in the browser's `localStorage`.
*   **Key Keys:** `ousepassar_stats`, `ousepassar_history`, `ousepassar_reviews`.
*   **Risk:** Data is lost if cache is cleared. Needs backend migration immediately.

### C. AI-First Design
The app is designed to fail gracefully if AI is offline, but relies on it for:
1.  **Tutor:** Explaining concepts.
2.  **Fallback Explanations:** If a question has no human comment, AI generates one.
3.  **Content Generation:** Flashcards from errors.
4.  **Correction:** Essay grading.
