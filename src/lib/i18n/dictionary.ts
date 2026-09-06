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

  // Galeria zdjęć (placeholder do R2)
  galleryTitle: string;
  galleryFull: string;
  addPhoto: string;
  photoUploaded: string;

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

  // RODO - zgoda przy pierwszym wejściu i usunięcie danych (patrz
  // src/app/w/[slug]/zgoda i src/app/w/[slug]/usun-dane)
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

/** Podstawia {klucz} w szablonie wartościami z `vars`. Nieznany klucz
 * zostaje w tekście dosłownie zamiast wyrzucać błąd - lepsze to niż
 * wywalona strona z powodu literówki w jednym z ręcznych tłumaczeń. */
export function t(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}
