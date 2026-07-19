import type { SessionStore } from "./store";
import { memoryStore } from "./memory-store";
import { PrismaSessionStore } from "./prisma-store";

let cachedStore: SessionStore | null = null;

// Session store selector. Prisma/SQLite is used only for file: DATABASE_URL after
// `prisma migrate deploy`. Any other URL (or missing migrations) falls back to
// in-memory so Cloud Run demos keep working.
export function getSessionStore(): SessionStore {
  if (cachedStore) return cachedStore;
  const url = process.env.DATABASE_URL ?? "";
  cachedStore = url.startsWith("file:") ? new PrismaSessionStore() : memoryStore;
  return cachedStore;
}

/** @internal test hook */
export function resetSessionStoreForTests(): void {
  cachedStore = null;
}
