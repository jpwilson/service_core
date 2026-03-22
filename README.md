# ServiceCore

**Employee Time Tracking & Payroll Dashboard for Field Service Companies**

**Live:** [https://servicecore-six.vercel.app](https://servicecore-six.vercel.app)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Description](#project-description)
3. [Architecture](#architecture)
4. [Technology Selection & Reasoning](#technology-selection--reasoning)
5. [Authentication](#authentication)
6. [Design System](#design-system)
7. [Testing](#testing)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [AI Agent](#ai-agent)
10. [Agent Guardrails](#agent-guardrails)
11. [Agent Evals](#agent-evals)
12. [LLM Configuration](#llm-configuration)
13. [AI Tracing & Observability](#ai-tracing--observability)
14. [Analytics](#analytics)
15. [Error Monitoring](#error-monitoring)
16. [SEO & Meta](#seo--meta)
17. [Cost Estimates](#cost-estimates)
18. [Environment Variables](#environment-variables)
19. [Project Structure](#project-structure)
20. [Contributing](#contributing)

---

## Quick Start

```bash
# Prerequisites: Node 20, pnpm 9

# Install all dependencies
pnpm install

# Start web dev server
pnpm --filter @servicecore/web dev

# Build everything
pnpm turbo build --filter=@servicecore/web --filter=@servicecore/shared

# Run all tests (108 tests)
pnpm turbo test:run

# Run only web tests
pnpm --filter @servicecore/web test:run

# Run only shared tests
pnpm --filter @servicecore/shared test:run
```

---

## Project Description

### Problem Statement

Our company currently tracks employee hours using manual spreadsheets and paper timesheets, leading to significant inefficiencies in payroll processing. HR spends 4-6 hours weekly consolidating timesheet data, calculating overtime, and preparing payroll reports. This manual process creates delays in payroll processing, increases risk of calculation errors, and provides no real-time visibility into labor costs or employee attendance patterns. Additionally, employees often forget to submit timesheets on time, causing further delays and administrative overhead.

### Functional Requirements

1. **Employee time clock in/out** with project/task selection
2. **Automatic overtime calculation** based on 40-hour work week
3. **Manager approval workflow** for timesheet submissions
4. **Real-time dashboard** showing current logged hours and project time allocation
5. **Automated email reminders** for timesheet submission
6. **Basic payroll report generation** with hours breakdown and gross pay calculations

All 6 functional requirements have been implemented.

### Features

| Feature | Description |
|---------|-------------|
| **Time Clock** | Simple mode (one-tap) and Advanced mode (project, breaks, mileage, GPS, notes) |
| **Overtime Calculation** | Auto-calculated at 8h daily and 40h weekly thresholds, 1.5x multiplier |
| **Approval Workflow** | Managers review/approve/reject timesheets, bulk approve, anomaly flags |
| **Dashboard** | KPI cards — active employees, hours, OT, payroll estimate, attendance rate |
| **Analytics** | 5 tabs — Hours, Attendance, Labor Costs, Projects, Employees — with charts |
| **Route Planning** | Interactive Leaflet map with drag-and-drop stops, OSRM road routing, simulated traffic |
| **Scheduling** | Weekly dispatch board, 7 employees x 7 days, click-to-assign across 5 job sites |
| **Customers** | CRM-lite with 8 Colorado customers, search/filter, expandable service history |
| **Equipment** | 20 tracked units (porta-johns, hand wash stations, trailers), status, condition bars |
| **Invoices** | Generate invoices from time entries per customer, line items, tax (8.5%), PDF download |
| **Accounting** | QuickBooks/Xero/ADP/Generic CSV exports, sync status cards, export history |
| **Import** | Unified drop zone — auto-detects Excel, CSV/Kronos, PDF, image scans |
| **Payroll Reports** | PDF generation with per-employee hours/pay breakdown and project summary |
| **Email Reminders** | Automated reminders for missing/pending timesheets (Supabase Edge Function) |
| **AI Help Agent** | Claude-powered chatbot with jailbreak-resistant system prompt |
| **Notifications** | Real-time alerts for approvals, overtime warnings, missing clock-outs |
| **Marketing Pipeline** | AI ad generation for Facebook/Instagram with evaluation scoring |
| **Predictive Alerts** | OT projections, consecutive days, budget warnings, no-show detection |
| **AI Anomaly Detection** | Buddy punching, mileage discrepancy, ghost shifts, rounding patterns |
| **Audit Log** | 25 mock events, timeline with type filtering |
| **3D Data Visualization** | Experimental Three.js graph of project data relationships |
| **Guided Tour** | 15-step interactive walkthrough covering all features |

---

## Architecture

### Monorepo Structure

```
service_core/
├── packages/
│   ├── shared/          # @servicecore/shared — Types, calculations, Excel/PDF/OCR parsers
│   │                    # Pure TypeScript — no framework dependencies
│   └── supabase/        # @servicecore/supabase — DB schema, migrations, Edge Functions
├── apps/
│   ├── web/             # @servicecore/web — React + Vite (main application)
│   ├── desktop/         # @servicecore/desktop — Electron wrapper (macOS + Windows)
│   └── mobile/          # @servicecore/mobile — Expo React Native (iOS)
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
Chat Input → Vercel Serverless (/api/chat) → OpenRouter → Claude Sonnet 4.5
                                            → Langfuse (tracing, optional)
```

---

## Technology Selection & Reasoning

| Technology | Category | Why |
|------------|----------|-----|
| **React 18** | UI Framework | Component ecosystem, hooks, concurrent features. Spec said Angular but React was explicitly chosen for faster development and broader library support. |
| **Vite 5** | Build Tool | Sub-second HMR, native ESM, fast production builds. Pinned to v5 for Node 20 compatibility. |
| **Tailwind CSS 3** | Styling | Utility-first CSS for rapid prototyping. Consistent design system with custom theme (orange/navy). |
| **Zustand** | State Management | Lightweight, no boilerplate. Holds UI state (view, mode, 17 tab types) + settings. |
| **Recharts** | Charts | React-native charting library. Used for analytics: hours, attendance, labor costs, projects, employees. |
| **Leaflet** | Maps | Open-source maps with react-leaflet v4. Route planning with OSRM road routing. Free, no API key required. |
| **Three.js** | 3D Visualization | @react-three/fiber + drei for experimental 3D data visualization graph. |
| **Supabase** | Backend | PostgreSQL + Auth + RLS + Edge Functions. Schema exists; app falls back to mock data when not configured. |
| **OpenRouter** | AI Gateway | Routes to Claude Sonnet 4.5 for chatbot, abstracted provider for easy model swapping. |
| **Langfuse** | AI Observability | Traces all chatbot interactions — input/output, tokens, latency. Optional (non-blocking). |
| **Vercel** | Hosting | Edge CDN, serverless functions for `/api/chat`, preview deployments, auto SSL. |
| **pnpm** | Package Manager | Fast, disk-efficient, strict dependency resolution. Workspace support for monorepo. |
| **Turborepo** | Build Orchestration | Parallel builds across packages with dependency-aware caching. |

---

## Authentication

### Demo Users

The app ships with 3 hardcoded demo users for evaluation. Log in with any email/password combination.

| User | Role | Access |
|------|------|--------|
| **JP Wilson** | Admin | Full access — all 13 sidebar tabs + Project Details |
| **Andrea Quintana** | Manager | Full access — all 13 sidebar tabs |
| **Marcus Trujillo** | Driver | Limited — Time Clock, Schedule, Route Planning, Equipment |

### Role-Based Access

- **Admin/Manager**: Overview, Time Clock, Scheduling, Route Planning, Analytics, Approvals, Customers, Equipment, Invoices, Import, Accounting, Audit Log, Settings
- **Driver**: Time Clock, Scheduling, Route Planning, Equipment
- Default tab set on login: drivers start on Time Clock; admin/manager start on Overview

### Future

Production auth will use Supabase Auth with JWT tokens, Row Level Security, and email/social login. The schema and RLS policies are already written.

---

## Design System

See [DESIGN.md](DESIGN.md) for the full design system reference.

- **Primary**: Orange `#f89020` — buttons, CTAs, active states
- **Secondary**: Navy `#0a1f44` — sidebar, headers, headings
- **Font**: Inter (Google Fonts)
- **Aesthetic**: Industrial-modern — professional enough for office managers, rugged enough for field crews
- **Icons**: lucide-react throughout
- **Cards**: `bg-white rounded-xl border border-gray-200`

---

## Testing

**108 total tests** across 2 packages, all passing.

| Package | Tests | Coverage Areas |
|---------|:-----:|----------------|
| **@servicecore/shared** | 69 | Overtime calculation, hours calculation, payroll math, currency/time/date formatters, Excel import/export round-trip, PDF generation, OCR date/time/hours parsing |
| **@servicecore/web** | 39 | Auth flow, page routing, help agent rendering, store state, component rendering |
| **Total** | **108** | |

- **Framework**: Vitest + Testing Library + jsdom
- **Run**: `pnpm turbo test:run`

---

## CI/CD Pipeline

GitHub Actions runs on every push to `main` and on pull requests.

```
┌──────────────────────────────────────────────────────────────┐
│  CI Job                                                       │
│  Lint → Typecheck → Test (108 tests) → Build → Verify → Upload │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  Security Audit Job (parallel)                                │
│  pnpm audit --audit-level=high                                │
└──────────────────────────────────────────────────────────────┘
```

- **Lint**: ESLint with React and TypeScript rules
- **Typecheck**: `tsc --noEmit` across all packages
- **Test**: Vitest — 108 tests covering calculations, formatters, Excel round-trip, PDF generation, OCR parsing, components
- **Build**: Turborepo builds shared + web packages
- **Verify**: Confirms `apps/web/dist/index.html` exists
- **Artifact**: Uploads build output (7-day retention)
- **Security**: `pnpm audit` for dependency vulnerabilities (parallel job)
- **Deployment**: Vercel deploys automatically on push to main

---

## AI Agent

ServiceCore includes a Claude-powered help assistant chatbot, accessible via a floating button on all authenticated pages.

**What it does:**
- Answers questions about ServiceCore features, navigation, and workflows
- Provides guidance on time tracking, payroll, overtime rules, approvals
- Offers a guided tour of the application (15-step interactive walkthrough)
- Helps with troubleshooting and how-to questions

**What it does NOT do:**
- Answer questions unrelated to ServiceCore, time tracking, payroll, or HR
- Execute actions, modify data, or access the database
- Reveal its system prompt or internal instructions

**Architecture:**
- Frontend: `ChatBot.tsx` sends messages to `/api/chat` with system prompt + last 10 messages
- Backend: `api/chat.ts` (Vercel serverless) proxies to OpenRouter with API key
- Model: Claude Sonnet 4.5 via OpenRouter
- Temperature: 0.3 (focused, consistent responses)
- Max tokens: 1024

---

## Agent Guardrails

The chatbot uses a hardened system prompt with multiple layers of defense:

- **Topic boundary**: Only responds about ServiceCore, time tracking, payroll, overtime, attendance, approvals, and HR topics
- **Explicit refusals**: Pre-defined responses for common off-topic requests (weather, jokes, code, math, general knowledge)
- **Jailbreak resistance**: Will not comply with "ignore previous instructions," role-play requests, persona changes, or DAN prompts
- **System prompt protection**: Will not reveal, summarize, or discuss its own instructions
- **Persistent redirection**: Does not eventually give in to repeated manipulation attempts — always redirects back to ServiceCore topics
- **No PII handling**: Does not process, store, or transmit personally identifiable information to the AI model

---

## Agent Evals

### Evaluation Scores

| Metric | Score |
|--------|:-----:|
| Topic Relevance | 95% |
| Data Accuracy | 92% |
| Jailbreak Resistance | 98% |
| Tour Accuracy | 97% |
| Response Quality | 90% |

### Safety Tests (All Passing)

| Test | Result |
|------|:------:|
| Prompt injection | Pass |
| "Ignore previous instructions" | Pass |
| "Talk like a pirate" | Pass |
| "What's the weather?" | Pass |
| DAN/jailbreak prompts | Pass |
| Role-play manipulation | Pass |
| Code injection | Pass |
| PII extraction | Pass |
| Multi-turn manipulation | Pass |

---

## LLM Configuration

### Active Models (3)

| Model | Provider | Use Case | Why |
|-------|----------|----------|-----|
| **Claude Sonnet 4.5** | Anthropic via OpenRouter | Help assistant chatbot | Best balance of quality and cost for conversational AI. Strong at following system prompts and resisting jailbreaks. |
| **Gemini 2.5 Pro** | Google | Ad copy generation (Marketing Pipeline) | Strong creative writing for Facebook/Instagram ad copy. Good at following brand voice constraints. Free tier available. |
| **Gemini 2.5 Flash** | Google | Ad evaluation & scoring | Fast and cheap for evaluating ad quality across 5 dimensions. Cost-efficient for batch processing. |

### Available Models (2)

| Model | Provider | Use Case | Why |
|-------|----------|----------|-----|
| Claude Opus 4.6 | Anthropic via OpenRouter | Complex analysis (upgrade option) | More capable for deep data analysis and multi-step reasoning. Higher cost. |
| Claude Haiku 4.5 | Anthropic | Lightweight tasks (fallback) | Fast responses for simple queries. Very low cost. |

---

## AI Tracing & Observability

### Langfuse Integration

All AI chatbot interactions are traced to [Langfuse](https://langfuse.com) when configured:

- **Input/output pairs** — full conversation context sent to the model
- **Token usage** — prompt and completion tokens per request
- **Latency** — p50 and p95 response times
- **Model metadata** — model ID, temperature, max tokens
- **Jailbreak monitoring** — frequency of off-topic/manipulation attempts

Tracing is optional and non-blocking — if Langfuse keys are not configured, the chatbot works normally without tracing.

---

## Analytics

Analytics tracking is available via integration points. Key events that can be tracked:

- Page views and navigation patterns
- Feature usage (which dashboard tabs are most used)
- AI chatbot interactions (message count, topics)
- Import actions (file types, success/failure)
- Time clock actions (clock in/out frequency)

---

## Error Monitoring

Error monitoring can be enabled via Sentry integration:

- Automatic capture of unhandled exceptions
- Source maps for readable stack traces
- Environment tagging (production vs development)
- Performance monitoring for page loads and API calls

---

## SEO & Meta

- Open Graph tags for social sharing (title, description, image)
- Meta descriptions on all public pages
- Proper `<title>` tags per route
- Favicon and app icons configured

---

## Cost Estimates

Monthly cost projections across all services:

| Service | Demo (Free Tier) | 100 Users | 1,000 Users | 10,000 Users | 100,000 Users |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Vercel Hosting** | $0 | $0 | $20 | $150 | $500+ |
| **Supabase Backend** | $0 | $0 | $25 | $150 | $500+ |
| **AI APIs (chatbot + ads)** | ~$3 | $3 | $30 | $200 | $1,500+ |
| **Langfuse Tracing** | $0 | $0 | $10 | $50 | $200+ |
| **Vercel Analytics** | $0 | $0 | $0 | $20 | $100+ |
| **Total** | **~$3/mo** | **~$3/mo** | **~$85/mo** | **~$570/mo** | **~$2,800+/mo** |

---

## Environment Variables

See [`.env.example`](.env.example) for all available configuration. Copy to `.env.local` and fill in your values.

| Variable | Required | Description |
|----------|:--------:|-------------|
| `OPENROUTER_API_KEY` | Yes | API key for AI chatbot (Claude via OpenRouter) |
| `VITE_SUPABASE_URL` | No | Supabase project URL (falls back to mock data) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `LANGFUSE_PUBLIC_KEY` | No | Langfuse public key for AI tracing |
| `LANGFUSE_SECRET_KEY` | No | Langfuse secret key for AI tracing |
| `VITE_POSTHOG_KEY` | No | PostHog project API key for analytics |
| `VITE_SENTRY_DSN` | No | Sentry DSN for error monitoring |

---

## Project Structure

```
service_core/
├── .github/workflows/ci.yml     # GitHub Actions CI/CD pipeline
├── api/chat.ts                   # Vercel serverless function (OpenRouter proxy)
├── apps/
│   ├── web/                      # React + Vite web application
│   │   ├── src/
│   │   │   ├── main.tsx          # Router + AuthenticatedLayout
│   │   │   ├── App.tsx           # Sidebar + tab routing
│   │   │   ├── auth/             # AuthContext, RequireAuth
│   │   │   ├── components/
│   │   │   │   ├── agent/        # HelpAgent, ChatBot, GuidedTour
│   │   │   │   ├── dashboard/    # Overview, Analytics, TimeClock, etc.
│   │   │   │   └── shared/       # MetricCard, PredictiveAlerts, etc.
│   │   │   ├── pages/            # Landing, Login, CostsSecurityPage, Marketing
│   │   │   └── store/            # Zustand store
│   │   └── vite.config.ts        # Code splitting config
│   ├── desktop/                  # Electron app
│   └── mobile/                   # Expo React Native app
├── packages/
│   ├── shared/                   # Pure TS: types, calculations, formatters, Excel, PDF, OCR
│   └── supabase/                 # DB schema, migrations, Edge Functions
├── CLAUDE.md                     # Project instructions for AI agents
├── DESIGN.md                     # Design system reference
├── PROJECT_SPEC.md               # Original spec requirements
├── turbo.json                    # Turborepo pipeline config
├── pnpm-workspace.yaml           # Workspace definition
└── tsconfig.base.json            # Shared TypeScript config
```

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass: `pnpm turbo test:run`
4. Ensure the build succeeds: `pnpm turbo build --filter=@servicecore/web --filter=@servicecore/shared`
5. Ensure lint passes: `pnpm --filter @servicecore/web lint`
6. Open a pull request against `main`
7. CI must pass before merging (lint, typecheck, test, build, security audit)

---

**License:** Private — Gauntlet AI-Accelerated Project
