import type { ProfileField, RuleResult, FieldState } from "../types";
import type { ChecklistEval } from "../rules/checklist";

// Audit log entries never contain raw document contents — only the action,
// a non-sensitive detail, and the rule version in effect.
export interface AuditEntry {
  action: string;
  detail?: string;
  ruleVersion?: string;
}

export interface PacketPayload {
  fields: Array<Pick<ProfileField, "key" | "rawValue" | "state">>;
  checklist: ChecklistEval[];
  readinessNote: string;
}

// Storage contract. The app uses a Prisma-backed adapter; tests use an
// in-memory adapter. Both must support full hard-delete (child rows gone).
export interface SessionStore {
  createSession(): Promise<string>;
  getSession(id: string): Promise<{ id: string; deletedAt: Date | null } | null>;
  saveFields(sessionId: string, fields: ProfileField[]): Promise<void>;
  getFields(sessionId: string): Promise<ProfileField[]>;
  setFieldState(
    sessionId: string,
    key: string,
    state: FieldState,
    rawValue?: string,
  ): Promise<void>;
  saveRuleResult(sessionId: string, result: RuleResult): Promise<void>;
  getRuleResults(sessionId: string): Promise<RuleResult[]>;
  appendAudit(sessionId: string, entry: AuditEntry): Promise<void>;
  getAudit(sessionId: string): Promise<AuditEntry[]>;
  savePacket(sessionId: string, payload: PacketPayload): Promise<void>;
  getPacket(sessionId: string): Promise<PacketPayload | null>;
  exportSession(sessionId: string): Promise<{
    fields: ProfileField[];
    results: RuleResult[];
    audit: AuditEntry[];
    packet: PacketPayload | null;
  }>;
  hardDelete(sessionId: string): Promise<void>;
}
