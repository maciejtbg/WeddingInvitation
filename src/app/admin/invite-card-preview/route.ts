// Podgląd karty zaproszenia BEZ konkretnego gościa - do strony wyboru
// wariantu (/admin/invite-card), żeby para mogła zobaczyć i wybrać styl,
// zanim jeszcze doda pierwszego gościa. Kod/QR na podglądzie są przykładowe,
// nie prowadzą do żadnej prawdziwej sesji gościa.

import { NextRequest, NextResponse } from "next/server";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { getTheme } from "@/lib/themes";
import { generateInviteCardPng, isInviteCardVariant, DEFAULT_INVITE_CARD_VARIANT } from "@/lib/inviteCard";

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

export async function GET(request: NextRequest) {
  const session = await getCoupleSession();
  if (!session) return NextResponse.json({ error: "Brak sesji" }, { status: 401 });

  const weddingId = request.nextUrl.searchParams.get("weddingId") ?? "";
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const theme = getTheme(wedding.theme);
  const variantParam = request.nextUrl.searchParams.get("variant");
  const variant = isInviteCardVariant(variantParam) ? variantParam : DEFAULT_INVITE_CARD_VARIANT;

  const png = await generateInviteCardPng({
    theme,
    variant,
    partner1Name: wedding.partner1Name,
    partner2Name: wedding.partner2Name,
    weddingDateLabel: formatDate(wedding.weddingDate),
    shortCode: "ABCD-1234",
    siteHost: request.nextUrl.host,
    inviteUrl: `${request.nextUrl.origin}/${wedding.slug}`,
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
    },
  });
}
