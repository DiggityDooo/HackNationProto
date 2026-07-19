import { cookies } from "next/headers";
import { getSessionStore } from "@/lib/session";

const COOKIE = "realdoor_session";

// Server-side session id resolution. We store the session id in an httpOnly
// cookie. Sessions are ephemeral and hard-deletable.
export async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id) {
    id = await getSessionStore().createSession();
    jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return id;
}

export async function getSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
