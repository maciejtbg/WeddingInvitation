// Oryginalne, odręcznie napisane ornamenty SVG dla każdego motywu graficznego
// (src/lib/themes.ts). Rysują się kolorem `currentColor`, więc kolor ustawia
// rodzic przez className/style (zwykle var(--wd-accent) danego motywu).
//
// Świadomie proste kształty (linie, elipsy, kropki) zamiast importowanych
// plików - zero zależności od zewnętrznych bibliotek ikon czy zdjęć.

import type { CSSProperties, JSX } from "react";
import type { ThemeId } from "@/lib/db/types";

interface OrnamentProps {
  className?: string;
  style?: CSSProperties;
}

function Leaf({ transform }: { transform: string }) {
  return (
    <ellipse
      cx="0"
      cy="0"
      rx="7"
      ry="2.6"
      transform={transform}
      fill="currentColor"
      opacity="0.85"
    />
  );
}

/** Delikatna gałązka laurowa - motyw "cream-gold". */
function FloralOrnament({ className, style }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 20 H100"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M140 20 H220"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      {[0, 1, 2, 3].map((i) => (
        <g key={`l-${i}`} transform={`translate(${30 + i * 18} 20)`}>
          <Leaf transform={`rotate(${i % 2 === 0 ? -35 : 35})`} />
        </g>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <g key={`r-${i}`} transform={`translate(${150 + i * 18} 20)`}>
          <Leaf transform={`rotate(${i % 2 === 0 ? -145 : 145})`} />
        </g>
      ))}
      <circle cx="120" cy="20" r="4" fill="currentColor" />
      <circle cx="120" cy="20" r="8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Minimalny geometryczny łuk z rombami - motyw "blush-black". */
function GeometricOrnament({ className, style }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 32 C 20 12, 90 4, 120 4 C 150 4, 220 12, 220 32"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.8"
      />
      <rect
        x="115.5"
        y="16"
        width="9"
        height="9"
        transform="rotate(45 120 20.5)"
        fill="currentColor"
      />
      <rect
        x="46"
        y="27"
        width="5"
        height="5"
        transform="rotate(45 48.5 29.5)"
        fill="currentColor"
        opacity="0.7"
      />
      <rect
        x="189"
        y="27"
        width="5"
        height="5"
        transform="rotate(45 191.5 29.5)"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

/** Bujniejsza gałązka z drobnymi kwiatami - motyw "burgundy-gold". */
function BotanicalOrnament({ className, style }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 22 C 60 8, 90 30, 120 20 C 150 10, 180 30, 230 18"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      {[24, 52, 80, 160, 188, 216].map((x, i) => (
        <g key={x} transform={`translate(${x} ${18 + (i % 2 === 0 ? -6 : 8)})`}>
          <Leaf transform={`rotate(${i * 37})`} />
        </g>
      ))}
      <g transform="translate(120 20)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-6"
            rx="3.2"
            ry="5.5"
            transform={`rotate(${deg})`}
            fill="currentColor"
            opacity="0.9"
          />
        ))}
        <circle r="2.4" fill="currentColor" />
      </g>
    </svg>
  );
}

const ORNAMENTS: Record<ThemeId, (props: OrnamentProps) => JSX.Element> = {
  "cream-gold": FloralOrnament,
  "blush-black": GeometricOrnament,
  "burgundy-gold": BotanicalOrnament,
};

export function ThemeOrnament({ theme, className, style }: { theme: ThemeId } & OrnamentProps) {
  const Ornament = ORNAMENTS[theme];
  return <Ornament className={className} style={style} />;
}
