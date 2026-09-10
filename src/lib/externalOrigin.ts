import type { NextRequest } from "next/server";

/** `request.url` w Route Handlerze odzwierciedla adres, POD KTÓRYM Next.js
 * faktycznie nasłuchuje (np. "http://localhost:3000"), nie publiczny adres
 * z przeglądarki gościa - za reverse proxy (nginx, tunel mikr.us/Cloudflare)
 * to dwie różne rzeczy. Bez tego przekierowania prowadziłyby z powrotem na
 * localhost:3000 zamiast na prawdziwą domenę - złapane empirycznie przy
 * wdrożeniu na mikr.us (patrz deploy/DEPLOY.md). `X-Forwarded-Host`/
 * `X-Forwarded-Proto` są ustawiane przez nginx (patrz deploy/nginx.conf) -
 * z fallbackiem na request.url dla `next dev` bez proxy. */
export function externalOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
