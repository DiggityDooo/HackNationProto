import type { ChecklistItem } from "../corpus/loader";
import type { ChecklistStatus, ProfileField } from "../types";

export interface ChecklistEval {
  id: string;
  label: string;
  description: string;
  status: ChecklistStatus;
  detail: string;
}

// Maps confirmed profile fields / doc dates onto the gold checklist to produce
// READINESS statuses only — never approval. Expiry uses each item's
// expiryMonths relative to the document date (or today if unknown).
function monthsSince(isoDate: string | null, now: Date): number | null {
  if (!isoDate) return null;
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return null;
  const months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
  return months;
}

export function evaluateChecklist(
  items: ChecklistItem[],
  fields: ProfileField[],
  now: Date = new Date(),
): ChecklistEval[] {
  const confirmed = fields.filter((f) => f.state === "confirmed" || f.state === "corrected");
  const hasIncome = confirmed.some((f) => f.key === "annualIncome" && Number(f.rawValue) > 0);
  const hasName = confirmed.some((f) => f.key === "applicantName" && f.rawValue.trim().length > 0);
  const docDate = confirmed.find((f) => f.key === "documentDate")?.rawValue ?? null;

  return items.map((item): ChecklistEval => {
    switch (item.id) {
      case "id-proof":
        return status(item, hasName ? "present" : "missing",
          hasName ? "Name confirmed from document." : "No confirmed photo ID document yet.");
      case "income-proof":
        if (!hasIncome) return status(item, "missing", "No confirmed income document.");
        if (item.expiryMonths > 0) {
          const age = monthsSince(docDate, now);
          if (age != null && age > item.expiryMonths) {
            return status(item, "expired", `Income doc is ${age} months old (>${item.expiryMonths}).`);
          }
        }
        return status(item, "present", "Income document confirmed and within validity.");
      case "household-composition":
        return status(item, confirmed.some((f) => f.key === "householdSize")
          ? "present" : "missing",
          confirmed.some((f) => f.key === "householdSize")
            ? "Household size confirmed." : "Household composition not yet confirmed.");
      case "asset-statement":
        return status(item, "needs review", "Upload a bank/asset statement to confirm.");
      case "prior-address":
        return status(item, "needs review", "Add prior address / rental history.");
      case "ssn-or-itin":
        return status(item, "needs review", "Provide SSN/ITIN documentation when ready.");
      default:
        return status(item, "needs review", "Review required.");
    }
  });
}

function status(item: ChecklistItem, s: ChecklistStatus, detail: string): ChecklistEval {
  return { id: item.id, label: item.label, description: item.description, status: s, detail };
}
