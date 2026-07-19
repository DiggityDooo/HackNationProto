import { getSessionId } from "@/lib/session/cookie";
import { getSessionStore } from "@/lib/session";
import { ProfileClient } from "@/components/profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionId = await getSessionId();
  const fields = sessionId ? await getSessionStore().getFields(sessionId) : [];
  return <ProfileClient initialFields={fields} />;
}
