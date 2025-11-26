# 🤖 AI Integration Guide (Google Gemini)

The application heavily relies on `@google/genai` (Gemini 2.5 Flash) for dynamic content. This abstraction layer is located in `src/services/geminiService.ts`.

## 1. Tutor Contextual (Contextual Chat)
**Function:** `chatWithTutor`
*   **Trigger:** "Tirar Dúvida" button on a question.
*   **System Instruction:**
    The AI acts as a friendly expert tutor. It receives the **full context** of the current question (Enunciation, Alternatives, Correct Answer, Board) hidden from the user.
*   **Behavior:**
    *   It does not give the answer immediately if not asked.
    *   It explains *why* the user might be wrong without judging.
    *   It uses the specific context of the "Banca" (Exam Board) style.

## 2. Fallback Explanation
**Function:** `generateExplanation`
*   **Trigger:** When a user submits an answer and `question.comentario` is `null` or empty.
*   **Prompt Strategy:**
    "Explain didactically why option {X} is correct for the following question... Focus on the reasoning."
*   **Value:** Ensures 100% of questions have explanations, even if the database is incomplete.

## 3. Smart Flashcards
**Function:** `generateFlashcards`
*   **Trigger:** "Gerar Flashcards" button in "Caderno de Erros".
*   **Logic:**
    1.  Takes a list of questions the user answered incorrectly.
    2.  Sends them to Gemini.
    3.  **Output Constraint:** Requires a strict JSON array response `[{ "front": "...", "back": "..." }]`.
*   **Goal:** Summarize a complex question into a single atomic concept.

## 4. Essay Correction (Simulador de Redação)
**Function:** `analyzeEssay`
*   **Trigger:** "Corrigir Redação" button.
*   **Prompt Strategy:**
    Acts as an official "Cebraspe" corrector. It analyzes the user's text against the provided topic.
*   **Output JSON Schema:**
    ```json
    {
      "score": number,
      "competencies": {
        "grammar": { "score": number, "feedback": string },
        "structure": { "score": number, "feedback": string },
        "content": { "score": number, "feedback": string }
      },
      "improvedParagraph": string
    }
    ```
*   **Feature:** It actually rewrites the worst paragraph to show the user how to improve.

## 5. Audio (Speech-to-Text)
*   **Implementation:** Uses the browser's native `webkitSpeechRecognition` API (not Gemini Audio, though Gemini handles the *text response*).
*   **Flow:** User speaks -> Browser transcribes to Text -> Text sent to Gemini -> Gemini replies with Text.
