import { defineTool } from "@lovable.dev/mcp-js";
import { CONTRACT } from "@/lib/realdoor-contract";

export default defineTool({
  name: "safety_notice",
  title: "Get RealDoor safety and scope notice",
  description:
    "Return RealDoor's read-only scope, deflection rules, persistent notices, and the list of verdict terms the copilot never outputs (eligible, approved, denied, qualified, rejected, score, rank).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const payload = {
      copilotName: CONTRACT.safety.copilotName,
      copilotMode: CONTRACT.safety.copilotMode,
      contextBadge: CONTRACT.safety.contextBadge,
      persistentNotices: CONTRACT.safety.persistentNotices,
      neverOutput: CONTRACT.safety.neverOutput,
      note: "RealDoor Guide is assistive, not adjudicative. It explains rules and evidence; it does not decide eligibility, navigate, edit, export, or submit on the renter's behalf.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
