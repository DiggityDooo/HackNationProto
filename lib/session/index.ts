import type { SessionStore } from "./store";
import { memoryStore } from "./memory-store";
import { PrismaSessionStore } from "./prisma-store";

let cachedStore: SessionStore | null = null;
let prismaDisabled = false;

// Session store selector. Prisma/SQLite is used only for file: DATABASE_URL after
// `prisma migrate deploy`. On any Prisma failure we permanently fall back to in-memory
// for the process lifetime so session ids and stores stay consistent.
export function getSessionStore(): SessionStore {
  if (cachedStore) return cachedStore;
  const url = process.env.DATABASE_URL ?? "";
  if (!prismaDisabled && url.startsWith("file:")) {
    cachedStore = new PrismaSessionStore();
  } else {
    cachedStore = memoryStore;
  }
  return cachedStore;
}

/** Switch this process to the in-memory store after Prisma is unavailable. */
export function disablePrismaSessionStore(): void {
  prismaDisabled = true;
  cachedStore = memoryStore;
}

/** @internal test hook */
export function resetSessionStoreForTests(): void {
  cachedStore = null;
  prismaDisabled = false;
}
