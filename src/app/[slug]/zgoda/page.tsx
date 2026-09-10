// Brama zgody RODO dla gościa - pokazywana RAZ, przy pierwszym wejściu
// (patrz z/[token]/route.ts i kod/actions.ts, które kierują tu gościa bez
// jeszcze zapisanej zgody). Sesja gościa już istnieje w tym momencie (musi -
// stąd wiemy, KOGO pytamy o zgodę), tylko jeszcze nie prowadzi dalej, dopóki
// gość nie potwierdzi. Zwracający goście z ważną zgodą trafiają tu też
// (bezpośrednie wejście na adres), ale od razu lecą dalej.

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { hasCurrentConsent } from "@/lib/db/consents";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { acceptGuestConsentAction } from "./actions";

export default async function GuestConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const session = await getGuestSession();
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/${wedding.slug}`);
  }
  if (hasCurrentConsent("GUEST", session.guestId)) {
    redirect(`/${wedding.slug}/moje-zaproszenie`);
  }

  const theme = getTheme(wedding.theme);
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div
      className="flex flex-1 items-center justify-center px-6 py-16"
      style={{ ...themeStyleVars(theme), background: theme.colors.background }}
    >
      <div className="w-full max-w-md text-center">
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mb-6 h-8 w-40"
          style={{ color: theme.colors.accent }}
        />
        <h1 className="mb-4 font-serif text-2xl font-semibold text-[var(--wd-text)]">
          {dict.consentTitle}
        </h1>
        <p className="mb-6 text-left text-sm leading-relaxed text-[var(--wd-muted)]">
          {dict.consentIntro}
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            {dict.consentRequiredError}
          </p>
        )}

        <form action={acceptGuestConsentAction} className="text-left">
          <input type="hidden" name="slug" value={wedding.slug} />
          <label className="mb-6 flex cursor-pointer gap-3 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-4 text-sm text-[var(--wd-text)]">
            <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {dict.consentAgree}{" "}
              <Link
                href="/polityka-prywatnosci"
                target="_blank"
                className="underline"
                style={{ color: theme.colors.accent }}
              >
                {dict.privacyPolicyLinkLabel}
              </Link>
            </span>
          </label>
          <button
            type="submit"
            className="w-full rounded-full px-4 py-2.5 text-sm font-medium hover:opacity-90"
            style={{ background: theme.colors.accent, color: theme.colors.accentText }}
          >
            {dict.consentAgreeButton}
          </button>
        </form>
      </div>
    </div>
  );
}
