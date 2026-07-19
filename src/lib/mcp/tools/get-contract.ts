import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { CONTRACT } from "@/lib/realdoor-contract";

export default defineTool({
  name: "get_contract",
  title: "Get RealDoor frozen contract",
  description:
    "Return the frozen RealDoor Boston FY2026 contract: geography, effective/simulation dates, evidence currency, stages, safety copy, and citation.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(CONTRACT, null, 2) }],
    structuredContent: { contract: CONTRACT },
  }),
});
