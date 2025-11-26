# 🎮 Gamification & PvP Logic

## 1. Economy & Progression
*   **XP (Experience):**
    *   Correct Answer (Zen/Study): +50 XP.
    *   Simulado Finish: +100 XP per correct answer + Bonus.
    *   PvP Win: +200 XP.
*   **Coins (OuseCoins):**
    *   Correct Answer: +10 Coins.
    *   PvP Win: +50 Coins.
    *   **Use:** Buying Avatars, Themes, and Streak Freezes in `StoreView`.
*   **Streak (Ofensiva):**
    *   Incremented when at least one question is answered in a 24h window (currently logic is simplified for MVP).

## 2. League System
*   **Tiers:** Ferro -> Bronze -> Prata -> Ouro -> Diamante.
*   **Logic:**
    *   Weekly leaderboard (simulated in `MOCK_RANKING_DATA`).
    *   Top 3 promote, Bottom 3 demote.
    *   Visuals: Up/Down arrows in `RankingView`.

## 3. PvP Battle Mode (Simulated Multiplayer)
Since there is no WebSocket backend yet, the PvP is a **Client-Side Simulation**.

### How it works (`PvPGameView.tsx`):
1.  **Lobby:** User selects Time (15-60s) and Question Count (5-20).
2.  **Matchmaking:**
    *   `setTimeout` simulates "Finding Opponent...".
    *   Picks a random user from `MOCK_LEAGUE`.
3.  **Game Loop:**
    *   **User:** Answers by clicking.
    *   **Bot (Opponent):**
        *   Calculates a random delay based on the question time (e.g., between 20% and 80% of timer).
        *   Decides correctness based on a probability roll (e.g., 70% chance to be correct).
    *   **Sync:** The UI updates progress bars in "real-time" as the bot "answers".
4.  **Result:** Compares scores. Offers "Rematch" (shuffles questions).

### Implementation Note for Backend:
To make this real, you need:
*   WebSockets (Socket.io / Supabase Realtime).
*   Matchmaking Queue (Redis).
*   Server-side validation of answers.
