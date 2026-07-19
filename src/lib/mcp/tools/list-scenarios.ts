import { defineTool } from "@lovable.dev/mcp-js";
import { CONTRACT } from "@/lib/realdoor-contract";

export default defineTool({
  name: "list_demo_scenarios",
  title: "List RealDoor demo scenarios",
  description:
    "List the synthetic Boston demo scenarios (HH-003 default, HH-005 expired evidence, HH-002 injection attempt) used by the RealDoor prototype.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const scenarios = CONTRACT.demoScenarios;
    return {
      content: [{ type: "text", text: JSON.stringify(scenarios, null, 2) }],
      structuredContent: { scenarios },
    };
  },
});
