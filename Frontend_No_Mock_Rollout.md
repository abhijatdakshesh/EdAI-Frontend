# Frontend No-Mock Rollout (All Phases)

This document is the execution checklist to run `rv-trust-frontend` fully against backend services (no frontend mock data) across all phases.

## Global Switches

- Web: set `apps/web/.env.local`
  - `NEXT_PUBLIC_USE_MOCKS=false`
  - `NEXT_PUBLIC_API_BASE_URL=<gateway-or-service-base>`
  - `IDENTITY_SERVICE_URL=<identity-service-base>`
  - `AUTH_SECRET=<secure-random>`
- Mobile: run with backend base URL
  - `flutter run --dart-define=API_BASE_URL=<backend-base>`

## Phase 0-1: Foundation + Identity

### Required backend endpoints
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Frontend checks
- Web login succeeds with real credentials.
- Role from backend controls visible modules.
- Expired access token refreshes silently.
- Logout clears session and blocks protected routes.

## Phase 2: Attendance + Voice

### Web endpoints
- `GET /attendance/dashboard`
- `POST /attendance/mark`
- `POST /attendance/mark/bulk`
- `GET /voice/dashboard`
- `POST /voice/escalate`

### Mobile endpoints (minimum)
- Attendance list/summary endpoint(s)
- Voice call history endpoint(s)

### Acceptance
- Attendance tables/charts load from API only.
- Voice queue/transcript/escalation actions persist to backend.
- Polling interval works for live updates.

## Phase 3: Communications (Timeline + Notifications)

### Endpoints
- `GET /timeline/dashboard`
- `POST /timeline/ack`
- `POST /timeline/pin`
- `GET /notifications/dashboard`
- `POST /notifications/retry`
- `POST /notifications/send`

### Acceptance
- Timeline filters (`all`, `pinned`, `unacknowledged`) map to API data.
- Notification campaign status and action transitions are backend-driven.

## Phase 4: Assignments + Academics (Marks)

### Endpoints
- `GET /assignments/dashboard`
- `POST /assignments/remind`
- `GET /marks/dashboard`
- `POST /marks/verify`

### Acceptance
- Assignment completion and overdue counts match backend.
- Marks verification decrements pending values from backend state.

## Phase 5: Chatbot + Parent Engagement

### Endpoints
- `GET /chatbot/dashboard`
- `POST /chatbot/sessions/resolve`
- (optional) chatbot session list/history endpoints for deeper views

### Acceptance
- Active/escalated sessions are real.
- Resolve actions update backend and UI.

## Phase 6: Financial Intelligence

### Endpoints
- `GET /fees/dashboard`
- `POST /fees/collect`

### Acceptance
- Invoice rows, totals, overdue count come from backend.
- Collect actions produce real transaction state changes.

## Phase 7: Behavioral + Command Center Inputs

### Endpoints
- `GET /behavior/dashboard`
- `POST /behavior/incidents/status`
- `GET /students/risk-dashboard`
- `POST /students/interventions`

### Acceptance
- Incident severity/status transitions persist.
- Student risk scores/factors come from analytics backend outputs.

## Phase 8: Command Center + Integrations + Compliance

### Endpoints
- `GET /analytics/dashboard`
- `GET /compliance/dashboard`
- `POST /compliance/evidence/status`
- `POST /compliance/report/generate`
- `GET /integrations/dashboard`
- `POST /integrations/connectors/retry`
- `POST /integrations/connectors/sync`

### Acceptance
- Dashboard KPIs use live backend aggregates.
- Compliance and integrations actions are fully backend-persistent.

## Cross-Phase Non-Negotiables

- Unified error envelope from backend (frontend parser depends on this).
- Pagination and filtering for list-heavy endpoints.
- Stable date format (ISO-8601) and currency unit contract.
- CORS config with explicit origins (no wildcard in staging/prod).
- Single frontend API base via gateway/reverse proxy preferred.

## Validation Matrix (Run Before Declaring No-Mock Complete)

- [ ] `NEXT_PUBLIC_USE_MOCKS=false` set in web env.
- [ ] No repository path returns mock objects in runtime.
- [ ] Web: all routes load without mock fallback.
- [ ] Mobile: all implemented feature repositories hit backend.
- [ ] Auth refresh flow tested with expired access token.
- [ ] Role-based access tested for ADMIN/FACULTY/STUDENT/PARENT.
- [ ] 401/403/404/422 errors render correctly in UI.
- [ ] Smoke test for all phase modules passes.

## Current Practical Note

If a backend endpoint is still missing for a module, keep that module behind a temporary feature flag and do not re-enable mock responses globally. This avoids mixed truth sources in production-like environments.

