// Webhook Stripe - potwierdza opłacone pakiety zdjęć (patrz
// src/lib/db/photoPackPurchases.ts, confirmPhotoPackPurchase). To jest
// ŹRÓDŁO PRAWDY dla "czy para faktycznie zapłaciła" - strona powrotna z
// Checkout (patrz app/admin/gallery/page.tsx) wywołuje tę samą funkcję
// tylko jako szybszy, nieautorytatywny podgląd (webhook może dojść z
// opóźnieniem albo wcale, jeśli para zamknie kartę zaraz po płatności).
//
// Adres tego route handlera trzeba wkleić w panelu Stripe (Developers ->
// Webhooks -> Add endpoint): https://TWOJA-DOMENA/api/stripe-webhook,
// nasłuchując zdarzenia checkout.session.completed - patrz README, sekcja
// Płatności.
//
// UWAGA: weryfikacja podpisu (stripe.webhooks.constructEvent) wymaga SUROWEGO
// ciała żądania, dokładnie takiego, jakie wysłał Stripe - dlatego czytamy
// request.text(), NIGDY request.json() (które by je sparsowało i zgubiło
// oryginalny bajtowy zapis, przez co podpis by się nie zgadzał).

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripeClient";
import { confirmPhotoPackPurchase } from "@/lib/db/photoPackPurchases";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET nie jest ustawiony" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Brak podpisu" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Nieprawidłowy podpis: ${message}` }, { status: 400 });
  }

  // async_payment_succeeded obsługuje metody płatności, które nie
  // rozliczają się natychmiast (np. niektóre przelewy) - checkout.session
  // wtedy najpierw przychodzi ze statusem "unpaid", a potwierdzenie
  // przychodzi osobnym zdarzeniem później.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      confirmPhotoPackPurchase(session.id);
    }
  }

  return NextResponse.json({ received: true });
}
