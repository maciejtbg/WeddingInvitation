import Link from "next/link";
import { THEME_LIST } from "@/lib/themes";
import { HomeThemeShowcase } from "@/components/HomeThemeShowcase";

const FEATURES = [
  {
    icon: "🔒",
    title: "Prywatność gości",
    description:
      "Każdy gość widzi wyłącznie własne dane - RSVP, miejsce przy stole i wiadomości innych gości nigdy nie są nikomu ujawniane.",
  },
  {
    icon: "💌",
    title: "Osobisty link dla każdego",
    description: "Bez kont i haseł dla gości - jeden prywatny link wystarcza, żeby potwierdzić przybycie.",
  },
  {
    icon: "🪑",
    title: "Planer stołów",
    description:
      "Przeciągnij i upuść stoły na planie sali, przypisuj gości ręcznie albo pozwól im samodzielnie wybrać miejsce.",
  },
  {
    icon: "📸",
    title: "Zdjęcie powitalne i galeria",
    description: "Wgrajcie własne zdjęcia - jedno z nich stanie się pełnoekranowym tłem zaproszenia.",
  },
  {
    icon: "🎵",
    title: "Lista życzeń muzycznych",
    description: "Goście sami proponują piosenki na wesele - wyszukiwarka od razu podpowiada wykonawców.",
  },
  {
    icon: "🌍",
    title: "Język dopasowany do gościa",
    description:
      "Strona sama rozpoznaje kraj gościa i pokazuje właściwy język - ponad 25 języków, w tym tłumaczenie na żądanie.",
  },
  {
    icon: "✅",
    title: "Zgodność z RODO",
    description: "Zgoda gościa, prawo do usunięcia danych i automatyczne czyszczenie po terminie retencji.",
  },
  {
    icon: "🎟️",
    title: "Karty zaproszeń z kodem QR",
    description: "Gotowe do druku karty z kodem QR i ręcznym kodem - dla gości bez smartfona pod ręką.",
  },
  {
    icon: "💬",
    title: "Czat, harmonogram i mapa",
    description: "Pytania do pary wprost na stronie, plan dnia, FAQ, mapa dojazdu i odliczanie do ślubu.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col" style={{ background: "#fafaf7" }}>
      <h1 className="sr-only">Nasze Wesele - strony ślubne z RSVP, bez ujawniania danych gości</h1>

      <HomeThemeShowcase themes={THEME_LIST} />

      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-rose-500">
          Strona ślubna gotowa w kilka minut
        </p>
        <p className="mb-10 text-lg leading-8 text-zinc-600">
          Załóżcie konto, dodajcie gości i wyślijcie każdemu jego własny, prywatny link. RSVP, lista
          gości i miejsce przy stole - każdy gość widzi tylko swoje dane.
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

      <div className="border-t border-zinc-200 bg-white px-6 py-16">
        <div className="mx-auto w-full max-w-5xl">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-wide text-rose-500">
            Co dostajecie
          </p>
          <h2 className="mb-10 text-center text-2xl font-semibold text-zinc-900 sm:text-3xl">
            Wszystko, czego potrzebuje nowoczesne wesele
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-6 text-left"
              >
                <span className="mb-3 block text-3xl" aria-hidden="true">
                  {feature.icon}
                </span>
                <p className="mb-1.5 text-base font-semibold text-zinc-900">{feature.title}</p>
                <p className="text-sm leading-relaxed text-zinc-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-16 text-center">
        <p className="mb-6 text-lg font-medium text-zinc-900">
          Gotowi, żeby zobaczyć to na własnej stronie?
        </p>
        <Link
          href="/admin/register"
          className="inline-block rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Załóż konto pary - za darmo
        </Link>
      </div>
    </div>
  );
}
