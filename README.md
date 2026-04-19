# RV Trust AI ERP — Frontend Monorepo

Mobile and web interfaces for the RV Trust AI engagement platform.

## Repository Structure

```
rv-trust-frontend/
├── apps/
│   ├── mobile/                    # Flutter app (Parent + Student)
│   │   ├── lib/
│   │   │   ├── features/
│   │   │   │   ├── auth/          # Login, SSO, biometric unlock
│   │   │   │   ├── attendance/    # Attendance view, leave requests
│   │   │   │   ├── timeline/      # Unified student timeline
│   │   │   │   ├── fees/          # Fee dues, payments, EMI
│   │   │   │   ├── notifications/ # Push, WhatsApp, in-app alerts
│   │   │   │   ├── profile/       # Language picker, consent centre
│   │   │   │   └── voice_calls/   # Call history, transcripts
│   │   │   ├── core/
│   │   │   │   ├── api/           # HTTP client, interceptors
│   │   │   │   ├── models/        # Data models + Isar schemas
│   │   │   │   ├── providers/     # Riverpod state providers
│   │   │   │   ├── router/        # Go Router navigation
│   │   │   │   └── theme/         # Design tokens, typography
│   │   │   └── shared/
│   │   │       ├── widgets/       # Reusable UI components
│   │   │       ├── utils/         # Formatters, validators
│   │   │       └── constants/     # API URLs, config
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   └── translations/      # ARB files per language
│   │   └── test/
│   └── web/                       # Next.js 14 app (Faculty + Admin)
│       ├── src/
│       │   ├── app/               # App Router pages + layouts
│       │   ├── components/
│       │   │   ├── ui/            # shadcn/ui base components
│       │   │   ├── forms/         # React Hook Form forms
│       │   │   ├── tables/        # AG Grid data tables
│       │   │   ├── charts/        # Recharts visualisations
│       │   │   └── layout/        # Shell, sidebar, header
│       │   ├── features/
│       │   │   ├── attendance/    # Live absentee dashboard
│       │   │   ├── marks/         # Marks entry + dual verification
│       │   │   ├── voice/         # Call queue, transcripts
│       │   │   ├── placements/    # Drive management
│       │   │   ├── grievance/     # Grievance officer console
│       │   │   ├── compliance/    # NAAC/NBA report builder
│       │   │   └── dashboard/     # Trust-level KPI view
│       │   ├── lib/
│       │   │   ├── api/           # tRPC / REST client
│       │   │   ├── hooks/         # Custom React hooks
│       │   │   ├── stores/        # Zustand stores
│       │   │   └── utils/
│       │   ├── types/
│       │   └── styles/
│       └── public/
└── packages/
    ├── shared-types/              # TypeScript types shared with backend
    └── api-client/                # Generated API client (OpenAPI)
```

## Tech Stack

| App | Technology |
|-----|-----------|
| Mobile (Parent/Student) | Flutter 3.x + Riverpod + Isar + Go Router |
| Web (Faculty/Admin) | Next.js 14 + TypeScript + Tailwind + shadcn/ui |
| State (Web) | Zustand + React Query |
| Forms | React Hook Form + Zod |
| Tables | AG Grid Community |
| Charts | Recharts |
| Auth | Keycloak OIDC (mobile) + NextAuth.js (web) |

## Prerequisites

- Flutter 3.x (`flutter --version`)
- Node.js 20+ + pnpm
- Android Studio / Xcode for mobile

## Quick Start

```bash
# Web app
cd apps/web
pnpm install
pnpm dev

# Mobile app
cd apps/mobile
flutter pub get
flutter run
```

## Internationalisation

Mobile app translations live in `apps/mobile/assets/translations/`. Add a new `.arb` file per language (e.g. `app_kn.arb` for Kannada).

---
*Confidential — RV Trust engineering team*
