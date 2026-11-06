import type { Metadata } from "next";
import Link from "next/link";

import BadgeTypeBreakdown from "@/components/collection/BadgeTypeBreakdown";
import EventCollectionCard from "@/components/collection/EventCollectionCard";
import LevelCard from "@/components/collection/LevelCard";
import PrizeSummary from "@/components/collection/PrizeSummary";
import {
  getCollectionOverview,
  getGlobalLeaderboard,
} from "@/lib/gamification/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My collection · Lyfter Badges",
};

export default async function CollectionPage() {
  const session = await requireSession();
  const [{ level, collections, totalXp }, globalRanking] = await Promise.all([
    getCollectionOverview(session.user.id),
    getGlobalLeaderboard(),
  ]);

  const hasCollections = collections.length > 0;
  const globalPosition =
    globalRanking.rows.find((row) => row.userId === session.user.id)
      ?.position ?? null;

  const typeCounts = new Map<string, number>();
  for (const collection of collections) {
    for (const badge of collection.badges) {
      if (badge.collected) {
        typeCounts.set(badge.type, (typeCounts.get(badge.type) ?? 0) + 1);
      }
    }
  }
  const typeBreakdown = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => a.type.localeCompare(b.type));

  const prizeItems = collections.flatMap((collection) =>
    collection.prize
      ? [
          {
            eventId: collection.eventId,
            eventName: collection.eventName,
            prize: collection.prize,
          },
        ]
      : [],
  );

  return (
    <main className="min-h-screen bg-[#171b21] text-[#f1f1ed]">
      <div className="mx-auto max-w-[1240px] px-4 py-16">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">My collection</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Level up across every Lyfter event. XP is global; badges belong to
            the event where you collected them.
          </p>
        </header>

        <div className="space-y-8">
          <LevelCard
            level={level}
            totalXp={totalXp}
            globalPosition={globalPosition}
            totalPlayers={globalRanking.rows.length}
          />

          <BadgeTypeBreakdown items={typeBreakdown} />

          <PrizeSummary items={prizeItems} />

          {hasCollections ? (
            collections.map((collection) => (
              <EventCollectionCard
                key={collection.eventId}
                collection={collection}
              />
            ))
          ) : (
            <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-8 text-center shadow-2xl shadow-black/30">
              <h2 className="text-lg font-bold text-[#f1f1ed]">
                You have not checked in to any event yet.
              </h2>
              <p className="mt-2 text-sm text-[#9ca3af]">
                Scan the welcome QR at a Lyfter event entrance to start
                collecting badges.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-lg border border-[#394351] px-6 py-3 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
              >
                Go to the homepage
              </Link>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
