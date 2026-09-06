// Generowanie obrazka zaproszenia (PNG) z kodem QR - do pobrania z listy
// gości i wysłania jako obrazek (WhatsApp/Messenger/druk) zamiast wklejania
// samego linku tekstem. Pod kodem QR jest też krótki kod ręczny (patrz
// src/app/kod) - dla gości, którzy nie umieją/nie mogą zeskanować.
//
// Technika: budujemy całą kartę jako SVG (tło, gradient motywu, teksty),
// rasteryzujemy przez sharp, i nakładamy na to osobno wygenerowany PNG
// z kodem QR (biblioteka `qrcode`) - sharp.composite() w jednym przebiegu.

import QRCode from "qrcode";
import sharp from "sharp";
import type { ThemeDefinition } from "./themes";

const CARD_WIDTH = 1000;
const CARD_HEIGHT = 1400;
const QR_SIZE = 460;

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

export async function generateInviteCardPng(params: {
  theme: ThemeDefinition;
  partner1Name: string;
  partner2Name: string;
  weddingDateLabel: string | null;
  shortCode: string;
  siteHost: string;
  /** Pełny link zaproszenia (/z/<token>) - to on jest zakodowany w QR,
   * niekoniecznie ten sam adres co /kod pokazany jako tekst pod kodem. */
  inviteUrl: string;
}): Promise<Buffer> {
  const { theme, partner1Name, partner2Name, weddingDateLabel, shortCode, siteHost, inviteUrl } =
    params;
  const [gradFrom, gradTo] = gradientStops(theme.colors.background);
  const coupleNames = escapeXml(`${partner1Name} & ${partner2Name}`);

  const qrX = (CARD_WIDTH - QR_SIZE) / 2;
  const qrCardPadding = 40;
  const qrCardY = 470;
  const qrCardSize = QR_SIZE + qrCardPadding * 2;

  const backgroundSvg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${gradFrom}" />
          <stop offset="100%" stop-color="${gradTo}" />
        </linearGradient>
      </defs>
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#bg)" />

      <text x="${CARD_WIDTH / 2}" y="220" text-anchor="middle"
        font-family="Georgia, serif" font-size="64" fill="${theme.colors.text}">
        ${coupleNames}
      </text>
      ${
        weddingDateLabel
          ? `<text x="${CARD_WIDTH / 2}" y="280" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="34" fill="${theme.colors.muted}">
              ${escapeXml(weddingDateLabel)}
            </text>`
          : ""
      }

      <text x="${CARD_WIDTH / 2}" y="380" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="30" fill="${theme.colors.text}">
        Twoje osobiste zaproszenie
      </text>

      <rect x="${(CARD_WIDTH - qrCardSize) / 2}" y="${qrCardY}" width="${qrCardSize}" height="${qrCardSize}"
        rx="24" fill="${theme.colors.surface}" stroke="${theme.colors.border}" stroke-width="2" />

      <text x="${CARD_WIDTH / 2}" y="${qrCardY + qrCardSize + 90}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="26" fill="${theme.colors.muted}">
        Zeskanuj kod QR telefonem
      </text>
      <text x="${CARD_WIDTH / 2}" y="${qrCardY + qrCardSize + 140}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="24" fill="${theme.colors.muted}">
        albo wejdź na ${escapeXml(siteHost)}/kod i wpisz kod:
      </text>
      <text x="${CARD_WIDTH / 2}" y="${qrCardY + qrCardSize + 210}" text-anchor="middle"
        font-family="Courier New, monospace" font-size="56" font-weight="bold" fill="${theme.colors.accent}"
        letter-spacing="6">
        ${escapeXml(shortCode)}
      </text>
    </svg>
  `;

  const qrPngBuffer = await QRCode.toBuffer(inviteUrl, { width: QR_SIZE, margin: 1 });

  return sharp(Buffer.from(backgroundSvg))
    .composite([{ input: qrPngBuffer, left: Math.round(qrX), top: qrCardY + qrCardPadding }])
    .png()
    .toBuffer();
}
