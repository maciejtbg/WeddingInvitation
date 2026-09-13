"use client";

// Żywa "wizytówka" wszystkich stylów graficznych - wygląda jak prawdziwe
// zaproszenie (patrz src/app/[slug]/page.tsx - ten sam pomysł: zdjęcie/kolor
// tła motywu, ornament, imiona, data), tylko sam się przełącza między
// wszystkimi motywami. Wszystkie warstwy są zamontowane naraz i przełączają
// się WYŁĄCZNIE przez opacity (płynne krzyżowe przenikanie, bez żadnych
// "skoków" - to była wyraźna prośba pary), zamiast montować/odmontowywać -
// dzięki temu przejście jest zawsze płynne niezależnie od tego, jak różne
// są dwa sąsiadujące motywy.
//
// Świadomie OGRANICZONY, oprawiony w ramkę kafelek (nie pełnoekranowy hero)
// - para zauważyła, że pełnoekranowe zdjęcie samo w sobie wygląda po prostu
// jak "przesuwające się zdjęcia", bez czytelnego kontekstu "to jest DEMO
// stylów do wyboru". Umieszczony w layoucie obok stałego opisu (patrz
// src/app/page.tsx - dwie kolumny na dużych ekranach, opis nad demem na
// telefonie) ten kontekst wraca.
//
// Ikony na dole to uproszczone "próbki koloru" (dwukolorowe kółka z
// theme.swatches), nie pełne karty - para prosiła wyraźnie o coś małego.
// Kliknięcie kropki koloru zatrzymuje automatyczne przełączanie na
// wybranym motywie. Osobny przycisk play/pauza (jak w YouTube, jedna z
// kropek w tym samym rzędzie) wznawia/zatrzymuje pokaz - jawny, zawsze
// widoczny, bez ukrytego "kliknij tę samą kropkę jeszcze raz" (to nie było
// odkrywalne - zgłoszone przez parę).
//
// Przykładowe imiona pary (coupleName) dobiera SERVER Component wyżej
// (src/app/page.tsx, sampleCoupleName() w src/lib/coupleNameSamples.ts) na
// podstawie już wykrytego języka gościa (ten sam mechanizm co
// automatyczne wykrywanie języka, patrz src/proxy.ts) - gość spoza Polski
// widzi imiona "swojsko" brzmiące dla jego języka, nie zawsze "Ala i Kuba".

import { useEffect, useRef, useState } from "react";
import type { ThemeDefinition } from "@/lib/themes";
import { ThemeOrnament } from "./theme-ornaments";

const CYCLE_MS = 6000;
const FADE_MS = 1800;

interface Props {
  themes: ThemeDefinition[];
  coupleName: string;
}

export function HomeThemeShowcase({ themes, coupleName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotionRef.current) setAutoPlay(false);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % themes.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [autoPlay, themes.length]);

  function handlePick(index: number) {
    setActiveIndex(index);
    setAutoPlay(false);
  }

  return (
    <div className="w-full">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 sm:aspect-[3/4]"
        aria-hidden="true"
      >
        {themes.map((theme, i) => (
          <ShowcaseLayer key={theme.id} theme={theme} active={i === activeIndex} coupleName={coupleName} />
        ))}
      </div>

      <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => setAutoPlay((p) => !p)}
          title={autoPlay ? "Pauza" : "Odtwórz"}
          aria-label={autoPlay ? "Pauza" : "Odtwórz"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform hover:scale-110"
        >
          {autoPlay ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
              <rect x="0" y="0" width="3" height="10" />
              <rect x="7" y="0" width="3" height="10" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
              <path d="M0 0 L10 5 L0 10 Z" />
            </svg>
          )}
        </button>
        {themes.map((theme, i) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => handlePick(i)}
            title={theme.label}
            aria-label={theme.label}
            aria-pressed={i === activeIndex}
            className={`h-7 w-7 shrink-0 rounded-full transition-transform ${
              i === activeIndex ? "scale-125 ring-2 ring-offset-2 ring-zinc-900" : "hover:scale-110"
            }`}
            style={{
              background: `linear-gradient(135deg, ${theme.swatches[0]} 50%, ${theme.swatches[2]} 50%)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ShowcaseLayer({
  theme,
  active,
  coupleName,
}: {
  theme: ThemeDefinition;
  active: boolean;
  coupleName: string;
}) {
  const hasPhoto = !!theme.defaultCoverPhoto;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{
        opacity: active ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
        background: hasPhoto ? undefined : theme.colors.background,
      }}
    >
      {hasPhoto && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- statyczna grafika z public/, nie wymaga next/image */}
          <img
            src={theme.defaultCoverPhoto!.url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </>
      )}
      <div className="relative z-10">
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mb-6 h-8 w-40"
          style={{ color: hasPhoto ? "#ffffff" : theme.colors.accent }}
        />
        <p
          className={`text-4xl sm:text-5xl ${hasPhoto ? "text-white drop-shadow-sm" : ""}`}
          style={{
            color: hasPhoto ? undefined : theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontWeight: theme.fonts.headingWeight,
          }}
        >
          {coupleName}
        </p>
        <p
          className={`mt-3 text-sm ${hasPhoto ? "text-white/85" : ""}`}
          style={{ color: hasPhoto ? undefined : theme.colors.muted }}
        >
          12 czerwca 2027
        </p>
        <span
          className="mt-5 inline-block rounded-full px-4 py-1.5 text-xs font-medium"
          style={{ background: theme.colors.accent, color: theme.colors.accentText }}
        >
          {theme.label}
        </span>
      </div>
    </div>
  );
}
