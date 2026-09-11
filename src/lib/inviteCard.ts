// Generowanie obrazka zaproszenia (PNG) z kodem QR - do pobrania z listy
// gości, wydrukowania i wręczenia gościom (albo wysłania jako obrazek zamiast
// wklejania samego linku tekstem). Pod kodem QR jest też krótki kod ręczny
// (patrz src/app/kod) - dla gości, którzy nie umieją/nie mogą zeskanować.
//
// Technika: budujemy całą kartę jako SVG (tło, ornamenty, teksty, QR),
// rasteryzujemy przez sharp - patrz src/lib/fonts.ts po to, dlaczego to w
// ogóle pokazuje jakikolwiek tekst na produkcyjnym serwerze (Linux, brak
// systemowych fontów).
//
// Rozmiar karty (1500x2100 = proporcja 5:7") to standardowy format
// drukowanego zaproszenia ślubnego przy 300 DPI - ma się dać wydrukować bez
// pikselozy, nie tylko oglądać na ekranie telefonu.
//
// Trzy warianty (InviteCardVariant) różnią się WYŁĄCZNIE typografią/układem;
// kolor zawsze bierze się z motywu graficznego strony (ThemeDefinition) -
// karta ma pasować do tego, co już widzieli/wybrali para i goście.

import QRCode from "qrcode";
import sharp from "sharp";
import type { ThemeDefinition } from "./themes";
import type { InviteCardVariant, ThemeId } from "./db/types";
import { ensureCardFontsRegistered, CARD_FONTS } from "./fonts";

export const INVITE_CARD_VARIANTS: InviteCardVariant[] = ["classic", "modern", "romantic"];
export const DEFAULT_INVITE_CARD_VARIANT: InviteCardVariant = "classic";

export function isInviteCardVariant(value: string | null | undefined): value is InviteCardVariant {
  return !!value && (INVITE_CARD_VARIANTS as string[]).includes(value);
}

export const INVITE_CARD_VARIANT_INFO: Record<
  InviteCardVariant,
  { label: string; description: string }
> = {
  classic: {
    label: "Klasyczna",
    description: "Elegancki szeryfowy krój (Playfair Display), cienkie linie, ponadczasowy układ.",
  },
  modern: {
    label: "Nowoczesna",
    description: "Odważny, geometryczny krój (Montserrat) z dużymi odstępami między literami.",
  },
  romantic: {
    label: "Romantyczna",
    description: "Płynna kaligrafia (Great Vibes) i delikatne zdobienia - najbardziej dekoracyjna.",
  },
};

const CARD_WIDTH = 1500;
const CARD_HEIGHT = 2100;
const QR_SIZE = 340;

function gradientStops(background: string): [string, string] {
  const hexColors = background.match(/#[0-9a-fA-F]{3,8}/g);
  if (hexColors && hexColors.length >= 2) {
    return [hexColors[0], hexColors[hexColors.length - 1]];
  }
  return [background, background];
}

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

/** Te same kształty co src/components/theme-ornaments.tsx (odręcznie
 * rysowane SVG, jeden na motyw) - powtórzone tu jako gotowe fragmenty
 * znaczników zamiast importu komponentu React, bo ten plik renderuje się
 * po stronie serwera do samego stringa SVG, nie przez React. viewBox
 * oryginału to 240x40 - `translate`/`scale` poniżej pozycjonuje go na karcie. */
/** Karta zaproszenia ma własny, dużo prostszy zestaw ornamentów niż
 * src/components/theme-ornaments.tsx (3 kształty, nie 10 - to osobny plik,
 * bo renderuje się do gołego stringa SVG po stronie serwera, nie przez
 * React). Nowsze motywy (patrz src/lib/themes.ts) mapują się na
 * NAJBLIŻSZY klimatem z tych trzech zamiast dublować każdy z osobna. */
const CARD_ORNAMENT_FALLBACK: Partial<Record<ThemeId, ThemeId>> = {
  "botanical-elegance": "cream-gold",
  "rustic-boho": "cream-gold",
  "winter-elegance": "cream-gold",
  "modern-minimal": "blush-black",
  "art-deco-glam": "blush-black",
  "coastal-nautical": "blush-black",
  "romantic-script": "burgundy-gold",
};

function ornamentMarkup(
  rawThemeId: ThemeId,
  cx: number,
  cy: number,
  scale: number,
  color: string
): string {
  const themeId = CARD_ORNAMENT_FALLBACK[rawThemeId] ?? rawThemeId;
  const t = `translate(${cx - 120 * scale} ${cy - 20 * scale}) scale(${scale})`;
  const leaf = (x: number, y: number, rotate: number, opacity = 0.85) =>
    `<ellipse cx="0" cy="0" rx="7" ry="2.6" transform="translate(${x} ${y}) rotate(${rotate})" fill="currentColor" opacity="${opacity}" />`;

  if (themeId === "blush-black") {
    return `<g transform="${t}" color="${color}">
      <path d="M20 32 C 20 12, 90 4, 120 4 C 150 4, 220 12, 220 32" stroke="currentColor" stroke-width="1.2" opacity="0.8" fill="none" />
      <rect x="115.5" y="16" width="9" height="9" transform="rotate(45 120 20.5)" fill="currentColor" />
      <rect x="46" y="27" width="5" height="5" transform="rotate(45 48.5 29.5)" fill="currentColor" opacity="0.7" />
      <rect x="189" y="27" width="5" height="5" transform="rotate(45 191.5 29.5)" fill="currentColor" opacity="0.7" />
    </g>`;
  }
  if (themeId === "burgundy-gold") {
    const spots = [24, 52, 80, 160, 188, 216];
    return `<g transform="${t}" color="${color}">
      <path d="M10 22 C 60 8, 90 30, 120 20 C 150 10, 180 30, 230 18" stroke="currentColor" stroke-width="1" opacity="0.55" fill="none" />
      ${spots.map((x, i) => leaf(x, 18 + (i % 2 === 0 ? -6 : 8), i * 37)).join("")}
      <g transform="translate(120 20)">
        ${[0, 72, 144, 216, 288]
          .map((deg) => `<ellipse cx="0" cy="-6" rx="3.2" ry="5.5" transform="rotate(${deg})" fill="currentColor" opacity="0.9" />`)
          .join("")}
        <circle r="2.4" fill="currentColor" />
      </g>
    </g>`;
  }
  // cream-gold (domyślny)
  return `<g transform="${t}" color="${color}">
    <path d="M20 20 H100" stroke="currentColor" stroke-width="1" opacity="0.6" />
    <path d="M140 20 H220" stroke="currentColor" stroke-width="1" opacity="0.6" />
    ${[0, 1, 2, 3].map((i) => leaf(30 + i * 18, 20, i % 2 === 0 ? -35 : 35)).join("")}
    ${[0, 1, 2, 3].map((i) => leaf(150 + i * 18, 20, i % 2 === 0 ? -145 : 145)).join("")}
    <circle cx="120" cy="20" r="4" fill="currentColor" />
    <circle cx="120" cy="20" r="8" stroke="currentColor" stroke-width="1" opacity="0.5" fill="none" />
  </g>`;
}

/** Rozmiar hero-fontu na imiona - im dłuższe razem, tym mniejszy, żeby nigdy
 * nie wyjechały poza kartę (zamiast łamać w wielu miejscach na różne sposoby
 * dla każdego wariantu, jedna wspólna heurystyka na długość). */
function heroFontSize(name: string, base: number): number {
  if (name.length > 16) return Math.round(base * 0.68);
  if (name.length > 11) return Math.round(base * 0.82);
  return base;
}

function classicLayout(params: {
  theme: ThemeDefinition;
  partner1Name: string;
  partner2Name: string;
  weddingDateLabel: string | null;
}): string {
  const { theme, partner1Name, partner2Name, weddingDateLabel } = params;
  const cx = CARD_WIDTH / 2;
  const size1 = heroFontSize(partner1Name, 118);
  const size2 = heroFontSize(partner2Name, 118);
  return `
    ${ornamentMarkup(theme.id, cx, 250, 2.2, theme.colors.accent)}
    <text x="${cx}" y="360" text-anchor="middle" font-family="${CARD_FONTS.sans}" font-weight="500"
      font-size="30" letter-spacing="10" fill="${theme.colors.muted}">ZAPROSZENIE ŚLUBNE</text>

    <text x="${cx}" y="510" text-anchor="middle" font-family="${CARD_FONTS.displaySerif}" font-weight="600"
      font-size="${size1}" fill="${theme.colors.text}">${escapeXml(partner1Name)}</text>
    <text x="${cx}" y="600" text-anchor="middle" font-family="${CARD_FONTS.classicSerif}" font-style="italic"
      font-weight="500" font-size="52" fill="${theme.colors.accent}">&amp;</text>
    <text x="${cx}" y="690" text-anchor="middle" font-family="${CARD_FONTS.displaySerif}" font-weight="600"
      font-size="${size2}" fill="${theme.colors.text}">${escapeXml(partner2Name)}</text>

    <path d="M${cx - 140} 760 H${cx - 30}" stroke="${theme.colors.accent}" stroke-width="1.5" opacity="0.7" />
    <circle cx="${cx}" cy="760" r="5" fill="${theme.colors.accent}" />
    <path d="M${cx + 30} 760 H${cx + 140}" stroke="${theme.colors.accent}" stroke-width="1.5" opacity="0.7" />

    ${
      weddingDateLabel
        ? `<text x="${cx}" y="840" text-anchor="middle" font-family="${CARD_FONTS.classicSerif}" font-weight="500"
            font-size="46" fill="${theme.colors.text}">${escapeXml(weddingDateLabel)}</text>`
        : ""
    }
    <text x="${cx}" y="910" text-anchor="middle" font-family="${CARD_FONTS.sans}" font-weight="400"
      font-size="26" letter-spacing="2" fill="${theme.colors.muted}">Prosimy o potwierdzenie obecności</text>
  `;
}

function modernLayout(params: {
  theme: ThemeDefinition;
  partner1Name: string;
  partner2Name: string;
  weddingDateLabel: string | null;
}): string {
  const { theme, partner1Name, partner2Name, weddingDateLabel } = params;
  const cx = CARD_WIDTH / 2;
  const combined = `${partner1Name} & ${partner2Name}`;
  const namesSize = combined.length > 28 ? 78 : combined.length > 20 ? 96 : 112;
  return `
    <path d="M${cx - 180} 220 H${cx + 180}" stroke="${theme.colors.accent}" stroke-width="3" />
    <text x="${cx}" y="330" text-anchor="middle" font-family="${CARD_FONTS.sans}" font-weight="600"
      font-size="28" letter-spacing="14" fill="${theme.colors.muted}">ZAPROSZENIE</text>

    <text x="${cx}" y="${combined.length > 20 ? 470 : 520}" text-anchor="middle" font-family="${CARD_FONTS.sans}" font-weight="700"
      font-size="${namesSize}" letter-spacing="2" fill="${theme.colors.text}">${escapeXml(partner1Name.toUpperCase())}</text>
    <text x="${cx}" y="${combined.length > 20 ? 590 : 660}" text-anchor="middle" font-family="${CARD_FONTS.sans}" font-weight="300"
      font-size="52" fill="${theme.colors.accent}">&amp;</text>
    <text x="${cx}" y="${combined.length > 20 ? 710 : 800}" text-anchor="middle" font-family="${CARD_FONTS.sans}" font-weight="700"
      font-size="${namesSize}" letter-spacing="2" fill="${theme.colors.text}">${escapeXml(partner2Name.toUpperCase())}</text>

    <rect x="${cx - 6}" y="850" width="12" height="12" transform="rotate(45 ${cx} 856)" fill="${theme.colors.accent}" />

    ${
      weddingDateLabel
        ? `<text x="${cx}" y="930" text-anchor="middle" font-family="${CARD_FONTS.sans}" font-weight="500"
            font-size="38" letter-spacing="3" fill="${theme.colors.text}">${escapeXml(weddingDateLabel.toUpperCase())}</text>`
        : ""
    }
    <text x="${cx}" y="990" text-anchor="middle" font-family="${CARD_FONTS.sans}" font-weight="400"
      font-size="24" letter-spacing="3" fill="${theme.colors.muted}">POTWIERDŹ OBECNOŚĆ</text>
  `;
}

function romanticLayout(params: {
  theme: ThemeDefinition;
  partner1Name: string;
  partner2Name: string;
  weddingDateLabel: string | null;
}): string {
  const { theme, partner1Name, partner2Name, weddingDateLabel } = params;
  const cx = CARD_WIDTH / 2;
  const size1 = heroFontSize(partner1Name, 150);
  const size2 = heroFontSize(partner2Name, 150);
  return `
    ${ornamentMarkup(theme.id, cx, 260, 2.4, theme.colors.accent)}
    <text x="${cx}" y="360" text-anchor="middle" font-family="${CARD_FONTS.classicSerif}" font-style="italic"
      font-weight="500" font-size="32" letter-spacing="4" fill="${theme.colors.muted}">Z miłością zapraszamy</text>

    <text x="${cx}" y="530" text-anchor="middle" font-family="${CARD_FONTS.script}"
      font-size="${size1}" fill="${theme.colors.text}">${escapeXml(partner1Name)}</text>
    <text x="${cx}" y="620" text-anchor="middle" font-family="${CARD_FONTS.script}"
      font-size="60" fill="${theme.colors.accent}">&amp;</text>
    <text x="${cx}" y="740" text-anchor="middle" font-family="${CARD_FONTS.script}"
      font-size="${size2}" fill="${theme.colors.text}">${escapeXml(partner2Name)}</text>

    ${ornamentMarkup(theme.id, cx, 800, 1.3, theme.colors.accent)}

    ${
      weddingDateLabel
        ? `<text x="${cx}" y="890" text-anchor="middle" font-family="${CARD_FONTS.classicSerif}" font-weight="500"
            font-style="italic" font-size="44" fill="${theme.colors.text}">${escapeXml(weddingDateLabel)}</text>`
        : ""
    }
    <text x="${cx}" y="950" text-anchor="middle" font-family="${CARD_FONTS.classicSerif}" font-weight="400"
      font-style="italic" font-size="27" fill="${theme.colors.muted}">Prosimy o potwierdzenie obecności</text>
  `;
}

export async function generateInviteCardPng(params: {
  theme: ThemeDefinition;
  variant: InviteCardVariant;
  partner1Name: string;
  partner2Name: string;
  weddingDateLabel: string | null;
  shortCode: string;
  siteHost: string;
  /** Pełny link zaproszenia (/z/<token>) - to on jest zakodowany w QR,
   * niekoniecznie ten sam adres co /kod pokazany jako tekst pod kodem. */
  inviteUrl: string;
}): Promise<Buffer> {
  ensureCardFontsRegistered();

  const { theme, variant, partner1Name, partner2Name, weddingDateLabel, shortCode, siteHost, inviteUrl } =
    params;
  const [gradFrom, gradTo] = gradientStops(theme.colors.background);
  const cx = CARD_WIDTH / 2;

  const layoutFn = variant === "modern" ? modernLayout : variant === "romantic" ? romanticLayout : classicLayout;
  const content = layoutFn({ theme, partner1Name, partner2Name, weddingDateLabel });

  const qrCardSize = QR_SIZE + 64;
  const qrCardY = 1080;
  const qrX = cx - QR_SIZE / 2;

  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${gradFrom}" />
          <stop offset="100%" stop-color="${gradTo}" />
        </linearGradient>
      </defs>
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#bg)" />
      <rect x="60" y="60" width="${CARD_WIDTH - 120}" height="${CARD_HEIGHT - 120}"
        fill="none" stroke="${theme.colors.accent}" stroke-width="1.5" opacity="0.55" />
      <rect x="72" y="72" width="${CARD_WIDTH - 144}" height="${CARD_HEIGHT - 144}"
        fill="none" stroke="${theme.colors.accent}" stroke-width="1" opacity="0.3" />

      ${content}

      <rect x="${cx - qrCardSize / 2}" y="${qrCardY}" width="${qrCardSize}" height="${qrCardSize}"
        rx="20" fill="${theme.colors.surface}" stroke="${theme.colors.border}" stroke-width="2" />

      <text x="${cx}" y="${qrCardY + qrCardSize + 60}" text-anchor="middle"
        font-family="${CARD_FONTS.sans}" font-weight="400" font-size="24" fill="${theme.colors.muted}">
        Zeskanuj kod QR telefonem
      </text>
      <text x="${cx}" y="${qrCardY + qrCardSize + 98}" text-anchor="middle"
        font-family="${CARD_FONTS.sans}" font-weight="400" font-size="21" fill="${theme.colors.muted}">
        albo wejdź na ${escapeXml(siteHost)}/kod i wpisz kod:
      </text>
      <text x="${cx}" y="${qrCardY + qrCardSize + 165}" text-anchor="middle"
        font-family="${CARD_FONTS.sans}" font-weight="600" font-size="50" fill="${theme.colors.accent}"
        letter-spacing="8">
        ${escapeXml(shortCode)}
      </text>

      ${ornamentMarkup(theme.id, cx, CARD_HEIGHT - 120, variant === "romantic" ? 1.6 : 1.4, theme.colors.accent)}
    </svg>
  `;

  const qrPngBuffer = await QRCode.toBuffer(inviteUrl, {
    width: QR_SIZE,
    margin: 1,
    color: { dark: theme.colors.text, light: "#00000000" },
  });

  return sharp(Buffer.from(svg))
    .composite([{ input: qrPngBuffer, left: Math.round(qrX), top: qrCardY + 32 }])
    .png()
    .toBuffer();
}
