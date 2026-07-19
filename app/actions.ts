"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateSessionId, getSessionId, clearSessionCookie } from "@/lib/session/cookie";
import { getSessionStore } from "@/lib/session";
import type { PacketPayload } from "@/lib/session/store";
import { DEMO_CONFIG } from "@/data/config";
import { loadMtsp, loadSynthetic, loadChecklist, loadQa } from "@/lib/corpus/loader";
import { runExtraction, toProfileFields } from "@/lib/extract";
import { evaluateReadiness } from "@/lib/rules";
import { evaluateChecklist, type ChecklistEval } from "@/lib/rules/checklist";
import { guardVerdict, refuseToDecide } from "@/lib/safety/guard";
import type { FieldState } from "@/lib/types";

function ok<T>(data: T) {
  return { status: "success" as const, data };
}
function err(message: string) {
  return { status: "error" as const, error: message };
}

// --- Profile: upload/select a synthetic doc and extract allowlisted fields ---
export async function extractDocument(docId: string) {
  const doc = loadSynthetic().find((d) => d.id === docId);
  if (!doc) return err("Unknown document.");
  const sessionId = await getOrCreateSessionId();
  const store = getSessionStore();
  const result = await runExtraction({
    docId: doc.id,
    text: doc.text,
    config: DEMO_CONFIG,
    gold: doc.gold,
  });
  const fields = toProfileFields(sessionId, doc.id, result, DEMO_CONFIG);
  await store.saveFields(sessionId, fields);
  await store.appendAudit(sessionId, {
    action: "extract",
    detail:
      `Extracted ${fields.length} fields from ${doc.id}` +
      (result.injectionDetected ? " (injection detected, inert)" : ""),
    ruleVersion: `${DEMO_CONFIG.program}/${DEMO_CONFIG.ruleYear}`,
  });
  revalidatePath("/profile");
  return ok({
    fields,
    droppedKeys: result.droppedKeys,
    injectionDetected: result.injectionDetected,
  });
}

export async function confirmField(key: string, rawValue: string, corrected: boolean) {
  const sessionId = await getOrCreateSessionId();
  const store = getSessionStore();
  const state: FieldState = corrected ? "corrected" : "confirmed";
  await store.setFieldState(sessionId, key, state, rawValue);
  await store.appendAudit(sessionId, {
    action: corrected ? "correct" : "confirm",
    detail: `Field ${key} ${corrected ? "corrected" : "confirmed"}`,
    ruleVersion: `${DEMO_CONFIG.program}/${DEMO_CONFIG.ruleYear}`,
  });
  revalidatePath("/profile");
  revalidatePath("/understand");
  revalidatePath("/prepare");
  return ok({ key, state });
}

// --- Understand: deterministic rule calc + Q&A ---
export async function computeReadiness() {
  const sessionId = await getOrCreateSessionId();
  const store = getSessionStore();
  const fields = await store.getFields(sessionId);
  const table = loadMtsp();
  const result = evaluateReadiness(table, DEMO_CONFIG, fields);
  if (!result.abstained) {
    await store.saveRuleResult(sessionId, result);
  }
  await store.appendAudit(sessionId, {
    action: "calc",
    detail: result.abstained
      ? `Abstained: ${result.abstainReason}`
      : `Readiness band: ${result.band} (${result.value}% of limit)`,
    ruleVersion: `${DEMO_CONFIG.program}/${DEMO_CONFIG.ruleYear}`,
  });
  revalidatePath("/understand");
  return ok(result);
}

export async function askRule(question: string) {
  // Safety: never produce a verdict. If the question asks us to decide, refuse.
  if (/(decide|eligible|approved|denied|qualif(y|ied))\b/i.test(question)) {
    const refusal = refuseToDecide(DEMO_CONFIG.ruleYear, loadMtsp().sourceUrl);
    return ok({ refusal: true, answer: refusal, citation: undefined, sourceUrl: undefined });
  }
  const qa = loadQa();
  const match = qa.find((q) => q.question.toLowerCase().includes(question.trim().toLowerCase()));
  if (!match) {
    return ok({
      refusal: true,
      answer:
        "I don't have a cited answer for that specific question. Try asking about income limits, what counts as income, or the readiness process.",
      citation: undefined,
      sourceUrl: undefined,
    });
  }
  const picked = match;
  const guarded = guardVerdict(picked.answer, {
    ruleYear: DEMO_CONFIG.ruleYear,
    citation: picked.citation,
  });
  return ok({
    refusal: false,
    answer: guarded.text,
    citation: picked.citation,
    sourceUrl: picked.sourceUrl,
  });
}

// --- Prepare: checklist gap + packet export/delete ---
export async function getChecklist() {
  const sessionId = await getOrCreateSessionId();
  const store = getSessionStore();
  const fields = await store.getFields(sessionId);
  const items = loadChecklist();
  const evals: ChecklistEval[] = evaluateChecklist(items, fields);
  return ok(evals);
}

export type PacketPreview = PacketPayload;

export async function previewPacket(): Promise<{
  status: "success" | "error";
  data?: PacketPreview;
  error?: string;
}> {
  try {
    const sessionId = await getOrCreateSessionId();
    const store = getSessionStore();
    const fields = await store.getFields(sessionId);
    const items = loadChecklist();
    const checklist = evaluateChecklist(items, fields);
    const confirmed = fields.filter((f) => f.state === "confirmed" || f.state === "corrected");
    const preview: PacketPreview = {
      fields: confirmed.map((f) => ({ key: f.key, rawValue: f.rawValue, state: f.state })),
      checklist,
      readinessNote:
        "This packet shows your confirmed inputs and document readiness. It is NOT an eligibility decision and is never auto-submitted.",
    };
    await store.savePacket(sessionId, preview);
    await store.appendAudit(sessionId, {
      action: "packet_preview",
      detail: `Packet previewed with ${checklist.length} checklist items`,
      ruleVersion: `${DEMO_CONFIG.program}/${DEMO_CONFIG.ruleYear}`,
    });
    revalidatePath("/prepare");
    return ok(preview);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Could not preview packet.");
  }
}

export async function deletePacket() {
  const sessionId = await getSessionId();
  if (!sessionId) return err("No active session.");
  const store = getSessionStore();
  await store.deletePacket(sessionId);
  await store.appendAudit(sessionId, {
    action: "packet_delete",
    detail: "Packet deleted by renter",
  });
  revalidatePath("/prepare");
  return ok({ deleted: true });
}

export async function exportSession() {
  const sessionId = await getSessionId();
  if (!sessionId) return err("No active session.");
  const store = getSessionStore();
  const data = await store.exportSession(sessionId);
  return ok(data);
}

// --- Safety: hard delete session + all child data ---
export async function deleteSession() {
  const sessionId = await getSessionId();
  if (!sessionId) return err("No active session.");
  const store = getSessionStore();
  // Export first so the renter can prove prior state (required by deletion test).
  const snapshot = await store.exportSession(sessionId);
  try {
    await store.hardDelete(sessionId);
  } catch (error) {
    return err(
      "Could not delete session: " + (error instanceof Error ? error.message : "unknown error"),
    );
  }
  await clearSessionCookie();
  revalidatePath("/profile");
  revalidatePath("/understand");
  revalidatePath("/prepare");
  return ok({ deleted: true, snapshotBeforeDeletion: snapshot });
}
