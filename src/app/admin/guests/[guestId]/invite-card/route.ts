// Zwraca obrazek PNG zaproszenia (kod QR + kod ręczny) dla jednego gościa -
// do pobrania i wysłania jako obrazek zamiast wklejania linku tekstem.
// Patrz src/lib/inviteCard.ts.

import { NextRequest, NextResponse } from "next/server";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminFindGuestById } from "@/lib/db/guests";
import { getTheme } from "@/lib/themes";
import { generateInviteCardPng, isInviteCardVariant } from "@/lib/inviteCard";
import { externalOrigin } from "@/lib/externalOrigin";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const session = await getCoupleSession();
  if (!session) return NextResponse.json({ error: "Brak sesji" }, { status: 401 });

  const { guestId } = await params;
  const weddingId = request.nextUrl.searchParams.get("weddingId") ?? "";
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const guest = adminFindGuestById(wedding.id, guestId);
  if (!guest || !guest.shortCode) {
    return NextResponse.json({ error: "Nie znaleziono gościa" }, { status: 404 });
  }

  const theme = getTheme(wedding.theme);
  const variantParam = request.nextUrl.searchParams.get("variant");
  const variant = isInviteCardVariant(variantParam) ? variantParam : wedding.invitationCardVariant;
  // request.nextUrl.host/origin odzwierciedlają adres, POD KTÓRYM Next.js
  // faktycznie nasłuchuje (za nginx to "localhost:3000", nie publiczna
  // domena) - stąd externalOrigin() zamiast tego, patrz komentarz przy niej.
  const origin = externalOrigin(request);
  const png = await generateInviteCardPng({
    theme,
    variant,
    partner1Name: wedding.partner1Name,
    partner2Name: wedding.partner2Name,
    weddingDateLabel: formatDate(wedding.weddingDate),
    shortCode: guest.shortCode,
    siteHost: new URL(origin).host,
    inviteUrl: `${origin}/z/${guest.token}`,
  });

  // ?preview=1 - do podglądu na żywo w <img> na stronie wyboru wariantu
  // (patrz /admin/invite-card), bez wymuszania pobrania pliku.
  const isPreview = request.nextUrl.searchParams.get("preview") === "1";
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      ...(isPreview
        ? {}
        : {
            "Content-Disposition": `attachment; filename="zaproszenie-${guest.firstName.toLowerCase()}.png"`,
          }),
      "Cache-Control": "private, no-store",
    },
  });
}
