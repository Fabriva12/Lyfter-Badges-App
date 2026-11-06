import Image from "next/image";

import PrizePanel from "@/components/collection/PrizePanel";
import type { EventCollection } from "@/lib/gamification/queries";

interface EventCollectionCardProps {
  collection: EventCollection;
}

function formatEventDate(startsAt: Date, endsAt: Date) {
  const day = startsAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const start = startsAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  const end = endsAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return `${day} · ${start} – ${end} UTC`;
}

export default function EventCollectionCard({
  collection,
}: EventCollectionCardProps) {
  const { progress, prize, badges } = collection;
  const percent = Math.round(progress.progress * 100);

  return (
    <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-8 shadow-2xl shadow-black/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f1f1ed]">
            {collection.eventName}
          </h2>
          <p className="mt-1 text-sm text-[#9ca3af]">
            {formatEventDate(collection.startsAt, collection.endsAt)}
          </p>
        </div>

        <p className="text-sm font-semibold text-[#d7dce3]">
          {progress.collected} / {progress.total} badges
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Badge collection progress for ${collection.eventName}`}
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#39424f]"
      >
        <div
          className="h-full rounded-full bg-[#36bde9] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {prize ? <PrizePanel prize={prize} /> : null}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {badges.map((badge) => (
          <li
            key={badge.eventBadgeId}
            className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${
              badge.collected
                ? "border-[#a8d889]/40 bg-[#a8d889]/5"
                : "border-[#39424f] bg-[#1f252d] opacity-70"
            }`}
          >
            {badge.imageUrl ? (
              <Image
                src={badge.imageUrl}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="rounded-lg object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                  badge.collected
                    ? "bg-[#a8d889] text-[#263021]"
                    : "bg-[#39424f] text-[#9ca3af]"
                }`}
              >
                {badge.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#f1f1ed]">
                {badge.name}
              </p>
              <p className="truncate text-xs text-[#9ca3af]">
                {badge.collected
                  ? `+${badge.xpValue} XP · collected`
                  : `+${badge.xpValue} XP · not collected`}
                {badge.room ? ` · ${badge.room}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
