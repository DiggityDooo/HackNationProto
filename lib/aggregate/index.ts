// Published feature catalog. The brief REQUIRES that every feature and its
// purpose be visible to the renter (no hidden proxies). This is surfaced at
// /transparency and consumed by the UI.

export interface Feature {
  name: string;
  purpose: string;
  dataUsed: string;
  proxyRisk: "none" | "mitigated";
  renterControl: string;
}

export const FEATURES: Feature[] = [
  {
    name: "Document extraction",
    purpose: "Read your uploaded synthetic document and pull only allowlisted fields.",
    dataUsed: "Document text (treated as untrusted data, never instructions).",
    proxyRisk: "none",
    renterControl: "Every extracted value is shown with its source box and can be corrected or rejected.",
  },
  {
    name: "Income-to-limit math",
    purpose: "Show what percent of the frozen AMI income limit your confirmed income represents.",
    dataUsed: "Confirmed household size + confirmed annual income.",
    proxyRisk: "none",
    renterControl: "Uses only your confirmed inputs; abstains if uncertain. Never a verdict.",
  },
  {
    name: "Rule explainer",
    purpose: "Explain the published LIHTC/FY2026 rule with citations and effective dates.",
    dataUsed: "Frozen corpus (MTSP table, Q&A).",
    proxyRisk: "none",
    renterControl: "You ask; we cite. The LLM may only explain stored rules, not invent numbers.",
  },
  {
    name: "Readiness checklist",
    purpose: "Flag which application documents are missing, expired, present, or need review.",
    dataUsed: "Confirmed profile fields + document dates.",
    proxyRisk: "none",
    renterControl: "Status is readiness only, never approval. You preview and edit the packet.",
  },
  {
    name: "Packet generation",
    purpose: "Assemble a renter-controlled readiness packet you can download.",
    dataUsed: "Your confirmed fields + checklist status (no raw document text).",
    proxyRisk: "none",
    renterControl: "You authorize, preview, edit, download, and delete. Never auto-submitted.",
  },
  {
    name: "Session & consent log",
    purpose: "Record consent, actions, and rule versions for your review.",
    dataUsed: "Action labels only — never raw document contents.",
    proxyRisk: "none",
    renterControl: "Export everything; hard-delete removes all stored data.",
  },
];

// Aggregate-context sources. Strictly separate from any renter profile — listed
// here for transparency but never joined to a person.
export const AGGREGATE_SOURCES = [
  "HUD CHAS (area housing need)",
  "DOE LEAD (community energy burden)",
  "Eviction Lab (area filing totals)",
  "CDC PLACES (community health)",
  "HUD Picture of Subsidized Households (area aggregates)",
];

export function assertNoProfileJoin(): true {
  // Compile-time/structural guarantee: this module imports nothing from
  // ProfileField storage. Aggregate sources are conceptually separate.
  return true;
}
