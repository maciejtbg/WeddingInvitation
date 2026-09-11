// Typ słownika i pomocnik do podstawiania zmiennych w szablonach typu
// "Cześć, {name}!" - patrz src/lib/i18n/locales/pl.ts (źródło prawdy) oraz
// getDictionary.ts (jak dobierany jest słownik dla danego języka).
//
// Świadomie dotyczy WYŁĄCZNIE stron dla gości (strona publiczna wesela,
// /moje-zaproszenie, wybór miejsca) - panel pary zostaje po polsku, bo to
// para konfiguruje wszystko i z nią rozmawialiśmy po polsku od początku.

export interface Dictionary {
  // Strona publiczna wesela
  draftBadge: string;
  howToFindUs: string;
  goToMyInvite: string;
  gotPersonalLink: string;

  // /moje-zaproszenie
  greeting: string;
  rsvpSavedThanks: string;
  rsvpQuestion: string;
  rsvpYes: string;
  rsvpNo: string;
  plusOneLabel: string;
  dietaryLabel: string;
  saveRsvp: string;
  questionForCouple: string;
  noMessagesYet: string;
  messagePlaceholder: string;
  send: string;

  // Sekcja miejsca przy stole (GuestSeatSection - wszystkie 4 tryby)
  yourTable: string;
  wantDifferentSeat: string;
  requestSentToCouple: string;
  alreadySentRequest: string;
  lastRequest: string;
  requestStatusPending: string;
  requestStatusApproved: string;
  requestStatusDeclined: string;
  quotedMessage: string;
  seatChangeMessagePlaceholder: string;
  requestSeatChange: string;
  confirmToChooseSeat: string;
  chooseYourSeat: string;
  currentlyAt: string;
  seatSaved: string;
  seatTakenError: string;
  allSeatsTaken: string;
  seatTakenSuffix: string;
  seatIsYouSuffix: string;
  saveSelectedSeat: string;

  // Galeria zdjęć (placeholder do R2) - tylko na stronie publicznej, para
  // dodaje zdjęcia z /admin/gallery; dodawanie przez gości na
  // /moje-zaproszenie to planowana funkcja premium, na razie wyłączona.
  galleryTitle: string;

  // Lista życzeń muzycznych
  musicTitle: string;
  musicLinkLabel: string;
  musicSearchPlaceholder: string;
  musicSearchButton: string;
  musicAdd: string;
  musicAdded: string;
  musicNoResults: string;
  musicCurrentList: string;
  musicEmpty: string;
  backToInvite: string;

  // Odliczanie do ślubu
  daysUntilWedding: string;
  oneDayUntilWedding: string;
  todayIsWedding: string;

  // Harmonogram i FAQ
  scheduleTitle: string;
  faqTitle: string;

  // Kalendarz
  addToCalendar: string;
  downloadIcs: string;

  // Przełącznik języka
  languageLabel: string;
  moreLanguages: string;

  // Pasek "tłumaczymy Wasz język" - patrz PendingLocaleBanner, pokazywany
  // tylko gdy język wykryty automatycznie z kraju gościa (proxy.ts) nie jest
  // jeszcze przetłumaczony i buforowany. Widoczny wyłącznie w bazowym
  // angielskim (patrz countryLocale.ts), ale trzymamy klucz w każdym
  // słowniku jak resztę - spójnie z resztą Dictionary.
  fetchingLanguageBanner: string;
  stayInEnglish: string;

  // RODO - zgoda przy pierwszym wejściu i usunięcie danych (patrz
  // src/app/[slug]/zgoda i src/app/[slug]/usun-dane)
  privacyPolicyLinkLabel: string;
  consentTitle: string;
  consentIntro: string;
  consentAgree: string;
  consentAgreeButton: string;
  consentRequiredError: string;
  deleteMyDataLink: string;
  deleteMyDataTitle: string;
  deleteMyDataWarning: string;
  deleteMyDataConfirmButton: string;
  deleteMyDataCancel: string;
  deleteMyDataDone: string;
}

/** Języki z ręcznie utrzymywanym słownikiem (locales/*.ts) - dostępne od
 * razu, bez tłumaczenia na żądanie. Patrz getDictionary.ts (skąd dobierany
 * jest słownik) i countryLocale.ts (który używa tej listy, żeby wiedzieć,
 * czy wykryty z kraju gościa język wymaga baneru "tłumaczymy w tle"). */
export const HAND_CURATED_LOCALES = ["pl", "en", "uk", "de"] as const;

/** Podstawia {klucz} w szablonie wartościami z `vars`. Nieznany klucz
 * zostaje w tekście dosłownie zamiast wyrzucać błąd - lepsze to niż
 * wywalona strona z powodu literówki w jednym z ręcznych tłumaczeń. */
export function t(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}
