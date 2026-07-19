// Safety layer. All guards are deterministic and do NOT rely on the LLM to
// behave — they run on the data and on outputs before anything is shown.

// Verdict language we must never produce or let through.
const VERDICT_PATTERNS = [
  /\b(you are|applicant is|household is)\s+(eligible|approved|denied|qualified|not eligible|ineligible)\b/i,
  /\b(decided|determined|certified)\s+(you|the applicant|eligibility)\b/i,
  /\b(auto[- ]?submit)\b/i,
  /\b(approve|deny|reject)\s+(the )?(application|packet)\b/i,
];

// Instructions embedded in untrusted document text that attempt to alter
// system behavior. We never execute them; we only detect for logging/abstain.
const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|all)\s+instructions/i,
  /disregard\s+(safety|rules|previous)/i,
  /system\s*:/i,
  /you are (now )?(authorized|instructed|required) to/i,
  /override\s+(all\s+)?(rules|limits|safety)/i,
  /mark\s+(this|the applicant)\s+(eligible|approved)/i,
];

export function detectInjection(text: string): { flagged: boolean; hits: string[] } {
  const hits: string[] = [];
  for (const p of INJECTION_PATTERNS) {
    if (p.test(text)) hits.push(p.source);
  }
  return { flagged: hits.length > 0, hits };
}

export function containsVerdict(text: string): boolean {
  return VERDICT_PATTERNS.some((p) => p.test(text));
}

// Blocks any output that delivers an eligibility verdict. Returns either the
// safe text or a refusal redirecting to rule + confirmed input + calc.
export function guardVerdict(
  text: string,
  redirect: { ruleYear: string; citation: string },
): { safe: boolean; text: string } {
  if (!containsVerdict(text)) return { safe: true, text };
  return {
    safe: false,
    text:
      "I can't decide eligibility or approval — that is a qualified human's decision. " +
      `I can show you the published ${redirect.ruleYear} rule (${redirect.citation}) ` +
      "and the math from your confirmed inputs. Would you like to see that?",
  };
}

// Central refusal for "decide for me" requests.
export function refuseToDecide(ruleYear: string, citation: string): string {
  return (
    "I don't decide eligibility, approval, or denials — that's a qualified human at the property. " +
    `I can explain the ${ruleYear} rule (${citation}), show the income-to-limit math from your ` +
    "confirmed inputs, and flag documents you may still need. Which would you like?"
  );
}
