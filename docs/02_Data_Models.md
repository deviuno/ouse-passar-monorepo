# 💾 Data Models & Database Schema

This document outlines the data structures currently used in TypeScript interfaces (`types.ts`) and how they should map to a relational database (e.g., PostgreSQL/Supabase).

## 1. User (Stats & Profile)
*Current Storage: `localStorage` (JSON)*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique User ID. |
| `xp` | Integer | Experience points for ranking. |
| `coins` | Integer | Virtual currency for store. |
| `streak` | Integer | Consecutive days studied. |
| `level` | Integer | Calculated based on XP. |
| `avatarId` | String | ID of the equipped avatar item. |
| `leagueTier` | Enum | Ferro, Bronze, Prata, Ouro, Diamante. |

## 2. Courses (Preparatórios)
*Current Storage: `constants.ts` (Static)*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | e.g., 'pf-agente'. |
| `title` | String | e.g., 'Polícia Federal'. |
| `subtitle` | String | Role/Focus. |
| `image` | String (URL) | Cover image. |
| `price` | Decimal | Cost in R$ (if not owned). |

**Relationship:** `User_Courses` (Many-to-Many) table tracking which users own which courses.

## 3. Questions (Questões)
*Current Storage: `constants.ts` (Static Mock)*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Legacy ID. |
| `enunciado` | Text | The question text. |
| `materia` | String | Subject (e.g., Português). |
| `assunto` | String | Topic (e.g., Crase). |
| `banca` | String | Exam Board (e.g., CEBRASPE). |
| `gabarito` | Char(1) | Correct Option (A-E). |
| `alternativas` | JSON | Array of `{letter, text}`. |
| `comentario` | Text | Human explanation (nullable). |
| `isPegadinha` | Boolean | Flag for "Trap" questions. |
| `explicacaoPegadinha`| Text | Specific explanation for the trap. |

## 4. User History (Answers)
*Current Storage: `globalAnswers` State*

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | UUID (FK) | Link to user. |
| `questionId` | Int (FK) | Link to question. |
| `selectedLetter` | Char(1) | What user chose. |
| `isCorrect` | Boolean | Derived status. |
| `timestamp` | DateTime | When it was answered. |

## 5. Spaced Repetition (Reviews)
*Current Storage: `reviews` State*

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | UUID (FK) | Link to user. |
| `questionId` | Int (FK) | Link to question. |
| `nextReviewDate` | Timestamp | When it should be shown again. |
| `lastDifficulty` | Enum | 'easy', 'medium', 'hard', 'error'. |
| `interval` | Integer | Days added since last review. |

## 6. Flashcards
*Current Storage: `flashcards` State*

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique ID. |
| `userId` | UUID (FK) | Owner. |
| `questionId` | Int (FK) | Source question. |
| `front` | Text | Concept/Question. |
| `back` | Text | Explanation/Answer. |
| `masteryLevel` | Enum | 'new', 'learning', 'mastered'. |
