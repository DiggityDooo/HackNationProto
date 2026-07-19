# RealDoor — Application-Readiness Copilot

Renter-side hackathon prototype for affordable-housing application readiness. Extracts allowlisted fields from synthetic documents, requires human confirmation, explains frozen HUD FY2026 rules with citations, runs deterministic math, and builds a renter-controlled export packet.

**Assistive, not adjudicative:** RealDoor never approves, denies, scores, or determines eligibility.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + SQLite (dev) / PostgreSQL (prod)
- Vitest

## Quick start

```bash
npm install
cp .env.example .env   # if present
npx prisma migrate dev
npm run dev
```

## Verify

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## Remote

Canonical repo: [DiggityDooo/HackNationProto](https://github.com/DiggityDooo/HackNationProto)
