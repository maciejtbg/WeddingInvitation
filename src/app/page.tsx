import Link from "next/link";
import { THEME_LIST } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-rose-50 px-6 py-24">
      <div className="max-w-xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-rose-500">
          Szkielet aplikacji - wersja robocza
        </p>
        <h1 className="mb-6 text-4xl font-semibold text-zinc-900 sm:text-5xl">
          Wasza strona ślubna, bez ujawniania danych gości
        </h1>
        <p className="mb-10 text-lg leading-8 text-zinc-600">
          Załóżcie konto, dodajcie gości i wyślijcie każdemu jego własny,
          prywatny link. RSVP, lista gości i miejsce przy stole - każdy gość
          widzi tylko swoje dane.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/admin/register"
            className="rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Załóż konto pary
          </Link>
          <Link
            href="/admin/login"
            className="rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition-colors hover:border-zinc-400"
          >
            Mam już konto
          </Link>
        </div>
      </div>

      <div className="mt-24 w-full max-w-4xl">
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-wide text-rose-500">
          Gotowe style do wyboru
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {THEME_LIST.map((theme) => (
            <div
              key={theme.id}
              className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm"
              style={{ background: theme.colors.background }}
            >
              <div className="flex flex-col items-center px-6 py-10">
                <ThemeOrnament
                  theme={theme.id}
                  className="mb-4 h-6 w-28"
                  style={{ color: theme.colors.accent }}
                />
                <p
                  className="font-serif text-lg font-semibold"
                  style={{ color: theme.colors.text }}
                >
                  Ala &amp; Kuba
                </p>
                <p className="mt-1 text-xs" style={{ color: theme.colors.muted }}>
                  12 czerwca 2027
                </p>
                <span
                  className="mt-4 rounded-full px-4 py-1.5 text-xs font-medium"
                  style={{ background: theme.colors.accent, color: theme.colors.accentText }}
                >
                  RSVP
                </span>
              </div>
              <div className="border-t border-black/5 bg-white/70 px-4 py-3 text-center backdrop-blur-sm">
                <p className="text-sm font-medium text-zinc-900">{theme.label}</p>
                <p className="text-xs text-zinc-500">{theme.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
