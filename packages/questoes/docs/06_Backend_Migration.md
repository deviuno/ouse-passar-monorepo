# 🚀 Backend Migration Roadmap

To move from "MVP" to "Production", follow these steps.

## 1. Database Selection
Recommended: **Supabase** (PostgreSQL) or **Firebase**.
*   *Why Supabase?* Relational data suits the Question/Course structure well. Built-in Auth and Row Level Security (RLS).

## 2. API Endpoints Required

### Auth
*   `POST /auth/signup`
*   `POST /auth/login`
*   `GET /auth/me`

### Content
*   `GET /courses` (Public + Owned status)
*   `GET /courses/:id/questions` (Paginated)
*   `GET /questions/:id/comments`

### User Progress (Crucial)
*   `POST /history` (Record an answer)
    *   *Payload:* `{ questionId, selectedLetter, timeTaken }`
    *   *Server Action:* Update XP, Streak, and SRS Interval in one transaction.
*   `GET /history/stats` (Get XP, Level, Coins)
*   `GET /reviews` (Get due questions for SRS)

### Features
*   `POST /ai/chat` (Proxy for Gemini to hide API Key)
*   `POST /ai/essay` (Proxy for Gemini)
*   `GET /leaderboard` (Calculated via SQL View)

## 3. Migration Steps
1.  **Setup DB:** Create tables based on `docs/02_Data_Models.md`.
2.  **Middleware:** Create a Node.js/Python proxy to hold the `GOOGLE_API_KEY`. **Never** keep the key in the frontend code for production.
3.  **Replace Hooks:**
    *   Replace `localStorage.getItem` with `useQuery` (React Query).
    *   Replace `localStorage.setItem` with `useMutation`.
4.  **Real PvP:**
    *   Implement a WebSocket server.
    *   Replace `PvPGameView.tsx` logic to listen for socket events (`match_found`, `opponent_moved`, `game_over`).
