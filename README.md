# ServiceCore

**Employee Time Tracking & Payroll Dashboard for Field Service Companies**

> **Live Demo:** [https://servicecore-six.vercel.app](https://servicecore-six.vercel.app)
>
> Login with any email/password — demo mode uses mock data.

---

## What It Solves

Field service companies (portable sanitation, waste management, construction) track employee hours with spreadsheets and paper timesheets. HR spends 4-6 hours weekly consolidating data, calculating overtime, and preparing payroll. ServiceCore automates all of it:

- Clock in/out with project selection and GPS
- Automatic overtime at 8h daily / 40h weekly
- Manager approval workflow
- Real-time labor cost visibility
- PDF payroll reports
- Paper timesheet OCR scanning

---

## Features

### Core Modules

| Feature | Description |
|---------|-------------|
| **Time Clock** | Simple mode (one-tap) and Advanced mode (project, breaks, mileage, GPS, notes) |
| **Overtime Calculation** | Auto-calculated at 8h daily and 40h weekly thresholds, 1.5x multiplier |
| **Approval Workflow** | Managers review/approve/reject timesheets, bulk approve, anomaly flags |
| **Dashboard** | KPI cards — active employees, hours, OT, payroll estimate, attendance rate |
| **Analytics** | 5 tabs — Hours, Attendance, Labor Costs, Projects, Employees — with charts |
| **Route Planning** | Interactive map with drag-and-drop stops, nearest-neighbor optimization |
| **Import** | Unified drop zone — auto-detects Excel, CSV/Kronos, PDF, image scans |
| **Payroll Reports** | PDF generation with per-employee hours/pay breakdown and project summary |
| **Email Reminders** | Automated reminders for missing/pending timesheets (Supabase Edge Function) |
| **AI Help Agent** | Claude-powered chatbot with jailbreak-resistant system prompt |
| **Notifications** | Real-time alerts for approvals, overtime warnings, missing clock-outs |
| **Marketing Pipeline** | AI ad generation for Facebook/Instagram with evaluation scoring |

### Import Formats

- **Excel** (.xlsx, .xls) — parsed with SheetJS, flexible column header matching
- **CSV / Kronos / UKG** (.csv, .tsv) — auto-detects delimiters and column mappings
- **PDF Timesheets** (.pdf) — rendered page-by-page via pdf.js, then OCR'd with Tesseract
- **Paper Scans** (.jpg, .png) — direct OCR with Tesseract.js, editable results
- All formats show preview before import, with full import history log

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS 3 |
| **State** | Zustand |
| **Charts** | Recharts |
| **Maps** | Leaflet + react-leaflet + OpenStreetMap |
| **PDF** | jsPDF + jspdf-autotable |
| **Excel** | SheetJS (xlsx) |
| **OCR** | Tesseract.js + pdfjs-dist |
| **Backend** | Supabase (Postgres, Auth, RLS, Edge Functions) |
| **AI** | Claude Sonnet 4 via OpenRouter |
| **Hosting** | Vercel (serverless functions + edge CDN) |
| **Monorepo** | pnpm workspaces + Turborepo |

---

## Architecture

```
service_core/
├── packages/
│   ├── shared/          # Types, calculations, Excel/PDF/OCR parsers
│   │                    # Pure TypeScript — no framework dependencies
│   └── supabase/        # DB schema, migrations, Edge Functions
├── apps/
│   ├── web/             # React + Vite (main application)
│   ├── desktop/         # Electron wrapper (macOS + Windows)
│   └── mobile/          # Expo React Native (iOS)
├── api/
│   └── chat.ts          # Vercel serverless — proxies to OpenRouter
├── turbo.json
└── pnpm-workspace.yaml
```

### Data Flow

```
User → React UI → Zustand Store → Mock Data (demo) / Supabase (production)
                                 ↓
                        Calculations (shared pkg)
                                 ↓
                    Dashboard / Analytics / PDF Reports
```

```
Chat Input → Vercel Serverless (/api/chat) → OpenRouter → Claude Sonnet 4
                                            → Langfuse (tracing, optional)
```

---

## Infrastructure Costs

| Service | Demo (Free Tier) | 100 Users | 1,000 Users | 10,000 Users | 100,000 Users |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Vercel Hosting** | $0 | $0 | $20 | $150 | $500+ |
| **Supabase Backend** | $0 | $0 | $25 | $150 | $500+ |
| **AI APIs** | ~$3 | $3 | $30 | $200 | $1,500+ |
| **Langfuse Tracing** | $0 | $0 | $10 | $50 | $200+ |
| **Vercel Analytics** | $0 | $0 | $0 | $20 | $100+ |
| **Total** | **~$3/mo** | **~$3/mo** | **~$85/mo** | **~$570/mo** | **~$2,800+/mo** |

---

## Observability & Tracing

### Langfuse Integration

All AI chatbot interactions are traced to [Langfuse](https://langfuse.com) (when configured):

- **Input/output pairs** — full conversation context sent to the model
- **Token usage** — prompt and completion tokens per request
- **Latency** — p50 and p95 response times
- **Model metadata** — model ID, temperature, max tokens
- **Jailbreak monitoring** — frequency of off-topic/manipulation attempts

### AI Safety

The help agent uses a hardened system prompt with:

- Strict topic boundary — only ServiceCore, time tracking, payroll, HR
- Explicit example responses for common off-topic requests
- Anti-jailbreak rules — won't comply with instruction overrides, role-play, persona changes
- Won't reveal system prompt contents
- Persistent redirection — doesn't eventually give in to repeated attempts

---

## CI/CD

GitHub Actions pipeline runs on every push to `main`:

```
Lint → Typecheck → Test (69 tests) → Build → Verify → Upload Artifact
                                                    ↘ Security Audit (parallel)
```

- **Lint**: ESLint with React and TypeScript rules
- **Typecheck**: `tsc --noEmit` across all packages
- **Tests**: Vitest — 69 tests covering calculations, formatters, Excel round-trip, PDF generation, OCR parsing
- **Build**: Turborepo builds shared + web packages
- **Security**: `pnpm audit` for dependency vulnerabilities
- **Deployment**: Vercel CLI deploy to production

---

## Local Development

```bash
# Prerequisites: Node 20, pnpm 9

# Install
pnpm install

# Run web app
pnpm --filter @servicecore/web dev

# Run all tests
pnpm turbo test:run

# Build everything
pnpm turbo build --filter=@servicecore/web --filter=@servicecore/shared
```

### Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env`:

```env
# Required for AI chatbot
OPENROUTER_API_KEY=sk-or-v1-...

# Optional — AI observability
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# Optional — live backend (falls back to mock data)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Test Coverage

| Package | Tests | Coverage Areas |
|---------|:-----:|----------------|
| **shared** | 69 | Overtime calc, hours calc, payroll, formatters, Excel import/export round-trip, PDF generation, OCR date/time/hours parsing |
| **web** | 13 | Auth flow, page routing, help agent rendering, store state |
| **Total** | **82** | |

---

## Demo Data

- **18 employees** across 3 departments: Drivers (6), Service Crew (7), Office (5)
- **15 active projects** in Colorado with realistic budgets ($18K-$210K)
- **30 days** of generated time entries with patterns: overtime, late arrivals, absences, weekend work
- **Pay rates**: $18-$35/hr with 1.5x OT
- Mock data regenerates relative to current date so dashboard metrics are always fresh

---

## Security

- Supabase Auth with JWT tokens and Row Level Security
- API keys stored as environment variables only
- TLS 1.3 encryption in transit, AES-256 at rest
- No PII sent to AI models
- Serverless architecture — no persistent attack surface
- `pnpm audit` in CI pipeline

---

## AI Models Used

| Model | Provider | Use Case | Status |
|-------|----------|----------|--------|
| Claude Sonnet 4 | Anthropic via OpenRouter | Help assistant chatbot | Active |
| Gemini 2.5 Pro | Google | Ad copy generation | Active |
| Gemini 2.5 Flash | Google | Ad evaluation & scoring | Active |
| Claude Opus 4.6 | Anthropic | Complex analysis (upgrade option) | Available |
| Claude Haiku 4.5 | Anthropic | Lightweight queries (fallback) | Available |

---

## License

Private — Gauntlet AI-Accelerated Project
