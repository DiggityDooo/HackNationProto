import { getSessionId } from "@/lib/session/cookie";
import { getSessionStore } from "@/lib/session";
import { loadMtsp, loadQa } from "@/lib/corpus/loader";
import { evaluateReadiness } from "@/lib/rules";
import { DEMO_CONFIG } from "@/data/config";
import { UnderstandClient } from "@/components/understand-client";
import type { RuleResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UnderstandPage() {
  const sessionId = await getSessionId();
  let initial: RuleResult | null = null;
  if (sessionId) {
    const fields = await getSessionStore().getFields(sessionId);
    initial = evaluateReadiness(loadMtsp(), DEMO_CONFIG, fields);
    if (initial.abstained) initial = null;
  }
  const qa = loadQa().map((q) => ({ id: q.id, question: q.question, citation: q.citation }));
  return <UnderstandClient initialResult={initial} qa={qa} />;
}
