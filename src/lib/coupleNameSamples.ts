// Przykładowe imiona pary do pokazu stylów na stronie głównej (patrz
// HomeThemeShowcase.tsx) - dobrane pod język gościa, żeby odwiedzający z
// innych zakątków świata od razu widzieli coś, co "brzmi swojsko", zamiast
// jednego, zawsze polskiego przykładu. Świadomie ten sam mechanizm co
// wybór języka (patrz src/proxy.ts, guest_locale) - ta sama detekcja,
// inny efekt końcowy.
//
// Jeden reprezentatywny przykład na język z ALL_LANGUAGES (languages.ts) -
// z konieczności uproszczone tam, gdzie jeden język obejmuje wiele krajów
// / kultur (np. arabski, hiszpański) - to tylko przykładowa etykieta w
// demie, nie coś, co gość kiedykolwiek edytuje czy widzi jako "swoje".

// "&" zamiast słowa "i"/"and" w danym języku CELOWO - to międzynarodowa
// konwencja zaproszeń ślubnych, czytelna wizualnie w każdej kulturze, bez
// ryzyka błędu gramatycznego w języku, którego nie znamy na tyle dobrze.
const COUPLE_NAME_SAMPLES: Record<string, string> = {
  pl: "Ala & Kuba",
  en: "Emma & James",
  uk: "Olena & Andrij",
  de: "Anna & Lukas",
  fr: "Chloé & Louis",
  es: "Sofía & Mateo",
  it: "Giulia & Marco",
  pt: "Beatriz & Tiago",
  ru: "Anastazja & Dmitrij",
  cs: "Tereza & Jakub",
  sk: "Simona & Adam",
  lt: "Ugnė & Lukas",
  tr: "Elif & Emre",
  ar: "Layla & Omar",
  he: "Noa & Jonatan",
  hi: "Ananya & Ardżun",
  "zh-CN": "Mei & Wei",
  ja: "Yui & Sota",
  ko: "Ji-u & Min-dżun",
  vi: "Linh & Minh",
  sw: "Amani & Dżuma",
  am: "Selam & Dawit",
  ha: "Amina & Musa",
  yo: "Bisi & Tunde",
  ig: "Ada & Emeka",
  zu: "Thandiwe & Sipho",
  xh: "Nomvula & Lindani",
  af: "Anika & Pieter",
  so: "Hodan & Abdi",
  mg: "Voahangy & Tojo",
};

const DEFAULT_COUPLE_NAME = COUPLE_NAME_SAMPLES.pl;

export function sampleCoupleName(locale: string): string {
  return COUPLE_NAME_SAMPLES[locale] ?? DEFAULT_COUPLE_NAME;
}
