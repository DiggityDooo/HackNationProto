import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { CONTRACT, frozenMtspLimit } from "@/lib/realdoor-contract";

export default defineTool({
  name: "mtsp_limit",
  title: "Look up frozen MTSP income limit",
  description:
    "Return the frozen HUD FY2026 MTSP annual income limit (USD) for the Boston-Cambridge-Quincy HMFA for a given household size (1-8) and AMI band (50 or 60). Household sizes outside 1-8 return null — RealDoor never extrapolates.",
  inputSchema: {
    householdSize: z
      .number()
      .int()
      .describe("Household size. Frozen table only covers 1-8."),
    amiBand: z
      .union([z.literal(50), z.literal(60)])
      .default(60)
      .describe("AMI band. Contract freezes only 50 and 60."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ householdSize, amiBand }) => {
    const limit = frozenMtspLimit(householdSize, amiBand);
    const payload = {
      householdSize,
      amiBand,
      limitAnnualUsd: limit,
      geography: CONTRACT.frozenContext.geography,
      effectiveDate: CONTRACT.frozenContext.effectiveDate,
      citation: CONTRACT.citation,
      abstained: limit === null,
      abstainReason:
        limit === null
          ? "Household size outside frozen 1-8 table. RealDoor does not extrapolate; request human review."
          : undefined,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
