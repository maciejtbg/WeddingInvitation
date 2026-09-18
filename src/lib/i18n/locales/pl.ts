import type { Dictionary } from "../dictionary";

// Źródło prawdy - wszystkie pozostałe języki (poza en/uk/de, tłumaczonymi
// ręcznie w tym samym katalogu) są tłumaczeniem TEGO słownika na żądanie
// (patrz src/lib/db/translations.ts).
export const pl: Dictionary = {
  draftBadge: "Wersja robocza - strona jeszcze nieopublikowana",
  howToFindUs: "Jak do nas trafić",
  goToMyInvite: "Przejdź do mojego zaproszenia",
  gotPersonalLink:
    "Dostaliście od nas link z osobistym zaproszeniem? Otwórzcie go, żeby potwierdzić przybycie.",

  greeting: "Cześć, {name}!",
  rsvpSavedThanks: "Dziękujemy za odpowiedź!",
  rsvpQuestion: "Czy będziesz z nami?",
  rsvpYes: "Tak, będę!",
  rsvpNo: "Niestety nie",
  plusOneLabel: "Imię osoby towarzyszącej (jeśli przychodzisz z kimś)",
  dietaryLabel: "Alergie / preferencje żywieniowe",
  saveRsvp: "Zapisz odpowiedź",
  questionForCouple: "Masz pytanie do pary młodej?",
  noMessagesYet: "Napisz do nas, jeśli masz jakieś pytanie.",
  messagePlaceholder: "Napisz wiadomość...",
  send: "Wyślij",

  yourTable: "Twój stolik",
  wantDifferentSeat: "Chcesz siedzieć gdzie indziej?",
  requestSentToCouple: "Prośba wysłana do pary.",
  alreadySentRequest: "Masz już wysłaną prośbę: {status}",
  lastRequest: "Ostatnia prośba: {status}",
  requestStatusPending: "Wysłana, czekamy na odpowiedź pary",
  requestStatusApproved: "Zaakceptowana - para wkrótce Was przesadzi",
  requestStatusDeclined: "Para zdecydowała zostawić obecne miejsce",
  quotedMessage: ' - "{message}"',
  seatChangeMessagePlaceholder:
    "Napisz do pary, gdzie / z kim wolałbyś/wolałabyś usiąść (opcjonalnie)",
  requestSeatChange: "Poproś o zmianę miejsca",
  confirmToChooseSeat: "Potwierdź obecność powyżej, żeby móc wybrać sobie miejsce przy stole.",
  chooseYourSeat: "Wybierz swoje miejsce",
  currentlyAt: "Obecnie: {table} ({room})",
  seatSaved: "Miejsce zapisane!",
  seatTakenError: "To miejsce zdążył zająć ktoś inny w międzyczasie - wybierz inne.",
  allSeatsTaken: "Wszystkie dostępne dla Ciebie miejsca są już zajęte - napisz do pary w czacie poniżej.",
  seatTakenSuffix: " · zajęte",
  seatIsYouSuffix: " · Ty",
  saveSelectedSeat: "Zapisz wybrane miejsce",

  galleryTitle: "Galeria zdjęć",

  musicTitle: "Lista muzyczna",
  musicLinkLabel: "🎵 Poproś o piosenkę",
  musicSearchPlaceholder: "Szukaj piosenki lub wykonawcy...",
  musicSearchButton: "Szukaj",
  musicAdd: "Dodaj",
  musicAdded: "Dodano do listy!",
  musicNoResults: "Nic nie znaleziono - spróbuj inaczej.",
  musicCurrentList: "Zgłoszone piosenki",
  musicEmpty: "Nikt jeszcze nic nie zgłosił - bądź pierwszy/a!",
  backToInvite: "← Wróć do zaproszenia",

  daysUntilWedding: "Zostało {days} dni do ślubu!",
  oneDayUntilWedding: "Jutro ślub!",
  todayIsWedding: "Dziś ślub! 🎉",

  scheduleTitle: "Harmonogram dnia",
  faqTitle: "Najczęstsze pytania",

  addToCalendar: "Dodaj do Google Calendar",
  downloadIcs: "Pobierz do kalendarza (.ics)",

  languageLabel: "Język",
  moreLanguages: "Więcej języków...",

  fetchingLanguageBanner: "Pobieramy Wasz język ({language})...",
  stayInEnglish: "Zostań przy angielskim",

  privacyPolicyLinkLabel: "Polityka prywatności",
  consentTitle: "Zanim przejdziesz dalej",
  consentIntro:
    "Żeby potwierdzić przybycie i korzystać z tej strony, potrzebujemy Twojej zgody na przetwarzanie danych, które nam podasz - imienia i nazwiska, odpowiedzi RSVP, ewentualnych uwag dietetycznych, miejsca przy stole, wiadomości do pary oraz zdjęć i próśb muzycznych, jeśli je dodasz. Szczegóły w polityce prywatności.",
  consentAgree: "Przeczytałem/am politykę prywatności i wyrażam zgodę na przetwarzanie moich danych w opisanym zakresie.",
  consentAgreeButton: "Zgadzam się, przejdź dalej",
  consentRequiredError: "Zgoda jest wymagana, żeby przejść dalej.",
  deleteMyDataLink: "Usuń moje dane",
  deleteMyDataTitle: "Usunięcie Twoich danych",
  deleteMyDataWarning:
    "Usunięte zostaną: Twoje dane osobowe, przypisane miejsce przy stole, wysłane wiadomości, prośby o zmianę miejsca oraz zdjęcia, które dodałeś/aś do galerii. Tej operacji nie da się cofnąć.",
  deleteMyDataConfirmButton: "Tak, usuń moje dane",
  deleteMyDataCancel: "Anuluj",
  deleteMyDataDone: "Twoje dane zostały usunięte. Dziękujemy, że byłeś/aś z nami.",

  groupPageIntro:
    "To wspólne zaproszenie dla kilku osób. Potwierdź obecność za każdą z nich osobno poniżej.",
  groupMembersTitle: "Osoby w tej grupie",
  groupConsentTitle: "Zanim przejdziecie dalej",
  groupConsentIntro:
    "Żeby potwierdzić obecność i korzystać z tej strony w imieniu osób wymienionych poniżej, potrzebujemy zgody na przetwarzanie ich danych - imion i nazwisk, odpowiedzi RSVP, ewentualnych uwag dietetycznych i miejsca przy stole. Szczegóły w polityce prywatności.",
  groupConsentAgree:
    "Przeczytałem/am politykę prywatności i wyrażam zgodę na przetwarzanie danych osób wymienionych powyżej w opisanym zakresie, w ich imieniu.",
  groupConsentAgreeButton: "Zgadzam się, przejdź dalej",
  groupConsentRequiredError: "Zgoda jest wymagana, żeby przejść dalej.",
  groupRsvpSectionTitle: "Potwierdźcie obecność",
  groupRsvpSavedThanks: "Dziękujemy, zapisaliśmy odpowiedzi całej grupy!",
  groupSaveAllButton: "Zapisz odpowiedzi",
  groupSeatSectionTitle: "Miejsca przy stołach",
  groupSeatIntro: "Możecie od razu usadzić potwierdzone osoby z tej grupy przy wolnych miejscach.",
  groupConfirmRsvpFirstForSeat: "Najpierw potwierdź obecność tej osoby powyżej.",
  groupSeatsSavedThanks: "Zapisaliśmy wybrane miejsca.",

  menuTitle: "Menu",
  menuAllergensPrefix: "Alergeny:",
};
