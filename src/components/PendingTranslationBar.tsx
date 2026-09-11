"use client";

// Sam pasek "tłumaczymy Wasz język" - logika odczytu ciasteczka i decyzja,
// czy w ogóle go pokazać, siedzi w PendingLocaleBanner.tsx (Server
// Component). Ten komponent tylko: sam wysyła formularz tłumaczący przy
// wejściu na stronę (bez klikania czegokolwiek przez gościa) i pokazuje
// przycisk anulowania - patrz src/lib/i18n/actions.ts.

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { applyPendingTranslationAction, cancelPendingTranslationAction } from "@/lib/i18n/actions";
import { t } from "@/lib/i18n/dictionary";

function FetchingLabel({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <span className="flex items-center gap-2">
      <span
        className={`h-3 w-3 shrink-0 rounded-full border-2 border-white/40 border-t-white ${
          pending ? "animate-spin" : ""
        }`}
        aria-hidden="true"
      />
      {text}
    </span>
  );
}

interface Props {
  pendingLocale: string;
  label: string;
  returnTo: string;
  fetchingText: string;
  cancelText: string;
}

// Zanim faktycznie ruszy tłumaczenie, dajemy gościowi chwilę na kliknięcie
// "Zostań przy angielskim" - samo tłumaczenie (jedno zapytanie wsadowe do
// darmowego API, patrz translateDictionary.ts) bywa gotowe w ułamek
// sekundy, więc bez tego opóźnienia przycisk anulowania byłby w praktyce
// nie do kliknięcia na czas (złapane empirycznie przy testowaniu).
const START_DELAY_MS = 1500;

export function PendingTranslationBar({ pendingLocale, label, returnTo, fetchingText, cancelText }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    const timer = setTimeout(() => {
      submittedRef.current = true;
      formRef.current?.requestSubmit();
    }, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="sticky top-0 z-50 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-zinc-900 px-4 py-2 text-xs text-white">
      <form ref={formRef} action={applyPendingTranslationAction}>
        <input type="hidden" name="pendingLocale" value={pendingLocale} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <FetchingLabel text={t(fetchingText, { language: label })} />
      </form>
      <form action={cancelPendingTranslationAction}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <button type="submit" className="underline underline-offset-2 hover:text-white/80">
          {cancelText}
        </button>
      </form>
    </div>
  );
}
