// Wejście gościa przez jego unikalny, prywatny link: /z/<token>.
// To jedyne miejsce w całej aplikacji, gdzie wolno wyszukiwać gościa po
// tokenie - po udanym dopasowaniu zamieniamy go od razu na sesję (ciasteczko),
// żeby przy kolejnych wizytach gość nie musiał nosić tokenu w adresie.

import { NextRequest, NextResponse } from "next/server";
import { findGuestByTokenForLogin, markGuestFirstVisited } from "@/lib/db/guests";
import { findWeddingById } from "@/lib/db/weddings";
import { createGuestSession } from "@/lib/auth/guest";
import { hasCurrentConsent } from "@/lib/db/consents";
import { externalOrigin } from "@/lib/externalOrigin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const origin = externalOrigin(request);
  const guest = findGuestByTokenForLogin(token);

  if (!guest) {
    return NextResponse.redirect(new URL("/?error=invalid-invite", origin));
  }

  const wedding = findWeddingById(guest.weddingId);
  if (!wedding) {
    return NextResponse.redirect(new URL("/?error=invalid-invite", origin));
  }

  await createGuestSession(guest.id, guest.weddingId);
  markGuestFirstVisited(guest.id);

  // RODO - gość bez jeszcze zapisanej zgody musi ją najpierw potwierdzić
  // (patrz src/app/[slug]/zgoda) - zwracający gość z ważną zgodą leci
  // dalej bez dodatkowego kroku, jak dotychczas.
  const nextPath = hasCurrentConsent("GUEST", guest.id)
    ? `/${wedding.slug}/moje-zaproszenie`
    : `/${wedding.slug}/zgoda`;

  return NextResponse.redirect(new URL(nextPath, origin));
}
