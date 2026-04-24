# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

EdAI Frontend — pnpm monorepo with a Next.js 14 web portal (faculty/admin/student/parent) and a Flutter mobile app (parent/student). Connects to EdAI-Backend identity service on port 3001.

---

## Workspace Structure

```
apps/
  web/        # Next.js 14 — all browser portals
  mobile/     # Flutter 3.4 — parent + student mobile
packages/
  shared-types/   # TypeScript types shared with backend
  api-client/     # Generated OpenAPI client
```

---

## Commands

### Web (Next.js)

```bash
pnpm --filter @rv/web dev       # Dev server (localhost:3000)
pnpm --filter @rv/web build     # Production build
pnpm --filter @rv/web lint      # ESLint

# Or from apps/web/:
cd apps/web && pnpm dev
```

### Mobile (Flutter)

```bash
cd apps/mobile
flutter pub get
flutter run                 # Run on connected device/emulator
flutter analyze             # Lint
flutter test                # Unit tests
```

### Workspace-wide

```bash
pnpm install                # Install all deps
pnpm dev:web                # Alias for web dev server
pnpm build:web
pnpm lint:web
```

---

## Web App Architecture

### Auth Flow

1. User hits `/login` → NextAuth Credentials provider
2. NextAuth calls `POST /api/auth/login` on identity service (port 3001, server-side via `IDENTITY_SERVICE_URL`)
3. Access + refresh tokens stored in encrypted httpOnly session cookie
4. JWT callback silently refreshes 30s before expiry
5. `apiFetch` wrapper handles 401 → refresh → retry automatically

### Request Pattern

All API calls go through `src/lib/api/client.ts` (`apiFetch`). 15 domain modules in `src/lib/api/` (attendance, marks, fees, analytics, etc.). Never call `fetch` directly — always use the module functions.

### Routing & Portals

Next.js App Router. Role-based access enforced in `middleware.ts`. Four portals:
- `/admin/*` — Admin/Trust
- `/teacher/*` — Faculty, HOD, Dean
- `/student/*` — Student
- `/parent/*` — Parent

`AppShell` component wraps all authenticated pages with role-gated sidebar nav.

### Real-time

`RealtimeProvider` (Socket.IO client, `src/providers/realtime-provider.tsx`) wraps the app. Connect to `NEXT_PUBLIC_SOCKET_URL` (falls back to `NEXT_PUBLIC_API_BASE_URL`). Used for live attendance, marks updates, announcements.

### State

- **Server state:** React Query (TanStack Query v5) — all API data
- **UI state:** Zustand — local UI only
- **No Redux, no Context for data**

---

## Mobile App Architecture (Flutter)

- **State:** Riverpod `AsyncNotifier` for auth; feature-level providers per module
- **Navigation:** GoRouter with role-based redirect on auth state change
- **API:** Dio with auth interceptor — handles token refresh on 401 transparently
- **Storage:** `flutter_secure_storage` for tokens; `SharedPreferences` for non-sensitive prefs
- **17 feature modules:** auth, attendance, marks, fees, profile, voice, timeline, etc.

---

## Key Environment Variables (Web)

```bash
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
IDENTITY_SERVICE_URL=http://localhost:3001      # Server-side only (not NEXT_PUBLIC)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001  # Client-side
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001    # Optional; falls back to API_BASE_URL
NEXT_PUBLIC_USE_MOCKS=false                     # Set true to bypass backend in dev
```

**Dev test credentials (when identity service offline):**
- `admin@rvce.edu / Admin@123`
- `teacher@rvce.edu / Teacher@123`
- `student@rvce.edu / Student@123`
- `parent@rvce.edu / Parent@123`

---

## Design System

- **Tailwind CSS** with custom cream/espresso palette (see `tailwind.config.ts`)
- **shadcn/ui** components in `src/components/ui/` — extend here, don't override
- **Fonts:** Inter (body), Cormorant Garamond (display), JetBrains Mono (code)
- **Icons:** Lucide React only

---

## Expert Panel

Agents at `~/.claude/agents/` — global across both repos. Pre-push hook triggers all 6.

| Invoke | Role | Blocks push |
|--------|------|-------------|
| `/daniel` | Code reviewer | BLOCK verdict |
| `/dev` | FAANG architect | REDESIGN REQUIRED |
| `/qa` (Priya) | QA, 100% coverage | FIX TESTS FIRST |
| `/kaveri` | College Chairman (buyer) | Advisory |
| `/sujit` | McKinsey ERP | Advisory |
| `/anand` | VC investor | Advisory |

Wire hooks after clone: `git config core.hooksPath .githooks`

---

## Compliance

- No student PII in browser console logs or error boundaries
- DPDP Act 2023: explicit consent UI before any WhatsApp/SMS opt-in flows
- Attendance percentage display must match VTU rounding (not JS default)
