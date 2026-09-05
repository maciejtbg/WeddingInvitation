import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-rose-50 px-6 py-24">
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
    </div>
  );
}
