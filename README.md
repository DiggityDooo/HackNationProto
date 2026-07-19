# RealDoor — Application-Readiness Copilot

RealDoor is a renter-side prototype focused on **affordable-housing application readiness**.
It helps a renter prepare a complete packet by extracting only allowlisted information from
synthetic documents, requiring explicit human confirmation on extracted fields, explaining
frozen published rules with citations, running deterministic readiness math, and building
a renter-controlled preview/export packet.

> **Assistive, not adjudicative:** RealDoor never approves, denies, scores, ranks, or determines eligibility.

---

## What this repository contains

This repository intentionally includes **two apps** that share product context but serve
different purposes:

1. **Engine app (Next.js):** `app/`, `components/`, `lib/`, `data/`, `prisma/`, `tests/`
2. **Lovable UI prototype:** `src/`
3. **Shared contract (single source of truth):** `shared/realdoor-contract.json`

The contract file defines frozen geography/rule context, limits, scenarios, field allowlists,
and safety copy used to keep both apps aligned.

---

## Product behavior at a glance

RealDoor supports a staged renter journey:

- **Profile:** upload synthetic docs, extract allowlisted fields, confirm/correct each item
- **Understand:** deterministic income-vs-limit calculations with rule citations and abstention safeguards
- **Prepare:** checklist readiness states and renter-controlled packet preview/export/delete

Readiness outputs are informational only (for example, `missing`, `expired`, `needs review`)
and are not legal eligibility decisions.

---

## Tech stack

### Engine app

- Next.js 15 (App Router)
- TypeScript
- Prisma
- SQLite (local development) / PostgreSQL-compatible runtime in deployment contexts
- Vitest

### Lovable UI app

- TanStack Start + Vite
- React + TypeScript

---

## Quick start (engine app)

```bash
npm install
cp .env.example .env   # if present
npx prisma migrate dev
npm run dev
```

Open the app at `http://localhost:3000`.

If `DATABASE_URL` is not set, session storage falls back to in-memory behavior.

---

## Useful scripts

```bash
# Engine development
npm run dev
npm run typecheck
npm run lint
npm test
npm run build

# Lovable UI development
npm run dev:lovable
npm run typecheck:lovable
npm run lint:lovable
npm run build:lovable
```

---

## Validation

Run standard validation for repository changes:

```bash
npm run lint
npm test
npm run build
```

For full engine verification, include type checking:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

---

## Working with the shared contract

When changing rule constants, geography, limits, dates, or field naming:

1. Update `shared/realdoor-contract.json` first.
2. Align engine-side references in `data/` and `lib/`.
3. Align UI-side references in `src/lib/`.
4. Re-run tests and checks.

Do not introduce new business constants independently in one app without contract alignment.

---

## Safety and scope guardrails

- Use only allowlisted extraction fields.
- Require user confirmation before downstream usage of extracted values.
- Keep deterministic readiness logic transparent and citation-backed.
- Abstain rather than infer when inputs are uncertain or policy grounding is insufficient.
- Never auto-submit packets; exports are renter-controlled.

---

## Repository context

- Canonical repository: [DiggityDooo/HackNationProto](https://github.com/DiggityDooo/HackNationProto)
- Active collaboration often happens on the `lovable/realdoor-ui` branch for dual-app alignment.

For deeper implementation details, see:

- `/home/runner/work/DoorCO/DoorCO/ARCHITECTURE.md`
- `/home/runner/work/DoorCO/DoorCO/CODEBASE.md`
