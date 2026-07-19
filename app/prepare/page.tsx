import { getSessionId } from "@/lib/session/cookie";
import { getSessionStore } from "@/lib/session";
import { loadChecklist } from "@/lib/corpus/loader";
import { evaluateChecklist } from "@/lib/rules/checklist";
import { PrepareClient } from "@/components/prepare-client";

export const dynamic = "force-dynamic";

export default async function PreparePage() {
  const items = loadChecklist();
  let initialChecklist = evaluateChecklist(items, []);
  const sessionId = await getSessionId();
  if (sessionId) {
    try {
      const fields = await getSessionStore().getFields(sessionId);
      initialChecklist = evaluateChecklist(items, fields);
    } catch {
      // Keep empty-profile checklist if the session store is unavailable.
    }
  }
  return <PrepareClient initialChecklist={initialChecklist} />;
}
