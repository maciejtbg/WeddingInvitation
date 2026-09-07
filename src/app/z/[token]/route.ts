// Wejście gościa przez jego unikalny, prywatny link: /z/<token>.
// To jedyne miejsce w całej aplikacji, gdzie wolno wyszukiwać gościa po
// tokenie - po udanym dopasowaniu zamieniamy go od razu na sesję (ciasteczko),
// żeby przy kolejnych wizytach gość nie musiał nosić tokenu w adresie.

import { NextRequest, NextResponse } from "next/server";
import { findGuestByTokenForLogin } from "@/lib/db/guests";
import { findWeddingById } from "@/lib/db/weddings";
import { createGuestSession } from "@/lib/auth/guest";
import { hasCurrentConsent } from "@/lib/db/consents";

/** `request.url` w tej trasie odzwierciedla adres, POD KTÓRYM Next.js
 * faktycznie nasłuchuje (np. "http://localhost:3000"), nie publiczny adres
 * z przeglądarki gościa - za reverse proxy (nginx, tunel mikr.us/Cloudflare)
 * to dwie różne rzeczy. Bez tego przekierowanie po zeskanowaniu QR-a
 * prowadziłoby z powrotem na localhost:3000 zamiast na prawdziwą domenę -
 * złapane empirycznie przy wdrożeniu na mikr.us (patrz deploy/DEPLOY.md).
 * `X-Forwarded-Host`/`X-Forwarded-Proto` są ustawiane przez nginx (patrz
 * deploy/nginx.conf) - z fallbackiem na request.url dla `next dev` bez proxy. */
function externalOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

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

  // RODO - gość bez jeszcze zapisanej zgody musi ją najpierw potwierdzić
  // (patrz src/app/w/[slug]/zgoda) - zwracający gość z ważną zgodą leci
  // dalej bez dodatkowego kroku, jak dotychczas.
  const nextPath = hasCurrentConsent("GUEST", guest.id)
    ? `/w/${wedding.slug}/moje-zaproszenie`
    : `/w/${wedding.slug}/zgoda`;

  return NextResponse.redirect(new URL(nextPath, origin));
}
