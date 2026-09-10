// Zwraca plik .ics do dodania ślubu do kalendarza gościa (Google/Apple/
// Outlook) - patrz src/lib/calendarInvite.ts. Publiczne (jak reszta
// /[slug]) - nazwa pliku w Content-Disposition kończy się na .ics, żeby
// aplikacje kalendarza rozpoznały format mimo że sam URL go nie ma.

import { NextRequest, NextResponse } from "next/server";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { listLocations } from "@/lib/db/locations";
import { generateWeddingIcs } from "@/lib/calendarInvite";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const wedding = findWeddingBySlug(slug);
  if (!wedding || !wedding.weddingDate) {
    return NextResponse.json({ error: "Brak daty ślubu" }, { status: 404 });
  }

  const locations = listLocations(wedding.id);
  const mainLocation = locations.find((l) => l.kind === "CEREMONY") ?? locations[0] ?? null;
  const location = mainLocation
    ? `${mainLocation.label}${mainLocation.address ? `, ${mainLocation.address}` : ""}`
    : wedding.venueName
      ? `${wedding.venueName}${wedding.venueAddress ? `, ${wedding.venueAddress}` : ""}`
      : null;

  const ics = generateWeddingIcs({
    partner1Name: wedding.partner1Name,
    partner2Name: wedding.partner2Name,
    weddingDate: wedding.weddingDate,
    location,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="slub-${wedding.slug}.ics"`,
    },
  });
}
