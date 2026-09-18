// Bloki informacyjne wspólne dla stron gościa (moje-zaproszenie i grupa) -
// mapa dojazdu, historia pary, film, informacja o prezentach, harmonogram,
// FAQ. Wydzielone z app/[slug]/moje-zaproszenie/page.tsx, żeby strona
// zaproszenia grupowego (app/[slug]/grupa/page.tsx) mogła pokazać dokładnie
// to samo bez powielania JSX - te dane są wspólne dla całego wesela, nie
// per-gość, więc nie ma tu żadnego rozgałęzienia na "kto pyta".

import type { Wedding, WeddingLocation, ScheduleItem, FaqItem, MenuItem } from "@/lib/db/types";
import { getLocationKind } from "@/lib/locationKinds";
import LocationsMap from "@/components/LocationsMapLoader";
import { toEmbedUrl } from "@/lib/videoEmbed";
import { resolveAllergens } from "@/lib/allergens";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface Props {
  wedding: Wedding;
  locations: WeddingLocation[];
  scheduleItems: ScheduleItem[];
  faqItems: FaqItem[];
  menuItems: MenuItem[];
  dict: Dictionary;
}

export default function WeddingInfoSections({
  wedding,
  locations,
  scheduleItems,
  faqItems,
  menuItems,
  dict,
}: Props) {
  return (
    <>
      {locations.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-center wd-heading-font text-xl text-[var(--wd-text)]">
            {dict.howToFindUs}
          </h2>
          <LocationsMap locations={locations} />
          <div className="mt-3 space-y-1">
            {locations.map((loc) => {
              const kind = getLocationKind(loc.kind);
              return (
                <p key={loc.id} className="text-xs text-[var(--wd-muted)]">
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ background: kind.color }}
                  />
                  <strong className="text-[var(--wd-text)]">{loc.label}</strong>
                  {" - "}
                  {kind.label}
                  {loc.address ? `, ${loc.address}` : ""}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {wedding.story && (
        <p className="mb-8 whitespace-pre-line text-center text-[var(--wd-text)]">
          {wedding.story}
        </p>
      )}

      {wedding.videoUrl &&
        (() => {
          const embedUrl = toEmbedUrl(wedding.videoUrl);
          return (
            <div className="mb-8">
              {embedUrl ? (
                <div className="aspect-video overflow-hidden rounded-lg border border-[var(--wd-border)]">
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Film"
                  />
                </div>
              ) : (
                <a
                  href={wedding.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--wd-accent)] underline"
                >
                  🎬 Zobacz film
                </a>
              )}
            </div>
          );
        })()}

      {wedding.giftNote && (
        <p className="mb-8 whitespace-pre-line rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] px-4 py-3 text-sm text-[var(--wd-muted)]">
          {wedding.giftNote}
        </p>
      )}

      {scheduleItems.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-center wd-heading-font text-xl text-[var(--wd-text)]">
            {dict.scheduleTitle}
          </h2>
          <div className="space-y-3 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-4">
            {scheduleItems.map((item, index) => {
              const prevDay = index > 0 ? scheduleItems[index - 1].dayLabel : undefined;
              const showDayHeader = item.dayLabel && item.dayLabel !== prevDay;
              return (
                <div key={item.id}>
                  {showDayHeader && (
                    <p className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--wd-accent)]">
                      {item.dayLabel}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <span className="w-16 shrink-0 text-sm font-medium text-[var(--wd-accent)]">
                      {item.timeLabel}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--wd-text)]">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-[var(--wd-muted)]">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {menuItems.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-center wd-heading-font text-xl text-[var(--wd-text)]">
            {dict.menuTitle}
          </h2>
          <div className="space-y-3 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-4">
            {menuItems.map((item, index) => {
              const prevCategory = index > 0 ? menuItems[index - 1].category : undefined;
              const showCategoryHeader = item.category && item.category !== prevCategory;
              const allergens = resolveAllergens(item.allergens);
              return (
                <div key={item.id}>
                  {showCategoryHeader && (
                    <p className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--wd-accent)]">
                      {item.category}
                    </p>
                  )}
                  <p className="text-sm font-medium text-[var(--wd-text)]">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-[var(--wd-muted)]">{item.description}</p>
                  )}
                  {allergens.length > 0 && (
                    <p className="text-xs text-[var(--wd-muted)]">
                      {dict.menuAllergensPrefix}{" "}
                      {allergens.map((a) => `${a.icon} ${a.label}`).join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {faqItems.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-center wd-heading-font text-xl text-[var(--wd-text)]">
            {dict.faqTitle}
          </h2>
          <div className="space-y-2">
            {faqItems.map((item) => (
              <details
                key={item.id}
                className="rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-3"
              >
                <summary className="cursor-pointer text-sm font-medium text-[var(--wd-text)]">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm text-[var(--wd-muted)]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
