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

/** Para delikatnych gałązek zbiegających się na środku - motyw "botanical-elegance". */
function SprigOrnament({ className, style }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20 30 Q70 8, 118 20" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d="M220 30 Q170 8, 122 20" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      {[30, 55, 80, 100].map((x, i) => (
        <g key={`l-${x}`} transform={`translate(${x} ${28 - i * 4}) rotate(${-30 - i * 5})`}>
          <Leaf transform="" />
        </g>
      ))}
      {[210, 185, 160, 140].map((x, i) => (
        <g key={`r-${x}`} transform={`translate(${x} ${28 - i * 4}) rotate(${30 + i * 5})`}>
          <Leaf transform="" />
        </g>
      ))}
      <circle cx="120" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

/** Jedna cienka linia z pojedynczym kwadratem - motyw "modern-minimal", celowo
 * najbardziej oszczędny ze wszystkich (minimalizm to też brak ozdób). */
function MinimalOrnament({ className, style }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20 20 H100" stroke="currentColor" strokeWidth="1.5" />
      <path d="M140 20 H220" stroke="currentColor" strokeWidth="1.5" />
      <rect x="115" y="15" width="10" height="10" fill="currentColor" />
    </svg>
  );
}

/** Płynny zawijas piórem - motyw "romantic-script", jak pociągnięcie pióra. */
function ScriptOrnament({ className, style }: OrnamentProps) {
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
        d="M20 25 C 50 5, 70 35, 100 18 C 110 13, 115 10, 120 12 C 125 10, 130 13, 140 18 C 170 35, 190 5, 220 25"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.75"
      />
      <circle cx="120" cy="14" r="2.6" fill="currentColor" />
    </svg>
  );
}

/** Falista linia z piórkiem pośrodku - motyw "rustic-boho". */
function BohoOrnament({ className, style }: OrnamentProps) {
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
        d="M20 24 Q35 14, 50 24 T80 24 T110 24"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.7"
      />
      <path
        d="M220 24 Q205 14, 190 24 T160 24 T130 24"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.7"
      />
      <path d="M120 6 C 114 14, 114 26, 120 34 C 126 26, 126 14, 120 6 Z" fill="currentColor" opacity="0.85" />
      <path d="M120 10 V30" stroke="var(--wd-surface, #fff)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Symetryczny wachlarz linii ze środkowym rombem - motyw "art-deco-glam". */
function DecoOrnament({ className, style }: OrnamentProps) {
  const rays = [0, 1, 2, 3].map((i) => 10 + i * 7);
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {rays.map((h, i) => (
        <g key={`ray-${i}`}>
          <path d={`M${100 - i * 20} 32 L${100 - i * 20} ${32 - h}`} stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <path d={`M${140 + i * 20} 32 L${140 + i * 20} ${32 - h}`} stroke="currentColor" strokeWidth="1" opacity="0.7" />
        </g>
      ))}
      <rect x="112" y="12" width="16" height="16" transform="rotate(45 120 20)" fill="currentColor" />
    </svg>
  );
}

/** Linia fali z drobnymi kropkami piany - motyw "coastal-nautical". */
function WaveOrnament({ className, style }: OrnamentProps) {
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
        d="M10 22 Q40 8, 70 22 T130 22 T190 22 T230 22"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.75"
      />
      <circle cx="120" cy="14" r="2.4" fill="currentColor" />
      <circle cx="105" cy="10" r="1.4" fill="currentColor" opacity="0.6" />
      <circle cx="135" cy="10" r="1.4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** Delikatny sześcioramienny płatek śniegu - motyw "winter-elegance". */
function SnowflakeOrnament({ className, style }: OrnamentProps) {
  const arms = [0, 60, 120, 180, 240, 300];
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20 20 H95" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d="M145 20 H220" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <g transform="translate(120 20)">
        {arms.map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path d="M0 0 V-10" stroke="currentColor" strokeWidth="1" />
            <path d="M0 -7 L-2.5 -8.5 M0 -7 L2.5 -8.5" stroke="currentColor" strokeWidth="0.8" />
          </g>
        ))}
        <circle r="2" fill="currentColor" />
      </g>
    </svg>
  );
}

const ORNAMENTS: Record<ThemeId, (props: OrnamentProps) => JSX.Element> = {
  "cream-gold": FloralOrnament,
  "blush-black": GeometricOrnament,
  "burgundy-gold": BotanicalOrnament,
  "botanical-elegance": SprigOrnament,
  "modern-minimal": MinimalOrnament,
  "romantic-script": ScriptOrnament,
  "rustic-boho": BohoOrnament,
  "art-deco-glam": DecoOrnament,
  "coastal-nautical": WaveOrnament,
  "winter-elegance": SnowflakeOrnament,
};

export function ThemeOrnament({ theme, className, style }: { theme: ThemeId } & OrnamentProps) {
  const Ornament = ORNAMENTS[theme];
  return <Ornament className={className} style={style} />;
}
