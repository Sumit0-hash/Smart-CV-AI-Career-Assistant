# AI Mock Interview Backend (Express + TypeScript)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Start MongoDB locally (or use Atlas URI in `.env`).
4. Run development server:
   ```bash
   npm run dev
   ```

Server runs at `http://localhost:5001` by default.

## API Routes

- `POST /api/mock-interviews/sessions`
  - Creates interview session and generates 7 Gemini questions.
- `POST /api/mock-interviews/sessions/:sessionId/questions/:questionId/answer`
  - Accepts `multipart/form-data` with `audio` blob.
  - Transcribes using AssemblyAI and evaluates with Gemini.
- `POST /api/mock-interviews/sessions/:sessionId/finalize`
  - Produces final score + overall feedback.
- `GET /api/mock-interviews/sessions`
  - Lists latest sessions.
- `GET /api/mock-interviews/sessions/:sessionId`
  - Retrieves one session.

## Notes

- AssemblyAI integration is implemented in `src/services/assemblyAiService.ts`.
- Gemini integration and prompt orchestration are in `src/services/geminiService.ts` and `src/prompts/geminiPrompts.ts`.
- Graceful fallback is implemented when external APIs fail.
