import type { Metadata } from "next";
import Link from "next/link";

import EventSelector from "@/components/leaderboard/EventSelector";
import LeaderboardPodium from "@/components/leaderboard/LeaderboardPodium";
import LeaderboardTable, {
  AttendeeRow,
} from "@/components/leaderboard/LeaderboardTable";
import { formatEventDate } from "@/lib/format";
import {
  getEventSummaries,
  getGlobalLeaderboard,
  getLeaderboard,
} from "@/lib/gamification/queries";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Leaderboard · Lyfter Badges",
};

const TOP_ROWS = 10;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const session = await requireSession();
  const { event: requestedSlug } = await searchParams;
  const events = await getEventSummaries();
  const selected = requestedSlug
    ? (events.find((event) => event.slug === requestedSlug) ?? events[0] ?? null)
    : null;
  const isGlobal = selected === null;

  const ranking = selected
    ? await getLeaderboard(selected.id)
    : await getGlobalLeaderboard();
  const rows = ranking.rows;
  const topRows = rows.slice(0, TOP_ROWS);
  const currentUser =
    rows.find((row) => row.userId === session.user.id) ?? null;
  const isCurrentUserOutsideTop =
    currentUser !== null &&
    !topRows.some((row) => row.userId === currentUser.userId);

  return (
    <main className="min-h-screen bg-[#171b21] text-[#f1f1ed]">
      <div className="mx-auto max-w-[1240px] px-4 py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            {isGlobal ? "All events" : "Per-event ranking"}
          </p>
          <h1 className="mt-2 text-3xl font-bold">Leaderboard</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            {isGlobal
              ? "XP earned across every event. Pick an event below to rank only that event."
              : "XP earned inside a single event. Only the badges of the selected event count, so every event is a fair fight."}
          </p>
        </header>

        <div className="space-y-8">
          <EventSelector events={events} activeSlug={selected?.slug ?? null} />

          <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-8 shadow-2xl shadow-black/30">
            <h2 className="text-xl font-bold text-[#f1f1ed]">
              {isGlobal ? "Global ranking" : (selected?.name ?? "")}
            </h2>
            <p className="mt-1 text-sm text-[#9ca3af]">
              {isGlobal
                ? "Every attendee with at least one badge, across every event."
                : `${formatEventDate(selected.startsAt, selected.endsAt)}${
                    selected.location ? ` · ${selected.location}` : ""
                  }`}
            </p>
          </section>

          {rows.length === 0 ? (
            <section className="rounded-xl border border-[#39424f] bg-[#252c35] p-8 text-center shadow-2xl shadow-black/30">
              <h2 className="text-lg font-bold text-[#f1f1ed]">
                Nobody scored yet{isGlobal ? "" : " in this event"}.
              </h2>
              <p className="mt-2 text-sm text-[#9ca3af]">
                The ranking appears as soon as the first attendee scans a
                badge.
              </p>
            </section>
          ) : (
            <>
              <LeaderboardPodium entries={ranking.top} />

              <LeaderboardTable
                rows={topRows}
                currentUserId={session.user.id}
              />

              {isCurrentUserOutsideTop && currentUser ? (
                <section className="rounded-xl border border-[#36bde9]/40 bg-[#252c35] p-8 shadow-2xl shadow-black/30">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
                    Your position
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[#f1f1ed]">
                    You are outside the top {TOP_ROWS}
                  </h2>

                  <div className="mt-6">
                    <AttendeeRow row={currentUser} isCurrent />
                  </div>

                  <p className="mt-4 text-sm text-[#9ca3af]">
                    Keep scanning badges to climb the ranking.
                  </p>
                </section>
              ) : null}
            </>
          )}

          {!isGlobal && events.length === 0 ? (
            <p className="text-center text-sm text-[#9ca3af]">
              There are no published events yet.{" "}
              <Link href="/" className="text-[#7fd8f5] hover:underline">
                Go to the homepage
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
