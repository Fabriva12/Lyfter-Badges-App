import Link from "next/link";

import type { EventSummary } from "@/lib/gamification/queries";

interface EventSelectorProps {
  events: EventSummary[];
  activeSlug: string | null;
}

export default function EventSelector({
  events,
  activeSlug,
}: EventSelectorProps) {
  return (
    <nav aria-label="Ranking scope" className="flex flex-wrap gap-3">
      <Link
        href="/leaderboard"
        aria-current={activeSlug === null ? "page" : undefined}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
          activeSlug === null
            ? "border-[#36bde9] bg-[#36bde9]/10 text-[#f1f1ed]"
            : "border-[#39424f] bg-[#252c35] text-[#9ca3af] hover:bg-[#272d36] hover:text-[#d7dce3]"
        }`}
      >
        Global
      </Link>

      {events.map((event) => {
        const isActive = event.slug === activeSlug;

        return (
          <Link
            key={event.id}
            href={`/leaderboard?event=${event.slug}`}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "border-[#36bde9] bg-[#36bde9]/10 text-[#f1f1ed]"
                : "border-[#39424f] bg-[#252c35] text-[#9ca3af] hover:bg-[#272d36] hover:text-[#d7dce3]"
            }`}
          >
            {event.name}
          </Link>
        );
      })}
    </nav>
  );
}
