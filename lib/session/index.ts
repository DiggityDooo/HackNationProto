import type { SessionStore } from "./store";
import { memoryStore } from "./memory-store";
import { PrismaSessionStore } from "./prisma-store";

// Session store selector. The app uses an in-memory store by default so the
// demo and tests run with zero external setup. The Prisma/SQLite adapter
// (lib/session/prisma-store.ts) is the production backend and is wired in once
// DATABASE_URL is provisioned and `prisma migrate` has run.
export function getSessionStore(): SessionStore {
  // Use Prisma when DATABASE_URL is set, otherwise in-memory for demo/tests.
  if (process.env.DATABASE_URL) {
    return new PrismaSessionStore();
  }
  return memoryStore;
}
