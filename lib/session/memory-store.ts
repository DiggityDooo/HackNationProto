import type { ProfileField, RuleResult, FieldState } from "../types";
import type { AuditEntry, PacketPayload, SessionStore } from "./store";

// In-memory adapter used by unit/demo tests. Mirrors the Prisma adapter's
// hard-delete semantics: deleting a session wipes all child data immediately.
export class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, { id: string; deletedAt: Date | null }>();
  private fields = new Map<string, ProfileField[]>();
  private results = new Map<string, RuleResult[]>();
  private audits = new Map<string, AuditEntry[]>();
  private packets = new Map<string, PacketPayload>();

  async createSession(): Promise<string> {
    const id = `mem_${Math.random().toString(36).slice(2, 10)}`;
    this.sessions.set(id, { id, deletedAt: null });
    this.fields.set(id, []);
    this.results.set(id, []);
    this.audits.set(id, []);
    return id;
  }

  async getSession(id: string) {
    return this.sessions.get(id) ?? null;
  }

  async saveFields(sessionId: string, fields: ProfileField[]) {
    this.fields.set(sessionId, fields);
  }

  async getFields(sessionId: string): Promise<ProfileField[]> {
    return this.fields.get(sessionId) ?? [];
  }

  async setFieldState(sessionId: string, key: string, state: FieldState, rawValue?: string) {
    const list = this.fields.get(sessionId) ?? [];
    const next = list.map((f) =>
      f.key === key
        ? { ...f, state, rawValue: rawValue ?? f.rawValue }
        : f,
    );
    this.fields.set(sessionId, next);
  }

  async saveRuleResult(sessionId: string, result: RuleResult) {
    const list = this.results.get(sessionId) ?? [];
    list.push(result);
    this.results.set(sessionId, list);
  }

  async getRuleResults(sessionId: string): Promise<RuleResult[]> {
    return this.results.get(sessionId) ?? [];
  }

  async appendAudit(sessionId: string, entry: AuditEntry) {
    const list = this.audits.get(sessionId) ?? [];
    list.push(entry);
    this.audits.set(sessionId, list);
  }

  async getAudit(sessionId: string): Promise<AuditEntry[]> {
    return this.audits.get(sessionId) ?? [];
  }

  async savePacket(sessionId: string, payload: PacketPayload) {
    this.packets.set(sessionId, payload);
  }

  async getPacket(sessionId: string): Promise<PacketPayload | null> {
    return this.packets.get(sessionId) ?? null;
  }

  async exportSession(sessionId: string) {
    return {
      fields: this.fields.get(sessionId) ?? [],
      results: this.results.get(sessionId) ?? [],
      audit: this.audits.get(sessionId) ?? [],
      packet: this.packets.get(sessionId) ?? null,
    };
  }

  async hardDelete(sessionId: string) {
    this.sessions.delete(sessionId);
    this.fields.delete(sessionId);
    this.results.delete(sessionId);
    this.audits.delete(sessionId);
    this.packets.delete(sessionId);
  }
}

// Shared singleton for tests / non-Prisma contexts.
export const memoryStore = new MemorySessionStore();
