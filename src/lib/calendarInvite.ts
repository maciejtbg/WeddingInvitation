// Generuje plik .ics (iCalendar) do dodania ślubu do kalendarza gościa -
// to jest właściwy "system przypomnień": raz dodane wydarzenie samo
// przypomni w telefonie gościa (domyślny alarm kalendarza), bez potrzeby
// SMS-a czy jakiejkolwiek infrastruktury wysyłkowej po naszej stronie.
// Format tekstowy, żadnej biblioteki - specyfikacja RFC 5545 jest prosta
// dla pojedynczego zdarzenia bez powtarzania.

function formatIcsDate(date: Date): string {
  // Format "podstawowy" wymagany przez RFC 5545: YYYYMMDDTHHMMSSZ (UTC).
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function generateWeddingIcs(params: {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string; // ISO, tylko data (YYYY-MM-DD) - traktujemy jako całodniowe wydarzenie
  location: string | null;
}): string {
  const start = new Date(params.weddingDate + "T00:00:00Z");
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const startDate = start.toISOString().slice(0, 10).replace(/-/g, "");
  const endDate = end.toISOString().slice(0, 10).replace(/-/g, "");

  const summary = escapeIcsText(`Ślub: ${params.partner1Name} & ${params.partner2Name}`);
  const location = params.location ? escapeIcsText(params.location) : "";
  const uid = `wedding-${startDate}-${params.partner1Name}-${params.partner2Name}@wedding-app`.replace(/\s+/g, "-");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding App//PL",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${summary}`,
    ...(location ? [`LOCATION:${location}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Przypomnienie o ślubie",
    "TRIGGER:-P1D", // przypomnienie dzień wcześniej
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 wymaga zakończeń linii CRLF.
  return lines.join("\r\n");
}

export function googleCalendarUrl(params: {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  location: string | null;
}): string {
  const start = params.weddingDate.replace(/-/g, "");
  const endDate = new Date(new Date(params.weddingDate + "T00:00:00Z").getTime() + 24 * 60 * 60 * 1000);
  const end = endDate.toISOString().slice(0, 10).replace(/-/g, "");
  const text = encodeURIComponent(`Ślub: ${params.partner1Name} & ${params.partner2Name}`);
  const details = encodeURIComponent("Dodane ze strony ślubnej");
  const location = encodeURIComponent(params.location ?? "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
}
