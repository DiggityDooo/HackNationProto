import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { DemoConfig } from "@/data/config";
import { PROFILE_FIELD_KEYS, type ProfileFieldKey } from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
const jsonCache = new Map<string, unknown>();

function readJson(name: string): unknown {
  const cached = jsonCache.get(name);
  if (cached !== undefined) return cached;
  const file = path.join(DATA_DIR, name);
  if (!fs.existsSync(file)) {
    throw new Error(
      `Fixture missing: data/${name}. The demo is gated on the organizer pack; ` +
        `add a smoke fixture or the real pack before running.`,
    );
  }
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  jsonCache.set(name, parsed);
  return parsed;
}

const configSchema = z.object({
  metro: z.string(),
  program: z.literal("LIHTC"),
  ruleYear: z.literal("FY2026"),
  amiThreshold: z.union([z.literal(30), z.literal(50), z.literal(60), z.literal(80)]),
  sourceRelease: z.string(),
  effectiveDate: z.string(),
  sourceUrl: z.string(),
  geography: z.string(),
  datasetAsOf: z.string(),
});

export function loadConfig(): DemoConfig {
  return configSchema.parse(readJson("config.json")) as DemoConfig;
}

const mtspSchema = z.object({
  meta: z.object({ effectiveDate: z.string(), sourceUrl: z.string() }).passthrough(),
  limits: z.record(
    z.string(),
    z.record(z.string(), z.record(z.enum(["30", "50", "60", "80"]), z.number())),
  ),
});

export interface MtspTable {
  effectiveDate: string;
  sourceUrl: string;
  get(geography: string, householdSize: number, amiPercent: number): number | null;
}

export function loadMtsp(): MtspTable {
  const parsed = mtspSchema.parse(readJson("mtsp-fy2026.json"));
  const limits = parsed.limits;
  return {
    effectiveDate: parsed.meta.effectiveDate,
    sourceUrl: parsed.meta.sourceUrl,
    get(geography, householdSize, amiPercent) {
      const bySize = limits[geography];
      if (!bySize) return null;
      const byAmi = bySize[String(householdSize)] as
        Partial<Record<"30" | "50" | "60" | "80", number>> | undefined;
      if (!byAmi) return null;
      return byAmi[String(amiPercent) as "30" | "50" | "60" | "80"] ?? null;
    },
  };
}

const checklistSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      expiryMonths: z.number().default(0),
      expiryDays: z.number().optional(),
      description: z.string(),
    }),
  ),
});

export interface ChecklistItem {
  id: string;
  label: string;
  expiryMonths: number;
  /** When set (>0), preferred over expiryMonths (pack CH-READINESS-001 uses 60 days). */
  expiryDays?: number;
  description: string;
}

export function loadChecklist(): ChecklistItem[] {
  const parsed = checklistSchema.parse(readJson("checklist.json"));
  return parsed.items;
}

const qaSchema = z.object({
  qa: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      answer: z.string(),
      citation: z.string(),
      sourceUrl: z.string(),
    }),
  ),
});

export interface QaEntry {
  id: string;
  question: string;
  answer: string;
  citation: string;
  sourceUrl: string;
}

export function loadQa(): QaEntry[] {
  const parsed = qaSchema.parse(readJson("qa.json"));
  return parsed.qa;
}

const syntheticSchema = z.object({
  documents: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      text: z.string(),
      gold: z.record(
        z.string(),
        z.object({
          value: z.string(),
          evidenceBox: z.string(),
          confidence: z.number(),
        }),
      ),
    }),
  ),
});

export interface SyntheticDoc {
  id: string;
  type: string;
  text: string;
  gold: Record<string, { value: string; evidenceBox: string; confidence: number }>;
}

export function loadSynthetic(): SyntheticDoc[] {
  const parsed = syntheticSchema.parse(readJson("synthetic/index.json"));
  return parsed.documents;
}

export function getSyntheticDoc(id: string): SyntheticDoc | null {
  return loadSynthetic().find((d) => d.id === id) ?? null;
}

// Validator used by the extractor to enforce the allowlist at the type level.
export function isProfileFieldKey(k: string): k is ProfileFieldKey {
  return (PROFILE_FIELD_KEYS as readonly string[]).includes(k);
}

/** Authoritative Boston slice from organizer pack CSV (50/60 only). */
export function loadMtspBostonPack(): MtspTable {
  const parsed = mtspSchema.parse(readJson("mtsp-boston-pack.json"));
  const limits = parsed.limits;
  return {
    effectiveDate: parsed.meta.effectiveDate,
    sourceUrl: parsed.meta.sourceUrl,
    get(geography, householdSize, amiPercent) {
      const bySize = limits[geography];
      if (!bySize) return null;
      const byAmi = bySize[String(householdSize)] as
        Partial<Record<"30" | "50" | "60" | "80", number>> | undefined;
      if (!byAmi) return null;
      return byAmi[String(amiPercent) as "30" | "50" | "60" | "80"] ?? null;
    },
  };
}

const lihtcSchema = z.object({
  meta: z.object({ count: z.number(), note: z.string() }).passthrough(),
  projects: z.array(
    z
      .object({
        hud_id: z.string(),
        name: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        availability: z.literal("unknown"),
        source: z.string(),
      })
      .passthrough(),
  ),
});

export type LihtcProject = z.infer<typeof lihtcSchema>["projects"][number];

export function loadLihtcBoston(): LihtcProject[] {
  return lihtcSchema.parse(readJson("lihtc-boston.json")).projects;
}

const rulesSchema = z.object({
  rules: z.array(
    z
      .object({
        rule_id: z.string(),
        text: z.string(),
        source_url: z.string().nullable().optional(),
        effective_date: z.string().nullable().optional(),
        authority: z.string().optional(),
        source_locator: z.string().optional(),
      })
      .passthrough(),
  ),
});

export function loadRulesCorpus() {
  return rulesSchema.parse(readJson("rules-corpus.json")).rules;
}

export function loadAdversarialPack(): unknown[] {
  const raw = readJson("adversarial.json") as { pack_tests?: unknown[] };
  return raw.pack_tests ?? [];
}
