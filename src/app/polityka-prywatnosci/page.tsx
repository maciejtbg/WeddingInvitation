// Publiczna, ogólna polityka prywatności (RODO/GDPR) - nie jest przypisana
// do konkretnego wesela (para nie ma jeszcze konta, kiedy widzi ją pierwszy
// raz - patrz link z formularza rejestracji), stąd stały adres, nie /[slug]/...
// Dostępna każdemu, bez sesji - to wymóg RODO (art. 13-14), nie coś, co
// wolno schować za logowaniem.

import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getPolicyContent } from "@/lib/i18n/translatePolicyContent";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PendingLocaleBanner from "@/components/PendingLocaleBanner";
import { getTheme, themeStyleVars, DEFAULT_THEME } from "@/lib/themes";

export default async function PrivacyPolicyPage() {
  const locale = await getLocale();
  const [dict, sections] = await Promise.all([getDictionary(locale), getPolicyContent(locale)]);
  const theme = getTheme(DEFAULT_THEME);

  return (
    <>
      <PendingLocaleBanner returnTo="/polityka-prywatnosci" dict={dict} />
      <div
        className="flex-1 px-6 py-12"
        style={{ ...themeStyleVars(theme), background: theme.colors.background }}
      >
      <div className="mx-auto w-full max-w-2xl">
        <LanguageSwitcher currentLocale={locale} returnTo="/polityka-prywatnosci" dict={dict} />
        <h1 className="mb-8 text-center font-serif text-3xl font-semibold text-[var(--wd-text)]">
          {dict.privacyPolicyLinkLabel}
        </h1>
        <div className="space-y-6">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="mb-2 text-lg font-medium text-[var(--wd-text)]">{section.heading}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j} className="mb-2 text-sm leading-relaxed text-[var(--wd-muted)]">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
      </div>
    </>
  );
}
