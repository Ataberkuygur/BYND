BYND Backend
=============

Dev
----
Install deps then run dev server with live reload.

    npm install
    npm run dev

Build & start production bundle:

    npm run build
    npm start

Environment (.env)
------------------
See `.env.example`. For local non-AI testing you can set OPENAI_API_KEY=dummy to enable deterministic stub logic.

Key Endpoints
-------------

Auth
 - POST /auth/register { email, password }
 - POST /auth/login { email, password }
 - GET  /auth/me (Bearer token)

Tasks (Bearer token)
 - GET  /tasks
 - POST /tasks { title, description?, dueAt? }
 - PATCH /tasks/:id { title?, description?, dueAt?, completedAt? }
 - DELETE /tasks/:id

AI (Bearer token)
 - POST /ai/interpret { utterance }
 - POST /ai/future-self { message }

Voice (text sim) (Bearer token)
 - POST /voice/transcribe-and-reply { text }

Calendar (in-memory or Supabase) (Bearer token)
 - POST /calendar/schedule { title, start, end?, description? }
 - GET  /calendar/events

Health
 - GET /health

Persistence
-----------
If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined, users, tasks, and calendar events persist to Supabase. Otherwise in-memory fallbacks are used.

Logging
-------
Pino pretty logs in dev. Errors routed through central error handler middleware.
