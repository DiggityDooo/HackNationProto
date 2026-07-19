import { getSessionId } from "@/lib/session/cookie";
import { getSessionStore } from "@/lib/session";
import { loadSynthetic } from "@/lib/corpus/loader";
import { ProfileClient } from "@/components/profile-client";
import type { ProfileField } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string | string[] }>;
}) {
  const sessionId = await getSessionId();
  let fields: ProfileField[] = [];
  if (sessionId) {
    try {
      fields = await getSessionStore().getFields(sessionId);
    } catch {
      fields = [];
    }
  }
  const { doc } = await searchParams;
  const initialDocId = typeof doc === "string" ? doc : "";
  const docs = loadSynthetic().map((d) => ({
    id: d.id,
    type: d.type,
    label: `${d.id} (${d.type})`,
  }));
  return (
    <ProfileClient initialFields={fields} initialDocId={initialDocId} docs={docs} />
  );
}
