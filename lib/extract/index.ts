import { z } from "zod";
import { isProfileFieldKey, type SyntheticDoc } from "../corpus/loader";
import { detectInjection } from "../safety/guard";
import type { DemoConfig } from "@/data/config";
import type { ProfileField, ProfileFieldKey } from "../types";

// The extractor receives document text as ISOLATED DATA. It is never
// interpolated into a system prompt or tool schema. Embedded instructions are
// detected and inert (see detectInjection). Output is zod-validated and only
// allowlisted keys survive.

export interface ExtractInput {
  docId: string;
  text: string;
  config: DemoConfig;
  // Optional gold reference for offline/demo extraction (organizer pack).
  gold?: SyntheticDoc["gold"];
}

const extractOutputSchema = z.record(
  z.string(),
  z.object({
    value: z.string(),
    evidenceBox: z.string(),
    confidence: z.number().min(0).max(1),
  }),
);

export type ExtractedField = z.infer<typeof extractOutputSchema>;

export interface ExtractResult {
  fields: Array<{
    key: ProfileFieldKey;
    value: string;
    evidenceBox: string;
    confidence: number;
    // True when the source doc contained injection attempts (still inert).
    injectionDetected: boolean;
  }>;
  droppedKeys: string[];
  injectionDetected: boolean;
}

// The LLM provider boundary. Default implementation is a local/deterministic
// extractor (gold + regex) so the demo runs without external API keys. Swap by
// implementing Extractor and injecting via createExtractor.
export interface Extractor {
  extract(input: ExtractInput): Promise<ExtractedField>;
}

// Offline extractor: uses gold when present, else regex heuristics. This keeps
// the demo fully functional and deterministic without a paid model.
class LocalExtractor implements Extractor {
  async extract(input: ExtractInput): Promise<ExtractedField> {
    if (input.gold) return input.gold as ExtractedField;
    return regexExtract(input.text);
  }
}

function regexExtract(text: string): ExtractedField {
  const out: ExtractedField = {};
  const name = text.match(/Employee:\s*([^\n]+)|Benefit Recipient:\s*([^\n]+)/i);
  if (name) out.applicantName = { value: (name[1] ?? name[2] ?? "").trim(), evidenceBox: name[0], confidence: 0.9 };
  const size = text.match(/(\d+)-person household/i) ?? text.match(/Household Size on Record:\s*(\d+)/i);
  if (size) out.householdSize = { value: size[1] ?? "", evidenceBox: size[0], confidence: 0.85 };
  const ytd = text.match(/YTD Gross:\s*\$?([\d,]+\.\d{2})/i);
  if (ytd && ytd[1]) {
    const annual = Math.round(parseFloat(ytd[1].replace(/,/g, "")) * 2.5);
    out.annualIncome = { value: String(annual), evidenceBox: ytd[0], confidence: 0.7 };
  }
  return out;
}

export function createExtractor(provider?: Extractor): Extractor {
  return provider ?? new LocalExtractor();
}

export async function runExtraction(
  input: ExtractInput,
  extractor: Extractor = createExtractor(),
): Promise<ExtractResult> {
  const rawUnvalidated = await extractor.extract(input);
  const raw = extractOutputSchema.parse(rawUnvalidated);
  const injection = detectInjection(input.text);

  const fields: ExtractResult["fields"] = [];
  const droppedKeys: string[] = [];
  for (const [k, v] of Object.entries(raw) as Array<[string, ExtractedField[string]]>) {
    if (!isProfileFieldKey(k)) {
      droppedKeys.push(k);
      continue;
    }
    const key: ProfileFieldKey = k;
    fields.push({
      key,
      value: v.value,
      evidenceBox: v.evidenceBox,
      confidence: v.confidence,
      injectionDetected: injection.flagged,
    });
  }
  return { fields, droppedKeys, injectionDetected: injection.flagged };
}

// Convert extraction result into stored ProfileField rows with provenance.
export function toProfileFields(
  sessionId: string,
  docId: string,
  result: ExtractResult,
  config: DemoConfig,
): ProfileField[] {
  return result.fields.map((f) => ({
    sessionId,
    key: f.key,
    rawValue: f.value,
    state: "extracted",
    confidence: f.confidence,
    sourceDocId: docId,
    evidenceBox: f.evidenceBox,
    ruleYear: config.ruleYear,
    effectiveDate: config.effectiveDate,
    geography: config.geography,
    sourceUrl: config.sourceUrl,
    datasetRelease: config.datasetAsOf,
  }));
}
