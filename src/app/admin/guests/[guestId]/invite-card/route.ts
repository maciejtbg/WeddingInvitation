// Zwraca obrazek PNG zaproszenia (kod QR + kod ręczny) dla jednego gościa -
// do pobrania i wysłania jako obrazek zamiast wklejania linku tekstem.
// Patrz src/lib/inviteCard.ts.

import { NextRequest, NextResponse } from "next/server";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminFindGuestById } from "@/lib/db/guests";
import { getTheme } from "@/lib/themes";
import { generateInviteCardPng } from "@/lib/inviteCard";

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
  const png = await generateInviteCardPng({
    theme,
    partner1Name: wedding.partner1Name,
    partner2Name: wedding.partner2Name,
    weddingDateLabel: formatDate(wedding.weddingDate),
    shortCode: guest.shortCode,
    siteHost: request.nextUrl.host,
    inviteUrl: `${request.nextUrl.origin}/z/${guest.token}`,
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="zaproszenie-${guest.firstName.toLowerCase()}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
