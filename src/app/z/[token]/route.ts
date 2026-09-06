// Wejście gościa przez jego unikalny, prywatny link: /z/<token>.
// To jedyne miejsce w całej aplikacji, gdzie wolno wyszukiwać gościa po
// tokenie - po udanym dopasowaniu zamieniamy go od razu na sesję (ciasteczko),
// żeby przy kolejnych wizytach gość nie musiał nosić tokenu w adresie.

import { NextRequest, NextResponse } from "next/server";
import { findGuestByTokenForLogin } from "@/lib/db/guests";
import { findWeddingById } from "@/lib/db/weddings";
import { createGuestSession } from "@/lib/auth/guest";
import { hasCurrentConsent } from "@/lib/db/consents";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const guest = findGuestByTokenForLogin(token);

  if (!guest) {
    return NextResponse.redirect(new URL("/?error=invalid-invite", request.url));
  }

  const wedding = findWeddingById(guest.weddingId);
  if (!wedding) {
    return NextResponse.redirect(new URL("/?error=invalid-invite", request.url));
  }

  await createGuestSession(guest.id, guest.weddingId);

  // RODO - gość bez jeszcze zapisanej zgody musi ją najpierw potwierdzić
  // (patrz src/app/w/[slug]/zgoda) - zwracający gość z ważną zgodą leci
  // dalej bez dodatkowego kroku, jak dotychczas.
  const nextPath = hasCurrentConsent("GUEST", guest.id)
    ? `/w/${wedding.slug}/moje-zaproszenie`
    : `/w/${wedding.slug}/zgoda`;

  return NextResponse.redirect(new URL(nextPath, request.url));
}
