#!/usr/bin/env bash
# Buduje aplikację w kontenerze Docker linux/amd64 (Node 22, Debian/glibc -
# to samo, co typowy VPS z Ubuntu/Debianem) i pakuje wynik do tar.gz gotowego
# do przesłania na serwer. Patrz deploy/DEPLOY.md, sekcja "Redeploy po
# zmianach w kodzie".
#
# PO CO TO ISTNIEJE (nie wystarczy `npm run build` bezpośrednio na serwerze):
# małe VPS-y (np. mikr.us, 1 GB RAM, kontener LXC BEZ możliwości dodania
# swapu - brak uprawnień do swapon) nie mają dość pamięci na build Next.js
# 16 z Turbopackiem (peak RSS ~1.3-1.6 GB). Budowanie na innej maszynie niż
# produkcyjna wymaga tej samej architektury/libc (stąd --platform linux/amd64
# i obraz oparty o Debiana, nie Alpine/musl) - inaczej natywne zależności
# (sharp) się nie połączą.
#
# Użycie:
#   bash deploy/build-linux-bundle.sh
#   scp -P <port> /tmp/wedding-app-build.tar.gz <user>@<host>:/tmp/
#   (na serwerze, jako użytkownik aplikacji:)
#     cd /sciezka/do/aplikacji && rm -rf .next && tar -xzf /tmp/wedding-app-build.tar.gz
#     systemctl restart wedding-app   # jako root

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH="$(mktemp -d)"
OUT="/tmp/wedding-app-build.tar.gz"

cleanup() { rm -rf "$SCRATCH"; }
trap cleanup EXIT

echo "==> Kopiuję repo do katalogu roboczego (bez node_modules/.next/data/.git)..."
tar --exclude='node_modules' --exclude='.next' --exclude='data' --exclude='.git' \
  -C "$REPO_ROOT" -cf - . | tar -C "$SCRATCH" -xf -

echo "==> Buduję w kontenerze node:22-bookworm-slim (linux/amd64)..."
# UWAGA: baza SQLite użyta tylko do builda (dane wymagane, żeby next build
# w ogóle zaimportował moduły db) MUSI leżeć WEWNĄTRZ systemu plików
# kontenera (/tmp/build.db), NIE na zamontowanym z hosta wolumenie - blokady
# plikowe SQLite (busy_timeout) nie działają poprawnie przez bind-mount
# Dockera na Windows/macOS, co objawia się jako losowe "database is locked"
# podczas "Collecting page data" (próbowaliśmy, złapane empirycznie).
MSYS_NO_PATHCONV=1 docker run --rm --platform linux/amd64 \
  -v "$SCRATCH:/app" -w /app \
  -e DATABASE_FILE=/tmp/build.db \
  -e SESSION_SECRET=build-only-secret-not-for-prod \
  node:22-bookworm-slim \
  bash -c "npm ci && npm run build"

echo "==> Pakuję .next do $OUT..."
# .next/node_modules zawiera symlinki (np. sharp-<hash> -> ../../node_modules/sharp)
# wymagane w runtime przez zewnętrzne moduły native - NIE wykluczać (złapane
# empirycznie: bez tego katalogu produkcyjny serwer wywala
# "Cannot find package 'sharp-<hash>'" przy pierwszym użyciu sharp).
# .next/cache i .next/standalone wykluczamy - nieużywane w tym sposobie
# wdrożenia (patrz next.config.ts, komentarz przy braku output: "standalone").
tar --exclude='.next/cache' --exclude='.next/standalone' --exclude='.next/diagnostics' \
  -C "$SCRATCH" -czf "$OUT" .next

echo "==> Gotowe: $OUT ($(du -h "$OUT" | cut -f1))"
