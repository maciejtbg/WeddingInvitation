// Sesja przedstawiciela grupy. Powstaje wyłącznie po wejściu na wspólny link
// zaproszenia grupowego (patrz app/zg/[token]/route.ts) - niezależna od
// zwykłej sesji pojedynczego gościa (guest.ts): ta sesja niesie groupId
// zamiast guestId, więc daje dostęp do WSZYSTKICH gości należących do tej
// grupy naraz (patrz groupListMemberViews w src/lib/db/guests.ts), nigdy do
// gości spoza niej.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession, verifySession } from "./session";

const COOKIE_NAME = "group_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365; // rok - tak samo jak sesja pojedynczego gościa

interface GroupSessionPayload {
  groupId: string;
  weddingId: string;
  [key: string]: unknown;
}

export async function createGroupSession(groupId: string, weddingId: string): Promise<void> {
  const token = await signSession({ groupId, weddingId }, SESSION_TTL_SECONDS);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getGroupSession(): Promise<GroupSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession<GroupSessionPayload>(token);
  if (!payload?.groupId || !payload?.weddingId) return null;
  return { groupId: payload.groupId, weddingId: payload.weddingId };
}

export async function requireGroupSessionOrRedirect(
  fallbackSlug: string
): Promise<GroupSessionPayload> {
  const session = await getGroupSession();
  if (!session) {
    redirect(`/${fallbackSlug}`);
  }
  return session;
}
