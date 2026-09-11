"use client";

// Hero strony głównej (/) - żywa "wizytówka" wszystkich stylów graficznych,
// wygląda jak prawdziwe zaproszenie (patrz src/app/[slug]/page.tsx - ten sam
// pomysł: zdjęcie/kolor tła motywu, ornament, imiona, data), tylko sam się
// przełącza między wszystkimi motywami. Wszystkie warstwy są zamontowane
// naraz i przełączają się WYŁĄCZNIE przez opacity (płynne krzyżowe
// przenikanie, bez żadnych "skoków" - to była wyraźna prośba pary), zamiast
// montować/odmontowywać - dzięki temu przejście jest zawsze płynne
// niezależnie od tego, jak różne są dwa sąsiadujące motywy.
//
// Ikony na dole to uproszczone "próbki koloru" (dwukolorowe kółka z
// theme.swatches), nie pełne karty - para prosiła wyraźnie o coś małego.
// Kliknięcie ikony zatrzymuje automatyczne przełączanie na wybranym
// motywie; kliknięcie PONOWNIE tej samej (już aktywnej) ikony wznawia
// autoplay - prosty przełącznik bez dodatkowych przycisków.

import { useEffect, useRef, useState } from "react";
import type { ThemeDefinition } from "@/lib/themes";
import { ThemeOrnament } from "./theme-ornaments";

const CYCLE_MS = 6000;
const FADE_MS = 1800;
// Kolor, w który przechodzi dół hero (żeby zdjęcie/kolor motywu nie urywał
// się ostro nad resztą strony marketingowej) - stały, bo sekcje pod hero na
// tej stronie NIE są kolorowane motywem (to strona marketingowa, nie
// zaproszenie konkretnej pary).
const PAGE_BG = "#fafaf7";

interface Props {
  themes: ThemeDefinition[];
}

export function HomeThemeShowcase({ themes }: Props) {
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
    if (!autoPlay && index === activeIndex) {
      setAutoPlay(true);
    } else {
      setActiveIndex(index);
      setAutoPlay(false);
    }
  }

  return (
    <div>
      <div
        className="relative flex min-h-[70vh] items-center justify-center overflow-hidden sm:min-h-[80vh]"
        aria-hidden="true"
      >
        {themes.map((theme, i) => (
          <ShowcaseLayer key={theme.id} theme={theme} active={i === activeIndex} />
        ))}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 sm:h-40"
          style={{ background: `linear-gradient(to bottom, transparent, ${PAGE_BG})` }}
        />
      </div>

      <div className="mx-auto -mt-2 flex max-w-md flex-col items-center gap-3 px-6">
        <p className="text-xs text-zinc-500">
          {autoPlay ? "Style zmieniają się same" : "Zatrzymane - kliknij ponownie, żeby wznowić"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
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
    </div>
  );
}

function ShowcaseLayer({ theme, active }: { theme: ThemeDefinition; active: boolean }) {
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
          Ala &amp; Kuba
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
