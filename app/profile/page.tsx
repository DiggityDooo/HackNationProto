import { getSessionId } from "@/lib/session/cookie";
import { getSessionStore } from "@/lib/session";
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
  return <ProfileClient initialFields={fields} initialDocId={initialDocId} />;
}
