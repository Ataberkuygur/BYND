# Project Task Backlog (Prioritized)

Legend: P0 = Critical, P1 = High, P2 = Medium, P3 = Future / Nice-to-have

---
## P0 – Stability / Security / Core
- [ ] Fix backend start failure: ensure `npm install`, valid `.env` (set `OPENAI_API_KEY=dummy` for stub, strong `JWT_SECRET`).
- [x] Add dedicated rate limiter & brute force protection on auth routes (basic limiter applied; fine-grained brute force detection TBD).
- [x] Enforce password complexity & validate email (zod) with normalized lowercase; duplicate guard (race handled by unique catch).
- [x] Add zod validation schemas for request bodies (auth, tasks, AI, calendar, voice).
- [x] Standardize error responses: `{ code, message }`.
- [x] Strengthen security headers (helmet CSP baseline, disable x-powered-by).
- [x] Explicit JWT jti tracking & blacklist (in-memory; clock skew handling minimal TODO).
- [x] Implement logout / revoke refresh token endpoint.
- [x] Detect refresh token reuse & invalidate family.
- [x] Store refresh tokens hashed (bcrypt) instead of plaintext.

## P0 – Testing
- [ ] Add `NODE_ENV=test` config path with in-memory adapters.
- [ ] Unit tests: userService, taskService, tokenService (success, failure, edge).
- [ ] Integration tests: auth + refresh flow, tasks CRUD, AI interpret (dummy mode), calendar events.
- [ ] Coverage thresholds (branches/statements >= 80%).
- [ ] GitHub Actions CI: install → lint → build → test → coverage artifact.

## P0 – Mobile Critical
- [x] Update mobile auth to store `accessToken` + `refreshToken` & expiry.
- [x] Axios client module with interceptor to refresh on 401 (one-flight lock & queue retries).
- [x] Replace direct `API_BASE` centralization (override hook remains; app.config.js optional TODO for env-based build variants).
- [ ] Unified error toast / banner component.

---
## P1 – Observability & Monitoring
- [ ] Request logging middleware w/ correlation ID (`x-request-id`).
- [ ] Audit logs for auth events (login, refresh, revoke, failure).
- [ ] Prometheus metrics: request count, latency histogram, error counts, refresh token rotations.
- [ ] `/metrics` endpoint (protected or separate port) + health (`/health`) vs readiness (`/readiness`).

## P1 – Data & Persistence
- [ ] Introduce migration tool (Supabase CLI or drizzle) to replace single SQL file.
- [ ] Add indexes: tasks (`user_id, created_at DESC` already partial), (`user_id, completed_at`), calendar_events (`user_id, start DESC`).
- [ ] Row Level Security (RLS) & policies for Supabase tables (users, tasks, calendar_events, refresh_tokens).
- [ ] Abstract persistence layer interfaces for easier swapping / mocking.

## P1 – Security Hardening
- [ ] Hash refresh tokens (already planned P0) & implement rotation family table (parent token id).
- [ ] Input key allowlist / schema stripping to prevent mass assignment.
- [ ] Content Security Policy & HSTS (when deployed behind HTTPS).
- [ ] Dependency vulnerability scanning (npm audit, Dependabot, or Snyk) integrated into CI.

## P1 – Performance / Scalability
- [ ] Pagination & limit parameters for `/tasks` & `/calendar/events` (cursor-based preferred).
- [ ] Lightweight caching for frequent read paths (user lookup by id) with TTL.
- [ ] Evaluate connection pooling / reuse for Supabase (ensure singleton client reuse is effective).
- [ ] Stress test (k6 or autocannon) baseline RPS & latency.

## P1 – Developer Experience
- [ ] ESLint + Prettier consistent formatting (add Prettier config) & `lint:fix` script.
- [ ] Husky pre-commit hook: lint staged + tests (fast subset) + typecheck.
- [ ] Dockerfile (multi-stage) + docker-compose (api + ephemeral Postgres/Supabase equivalent).
- [ ] Makefile or npm scripts alias (dev, test, lint, ci, migrate, seed).
- [ ] Add seed script for demo users/tasks.

---
## P2 – Features
- [ ] Task search / filter (status, due range, source).
- [ ] Subtasks / checklist model & API.
- [ ] User profile (name, goals, values) CRUD endpoints.
- [ ] AI: summarize tasks endpoint (dummy fallback when OPENAI_API_KEY=dummy).
- [ ] Natural language → calendar scheduling (reuse interpret pipeline to create events).
- [ ] True voice integration (modular provider for STT / TTS) with feature flag.

## P2 – Mobile UX
- [ ] Pull-to-refresh & manual sync indicator.
- [ ] Offline queue (persist actions, replay on reconnect) with conflict resolution.
- [ ] Dark / light theme toggle + system preference.
- [ ] Improved task item interactions (swipe actions, inline edit).

## P2 – Accessibility & i18n
- [ ] Introduce i18n library (e.g., `i18next`) & extract strings.
- [ ] Screen reader labels, accessible touch targets, dynamic font scaling.
- [ ] Color contrast audit.

## P2 – Analytics / Product
- [ ] Event instrumentation (auth events, task create/complete) behind privacy flag.
- [ ] Feature flag system (simple env-based map, later remote config).
- [ ] Basic funnel dashboard (scripts or hosted tool hooking events).

---
## P3 – Advanced / Future
- [ ] Domain-driven module boundaries (auth, tasks, calendar, ai) with explicit application services.
- [ ] Optional GraphQL or tRPC gateway (if multiple clients / web app grow).
- [ ] Background job queue for long AI tasks (BullMQ) & delayed reminders.
- [ ] Push notifications (Expo push / FCM) for due tasks & calendar events.
- [ ] SLA / SLO definition & synthetic uptime monitoring.
- [ ] Secrets management integration (Vault / cloud KMS) removing raw .env in prod.

---
## Documentation
- [ ] Architecture overview diagram (request flow, auth refresh sequence).
- [ ] Auth refresh token lifecycle diagram.
- [ ] Expanded backend README sections: security model, rate limiting, error format.
- [ ] Mobile README: environment config, device testing, release build steps.
- [ ] CONTRIBUTING.md & CODE_OF_CONDUCT.md.

## Cleanup / Refactors
- [ ] Use date-fns for parsing / formatting dates & relative times.
- [ ] Error class hierarchy (AppError with code, status) & mapper.
- [ ] Deduplicate AI future-self logic between routes (single controller).
- [ ] Introduce DTO layer separating persistence models from API responses.

---
## Immediate Execution Order (Suggested)
1. Validation & security hardening (schemas, rate limits, password rules).
2. Mobile token refresh integration + central API client.
3. Comprehensive tests & CI pipeline.
4. Pagination + observability (logging, metrics).
5. Dockerization & migration tooling.
6. Profile & AI enhancements.
7. Offline support & performance tuning.
8. Remaining feature & advanced backlog.

---
Generated: 2025-08-08
