---
name: run-realdoor-engine
description: Build, launch, and drive the RealDoor Next.js engine (app/, lib/, data/, prisma/) — the extraction/rules/session API, not the Lovable UI in src/. Use when asked to run, start, test, or screenshot the engine, or to confirm an engine change works in the real app.
---

The RealDoor engine is a Next.js 15 app (App Router, server actions, Prisma+SQLite session store) living in `app/`, `lib/`, `data/`, `prisma/` at the repo root. It shares one `package.json`/`node_modules` with a separate Lovable/TanStack UI in `src/` (see `ARCHITECTURE.md`) but is a fully independent app with its own routes — this skill only covers the engine.

All paths below are relative to the repo root (`/home/seanb/Documents/Hack-Nation`).

There is no `chromium-cli` binary in this environment, so this app is driven with a small Playwright-based REPL at `.claude/skills/run-realdoor-engine/driver.mjs` instead — same command vocabulary (`nav`, `click`, `ss`, `console --errors`, ...) as `chromium-cli`, just self-hosted.

## Prerequisites

Playwright's npm package plus a downloaded Chromium build. Install once per machine (not saved to `package.json` — this is agent tooling, not an app dependency):

```bash
npm install --no-save playwright
npx playwright install chromium
```

No system packages were needed beyond that — headless Chromium with `--no-sandbox` ran fine on this container without `xvfb` or extra `apt-get` installs.

## Build

```bash
npx prisma generate      # generates node_modules/@prisma/client from prisma/schema.prisma
```

`DATABASE_URL` is already set in `.env` (`file:./dev.db`, SQLite) and `prisma/dev.db` already exists — no seeding needed to browse the app.

## Run (agent path)

Start the dev server, wait for it to actually serve, then drive it via the REPL under tmux:

```bash
npm run dev &
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'

tmux new-session -d -s realdoor-engine-drive -x 200 -y 50
tmux send-keys -t realdoor-engine-drive 'node .claude/skills/run-realdoor-engine/driver.mjs' Enter
timeout 15 bash -c 'until tmux capture-pane -t realdoor-engine-drive -p | grep -q "driver>"; do sleep 0.3; done'

tmux send-keys -t realdoor-engine-drive 'launch' Enter
timeout 20 bash -c 'until tmux capture-pane -t realdoor-engine-drive -p | grep -q "launched"; do sleep 0.3; done'

tmux send-keys -t realdoor-engine-drive 'nav /' Enter
timeout 15 bash -c 'until tmux capture-pane -t realdoor-engine-drive -p | grep -q "nav ->"; do sleep 0.3; done'
tmux send-keys -t realdoor-engine-drive 'ss 01-home' Enter

# one representative flow: home -> a synthetic demo doc -> Profile
tmux send-keys -t realdoor-engine-drive 'click a[href="/profile?doc=doc-paystub-001"]' Enter
sleep 2
tmux send-keys -t realdoor-engine-drive 'ss 02-profile' Enter
tmux send-keys -t realdoor-engine-drive 'console --errors' Enter
sleep 1
tmux capture-pane -t realdoor-engine-drive -p | tail -20
```

Screenshots land in `/tmp/realdoor-engine-shots/` (override with `SCREENSHOT_DIR`). Actually open/inspect the PNG before declaring success — a page can render its shell while every fetch errors underneath.

Driver commands: `launch`, `nav <path-or-url>`, `click <selector>`, `click-text <text>`, `fill <selector> <text>`, `type <text>`, `press <key>`, `wait-for <selector-or-text=...>`, `ss [name]`, `text [selector]`, `eval <js>`, `console --errors`, `quit`, `help`.

Stop when done:

```bash
tmux send-keys -t realdoor-engine-drive 'quit' Enter
tmux kill-session -t realdoor-engine-drive
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
```

## Run (human path)

```bash
npm run dev
```

Opens on `http://localhost:3000`. Ctrl-C to stop. Useless headless — this is the path for a person with a browser, not an agent.

## Test

```bash
npm run test    # vitest run — 3 files, 22 tests, ~0.6s, no server needed
```

## Gotchas

- **Killing the dev server**: `npm run dev &` then `kill %1` does NOT stop Next.js — npm's wrapper doesn't forward the signal to the child it spawns. Use `lsof -ti:3000 -sTCP:LISTEN | xargs -r kill` instead, or the next run hits `EADDRINUSE`.
- **This repo has concurrent editors.** Another process/agent may be actively running `npm install` in this same `node_modules` at any time — `playwright` installed with `--no-save` was silently removed mid-session by exactly that. If a driver run suddenly can't resolve `playwright`, just re-run `npm install --no-save playwright` (the downloaded Chromium binary in `~/.cache/ms-playwright/` survives `node_modules` churn, so this is fast).
- **The homepage still reads "Sacramento–Roseville–Arden-Arcade, CA."** That's real, pre-existing app content (`data/config.json` per `ARCHITECTURE.md`'s own "Known drift" section), not a driver bug — don't mistake it for the harness misbehaving.
- **`fullPage: true` screenshots on `/profile` came back at the plain 1280x720 viewport size** — the page content fits in one viewport height here; not a driver bug, just this page.

## Troubleshooting

- `Cannot find package 'playwright'` when running a Playwright script directly with `node some/script.mjs`: only happens if the script lives outside this repo's directory tree (ESM resolution walks up from the file's own path for `node_modules`, and `NODE_PATH` does not fix ESM resolution). Keep ad-hoc scripts inside the repo, or use the committed `driver.mjs`.
- `BEWARE: your OS is not officially supported by Playwright` during `npx playwright install chromium`: harmless on this CachyOS/Arch-based host — it downloads the generic Ubuntu 24.04 fallback build, which ran fine.
