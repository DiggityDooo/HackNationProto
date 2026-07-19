import { PrismaClient } from "@prisma/client";
import type { ProfileField, RuleResult, FieldState } from "../types";
import type { AuditEntry, PacketPayload, SessionStore } from "./store";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// The Prisma-generated row types mark every scalar as optional (DefaultSelection),
// so we coerce at the boundary into our strict domain types.
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

export class PrismaSessionStore implements SessionStore {
  async createSession(): Promise<string> {
    const s = await prisma.session.create({ data: {} });
    return s.id;
  }

  async getSession(id: string) {
    const s = await prisma.session.findUnique({ where: { id } });
    return s ? { id: s.id, deletedAt: s.deletedAt } : null;
  }

  async saveFields(sessionId: string, fields: ProfileField[]) {
    await prisma.$transaction([
      prisma.profileField.deleteMany({ where: { sessionId } }),
      prisma.profileField.createMany({
        data: fields.map((f) => ({
          sessionId,
          key: f.key,
          rawValue: f.rawValue,
          state: f.state,
          confidence: f.confidence,
          sourceDocId: f.sourceDocId,
          evidenceBox: f.evidenceBox,
          ruleYear: f.ruleYear,
          effectiveDate: f.effectiveDate,
          geography: f.geography,
          sourceUrl: f.sourceUrl,
          datasetRelease: f.datasetRelease,
        })),
      }),
    ]);
  }

  async getFields(sessionId: string): Promise<ProfileField[]> {
    const rows = (await prisma.profileField.findMany({ where: { sessionId } })) as unknown as Array<
      Record<string, unknown>
    >;
    return rows.map((r) => ({
      sessionId,
      key: str(r.key) as ProfileField["key"],
      rawValue: str(r.rawValue),
      state: str(r.state) as FieldState,
      confidence: num(r.confidence),
      sourceDocId: str(r.sourceDocId),
      evidenceBox: str(r.evidenceBox),
      ruleYear: str(r.ruleYear) as ProfileField["ruleYear"],
      effectiveDate: str(r.effectiveDate),
      geography: str(r.geography),
      sourceUrl: str(r.sourceUrl),
      datasetRelease: str(r.datasetRelease),
    }));
  }

  async setFieldState(sessionId: string, key: string, state: FieldState, rawValue?: string) {
    const current = await prisma.profileField.findFirst({ where: { sessionId, key } });
    if (!current) return;
    await prisma.profileField.update({
      where: { id: current.id },
      data: { state, rawValue: rawValue ?? current.rawValue },
    });
  }

  async saveRuleResult(sessionId: string, result: RuleResult) {
    await prisma.ruleResult.create({
      data: {
        sessionId,
        ruleId: result.ruleId,
        ruleYear: result.ruleYear,
        effectiveDate: result.effectiveDate,
        geography: result.geography,
        sourceUrl: result.sourceUrl,
        citation: result.citation,
        inputRefs: JSON.stringify(result.inputRefs),
        threshold: result.threshold,
        formula: result.formula,
        value: result.value,
        band: result.band,
        abstained: result.abstained,
        abstainReason: result.abstainReason ?? null,
      },
    });
  }

  async getRuleResults(sessionId: string): Promise<RuleResult[]> {
    const rows = (await prisma.ruleResult.findMany({ where: { sessionId } })) as unknown as Array<
      Record<string, unknown>
    >;
    return rows.map((r) => ({
      ruleId: str(r.ruleId),
      ruleYear: str(r.ruleYear) as RuleResult["ruleYear"],
      effectiveDate: str(r.effectiveDate),
      geography: str(r.geography),
      sourceUrl: str(r.sourceUrl),
      citation: str(r.citation),
      inputRefs: JSON.parse(str(r.inputRefs, "{}")) as Record<string, string>,
      threshold: num(r.threshold),
      formula: str(r.formula),
      value: num(r.value),
      band: str(r.band) as RuleResult["band"],
      abstained: Boolean(r.abstained),
      abstainReason: r.abstainReason == null ? undefined : str(r.abstainReason),
    }));
  }

  async appendAudit(sessionId: string, entry: AuditEntry) {
    await prisma.auditLog.create({
      data: {
        sessionId,
        action: entry.action,
        detail: entry.detail ?? null,
        ruleVersion: entry.ruleVersion ?? null,
      },
    });
  }

  async getAudit(sessionId: string): Promise<AuditEntry[]> {
    const rows = (await prisma.auditLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    })) as unknown as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      action: str(r.action),
      detail: r.detail == null ? undefined : str(r.detail),
      ruleVersion: r.ruleVersion == null ? undefined : str(r.ruleVersion),
    }));
  }

  async savePacket(sessionId: string, payload: PacketPayload) {
    await prisma.packet.upsert({
      where: { sessionId },
      create: { sessionId, status: "ready", payload: JSON.stringify(payload) },
      update: { status: "ready", payload: JSON.stringify(payload) },
    });
  }

  async getPacket(sessionId: string): Promise<PacketPayload | null> {
    const row = await prisma.packet.findUnique({ where: { sessionId } });
    return row ? (JSON.parse(str(row.payload, "null")) as PacketPayload) : null;
  }

  async exportSession(sessionId: string) {
    const [fields, results, audit, packet] = await Promise.all([
      this.getFields(sessionId),
      this.getRuleResults(sessionId),
      this.getAudit(sessionId),
      this.getPacket(sessionId),
    ]);
    return { fields, results, audit, packet };
  }

  async hardDelete(sessionId: string) {
    await prisma.session.delete({ where: { id: sessionId } });
  }
}
