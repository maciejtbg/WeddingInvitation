// Jeden współdzielony klient Stripe - leniwie tworzony (nie przy imporcie
// modułu), żeby brak STRIPE_SECRET_KEY nie wywalał całej aplikacji na
// starcie (np. w lokalnym developmencie bez skonfigurowanych płatności) -
// błąd pojawia się dopiero przy faktycznej próbie użycia (zakup pakietu),
// z czytelnym komunikatem zamiast suchego stack trace'u z SDK.

import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (client) return client;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Płatności nie są jeszcze skonfigurowane (brak STRIPE_SECRET_KEY) - patrz README, sekcja Płatności."
    );
  }
  client = new Stripe(secretKey);
  return client;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
