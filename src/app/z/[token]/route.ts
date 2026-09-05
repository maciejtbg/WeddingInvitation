// Wejście gościa przez jego unikalny, prywatny link: /z/<token>.
// To jedyne miejsce w całej aplikacji, gdzie wolno wyszukiwać gościa po
// tokenie - po udanym dopasowaniu zamieniamy go od razu na sesję (ciasteczko),
// żeby przy kolejnych wizytach gość nie musiał nosić tokenu w adresie.

import { NextRequest, NextResponse } from "next/server";
import { findGuestByTokenForLogin } from "@/lib/db/guests";
import { findWeddingById } from "@/lib/db/weddings";
import { createGuestSession } from "@/lib/auth/guest";

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

  return NextResponse.redirect(
    new URL(`/w/${wedding.slug}/moje-zaproszenie`, request.url)
  );
}
