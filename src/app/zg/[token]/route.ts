// Wejście przedstawiciela grupy przez wspólny link zaproszenia grupowego:
// /zg/<token> (patrz src/lib/db/groups.ts - adminGenerateGroupInviteToken).
// Analogicznie do src/app/z/[token]/route.ts, ale zamiast sesji jednego
// gościa zakłada sesję grupową (src/lib/auth/groupGuest.ts) dającą dostęp
// do wszystkich osób z tej grupy naraz.

import { NextRequest, NextResponse } from "next/server";
import { findGroupByInviteToken } from "@/lib/db/groups";
import { findWeddingById } from "@/lib/db/weddings";
import { createGroupSession } from "@/lib/auth/groupGuest";
import { externalOrigin } from "@/lib/externalOrigin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const origin = externalOrigin(request);
  const group = findGroupByInviteToken(token);

  if (!group) {
    return NextResponse.redirect(new URL("/?error=invalid-invite", origin));
  }

  const wedding = findWeddingById(group.weddingId);
  if (!wedding) {
    return NextResponse.redirect(new URL("/?error=invalid-invite", origin));
  }

  await createGroupSession(group.id, group.weddingId);

  // Zgoda RODO zbierana jest wprost na stronie grupowej (dotyczy naraz kilku
  // osób, więc nie pasuje do jednoosobowej bramki /zgoda) - patrz
  // src/app/[slug]/grupa/page.tsx.
  return NextResponse.redirect(new URL(`/${wedding.slug}/grupa`, origin));
}
