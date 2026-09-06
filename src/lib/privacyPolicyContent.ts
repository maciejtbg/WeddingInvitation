// Treść polityki prywatności (RODO/GDPR) - źródło prawdy po polsku,
// tłumaczona na żądanie dla innych języków (patrz
// src/lib/i18n/translatePolicyContent.ts), tak samo jak reszta treści
// widocznych dla gości (patrz src/lib/i18n/getDictionary.ts).
//
// UWAGA (dla dewelopera/pary uruchamiającej tę instancję, nie dla gościa):
// to jest szablon napisany "z rozsądkiem", nie porada prawna. Jeśli
// prowadzisz to dla siebie prywatnie, prawdopodobnie wystarczy - ale w razie
// wątpliwości skonsultuj się z prawnikiem, szczególnie jeśli hostujesz to
// dla wielu par (wtedy to Ty, a nie każda para z osobna, możesz być
// administratorem/procesorem w rozumieniu RODO wobec ich gości).

export interface PolicySection {
  heading: string;
  paragraphs: string[];
}

export const PRIVACY_POLICY_PL: PolicySection[] = [
  {
    heading: "Administrator danych",
    paragraphs: [
      "Administratorem danych osobowych zbieranych za pośrednictwem tej strony jest para młoda, która założyła to konto i zaprosiła Cię na swój ślub - to ona decyduje o tym, kogo zaprosić, jakie dane o Tobie przechowuje (np. Twoje imię i nazwisko, odpowiedź na zaproszenie) i w jakim celu.",
      "W sprawach dotyczących Twoich danych skontaktuj się bezpośrednio z parą młodą, która Cię zaprosiła (np. przez czat dostępny na tej stronie po zalogowaniu, albo w inny sposób, jakim się z Wami kontaktują).",
    ],
  },
  {
    heading: "Jakie dane zbieramy",
    paragraphs: [
      "W zależności od tego, z czego skorzystasz, może to być: imię i nazwisko, odpowiedź na zaproszenie (RSVP), informacja o osobie towarzyszącej, uwagi dietetyczne/alergie, przypisane miejsce przy stole, treść wiadomości wysłanych do pary młodej, zdjęcia, które sam/a dodasz do galerii, oraz zgłoszone przez Ciebie propozycje utworów muzycznych.",
      "Nie zbieramy żadnych danych, których nie podasz samodzielnie - nie ma tu żadnego trackingu, reklam ani sprzedaży danych osobom trzecim.",
    ],
  },
  {
    heading: "Podstawa prawna i cel przetwarzania",
    paragraphs: [
      "Podstawą przetwarzania jest Twoja zgoda (art. 6 ust. 1 lit. a RODO), którą wyrażasz przy pierwszym wejściu na stronę, oraz prawnie uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO) polegający na organizacji przyjęcia weselnego, do którego zostałeś/aś zaproszony/a (np. wiedza, ile osób przyjdzie, gdzie kogo posadzić).",
      "Dane wykorzystujemy wyłącznie w celu organizacji tego konkretnego wydarzenia - nie w żadnym innym celu.",
    ],
  },
  {
    heading: "Jak długo przechowujemy dane",
    paragraphs: [
      "Dane gości są przechowywane maksymalnie przez określoną liczbę dni po dacie ślubu (widoczną w panelu pary, domyślnie 90 dni), po czym są automatycznie i trwale usuwane.",
      "W każdej chwili możesz też sam/a poprosić o wcześniejsze usunięcie swoich danych - patrz sekcja \"Twoje prawa\" poniżej.",
    ],
  },
  {
    heading: "Komu udostępniamy dane",
    paragraphs: [
      "Dane nie są sprzedawane ani udostępniane firmom trzecim w celach marketingowych. Strona korzysta z zewnętrznych, bezpłatnych usług wyłącznie do konkretnych funkcji, które sam/a uruchamiasz: wyszukiwarki utworów muzycznych (iTunes Search API - wyłącznie zapytanie o nazwę szukanej piosenki), map (OpenStreetMap - wyłącznie wyświetlenie mapy) oraz - jeśli strona jest w innym języku niż wyświetlany domyślnie - tłumacza tekstu interfejsu.",
      "Dane są przechowywane na serwerze, na którym para młoda uruchomiła tę stronę.",
    ],
  },
  {
    heading: "Twoje prawa",
    paragraphs: [
      "Masz prawo do: dostępu do swoich danych, ich sprostowania, usunięcia (\"prawo do bycia zapomnianym\"), ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu wobec przetwarzania.",
      "Samodzielne, natychmiastowe usunięcie wszystkich swoich danych z tej strony jest możliwe w każdej chwili z poziomu Twojego zaproszenia (przycisk \"Usuń moje dane\") - obejmuje to Twoje dane osobowe, przypisane miejsce, wiadomości, prośby o zmianę miejsca i dodane przez Ciebie zdjęcia.",
      "Masz też prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO), jeśli uznasz, że przetwarzanie Twoich danych narusza przepisy RODO.",
    ],
  },
  {
    heading: "Bezpieczeństwo danych",
    paragraphs: [
      "Dostęp do Twoich danych mają wyłącznie Ty (przez własną, zabezpieczoną sesję) oraz para młoda, która Cię zaprosiła. Hasła są przechowywane w postaci zahaszowanej, nigdy jawnym tekstem. Zdjęcia są automatycznie kompresowane i pozbawiane metadanych (w tym danych lokalizacji GPS) przy wgrywaniu.",
      "Twój unikalny link/kod dostępu działa jak hasło - nie udostępniaj go osobom, które nie powinny widzieć Twoich danych.",
    ],
  },
  {
    heading: "Pliki cookies",
    paragraphs: [
      "Strona używa wyłącznie niezbędnych plików cookies: do utrzymania Twojej sesji (żebyś nie musiał/a logować się ponownie przy każdej wizycie) oraz do zapamiętania wybranego języka strony. Nie używamy cookies reklamowych ani analitycznych/śledzących.",
    ],
  },
];
