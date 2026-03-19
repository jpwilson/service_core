# ServiceCore — Employee Time Tracking & Payroll Dashboard

## IMPORTANT: Read Memory First
At the START of every conversation, read ALL memory files in the project's `.claude/projects/` memory directory. This gives you full context from previous work.

## Project Overview
ServiceCore is a multi-platform employee time tracking and payroll dashboard for portable sanitation / field service companies. It's a Gauntlet AI-Accelerated project.

## Monorepo Structure (pnpm + Turborepo)
```
service_core/
├── packages/
│   ├── shared/        # @servicecore/shared — types, utils, calculations, Excel, PDF, OCR parser
│   └── supabase/      # @servicecore/supabase — DB schema, queries, Edge Functions
├── apps/
│   ├── web/           # @servicecore/web — React 18 + Vite + Tailwind (main app)
│   ├── desktop/       # @servicecore/desktop — Electron (macOS + Windows)
│   └── mobile/        # @servicecore/mobile — Expo React Native (iOS)
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Key Commands
```bash
pnpm install                              # Install all deps
pnpm --filter @servicecore/web dev        # Start web dev server
pnpm --filter @servicecore/web build      # Build web app
pnpm --filter @servicecore/web test:run   # Run web tests (13 tests)
pnpm --filter @servicecore/shared test:run # Run shared tests (69 tests)
pnpm turbo build                          # Build all packages
pnpm turbo test:run                       # Run all tests
```

## Tech Stack
- **Web**: React 18, TypeScript, Vite 5, Tailwind CSS 3, Recharts, Zustand, Lucide React, date-fns
- **Shared**: Pure TS + date-fns, xlsx (SheetJS), jspdf, tesseract.js (OCR parser only — engine in web)
- **Backend**: Supabase (Postgres, Auth, Edge Functions, RLS)
- **Desktop**: Electron 28, vite-plugin-electron
- **Mobile**: Expo SDK 51, Expo Router, React Native 0.74.5

## Known Constraints
- **Node v20.9.0** — many latest packages are incompatible. Pinned: vite@5, vitest@1, jsdom@24
- **Spec says Angular** but user explicitly chose React. If Angular requirement resurfaces, flag it
- **Mock data fallback** — Supabase client returns null when unconfigured; app falls back to mock data
- **Bundle size** — web bundle is ~1.5MB (xlsx, jspdf, html2canvas, tesseract). Needs code splitting

## Design System
- Primary: Orange `#f89020` (primary-500)
- Secondary: Dark navy `#0a1f44` (secondary-500)
- Font: Inter
- Industrial-modern aesthetic — built for field crews, not tech workers

## Testing
- 82 total tests (69 shared + 13 web)
- Vitest + Testing Library + jsdom
- Tests cover: calculations, formatters, mock data, store, components, Excel round-trip, PDF generation, OCR parsing

## CI/CD
- GitHub Actions: `.github/workflows/ci.yml`
- Pipeline: lint → typecheck → test → build → security audit
- Uses pnpm + Turborepo in CI
