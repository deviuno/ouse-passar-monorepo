# 🧠 Study System & Algorithms

## 1. Study Modes

### A. Zen Mode
*   **Focus:** Learning.
*   **Behavior:** Unlimited time. Immediate feedback (Green/Red). Full explanation shown immediately after answering.

### B. Simulado (Hard Mode)
*   **Focus:** Testing.
*   **Behavior:**
    *   Timer counts down.
    *   **NO** immediate feedback (blind answering).
    *   Results are only shown at the end in `SimuladoSummary`.
    *   User can configure duration (15min - 4 hours).

### C. Reta Final
*   **Focus:** High-yield review.
*   **Behavior:** Similar to Zen, but visual cues emphasize "High Frequency" topics.

### D. Pegadinhas (Traps)
*   **Focus:** Awareness.
*   **Filter:** Only questions with `isPegadinha = true`.
*   **Feature:** A special "Alerta de Pegadinha" button appears inside the feedback box to explain the specific trap used by the board.

## 2. Smart Review System (SRS)
The app implements a simplified Spaced Repetition System algorithm to schedule reviews.

### The Algorithm (`handleRateDifficulty` in `App.tsx`)
When a user answers or rates a question, the `Next Review Date` is calculated:

1.  **Error (Wrong Answer):**
    *   Interval: **0 Days (Immediate)**.
    *   *Logic:* Must review ASAP.
2.  **Hard:**
    *   Interval: **0 Days (Immediate/Next Session)**.
3.  **Medium:**
    *   Interval: **3 Days**.
4.  **Easy:**
    *   Interval: **7 Days**.

### Dashboard Integration
*   The Dashboard checks `reviews` array.
*   If `nextReviewDate <= Date.now()`, a **"Revisão Inteligente"** card appears.
*   Clicking it starts a session containing *only* the due questions.
