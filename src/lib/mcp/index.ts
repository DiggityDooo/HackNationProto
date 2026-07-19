import { defineMcp } from "@lovable.dev/mcp-js";
import getContractTool from "./tools/get-contract";
import mtspLimitTool from "./tools/mtsp-limit";
import listScenariosTool from "./tools/list-scenarios";
import safetyNoticeTool from "./tools/safety-notice";

export default defineMcp({
  name: "realdoor-mcp",
  title: "RealDoor — Application-Readiness Copilot (read-only)",
  version: "0.1.0",
  instructions:
    "Read-only tools for the RealDoor prototype. Exposes the frozen HUD FY2026 MTSP contract for Boston-Cambridge-Quincy, demo scenarios, and safety scope. RealDoor is assistive, not adjudicative — never emit eligibility verdicts (eligible/approved/denied/qualified/rejected/score/rank). Data is synthetic.",
  tools: [getContractTool, mtspLimitTool, listScenariosTool, safetyNoticeTool],
});
