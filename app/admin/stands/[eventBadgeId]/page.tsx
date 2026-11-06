import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Notice from "@/components/admin/Notice";
import StandVisits from "@/components/admin/StandVisits";
import StatCard from "@/components/admin/StatCard";
import TokenCard from "@/components/admin/TokenCard";
import { cardClassName } from "@/components/admin/formStyles";
import { formatUtcDateTime, formatUtcRange } from "@/lib/admin/format";
import { requireStandForAdmin } from "@/lib/admin/guards";
import { getStandDetail } from "@/lib/admin/queries";
import { getRequestOrigin } from "@/lib/request";

export const metadata: Metadata = {
  title: "Stand · Lyfter Badges",
};

interface StandPageProps {
  params: Promise<{ eventBadgeId: string }>;
}

export default async function AdminStandPage({ params }: StandPageProps) {
  const { eventBadgeId } = await params;
  const { stand: guardStand } = await requireStandForAdmin(eventBadgeId);

  const [stand, origin] = await Promise.all([
    getStandDetail(guardStand.id),
    getRequestOrigin(),
  ]);

  if (!stand) {
    notFound();
  }

  const activeTokens = stand.tokens.filter((token) => token.active).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← Your stands
        </Link>

        <header className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
            Partner stand
          </p>
          <h1 className="mt-2 text-3xl font-bold">{stand.badge.name}</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            {stand.event.name}
            {stand.room ? ` · ${stand.room}` : ""} ·{" "}
            {formatUtcRange(stand.event.startsAt, stand.event.endsAt)}
          </p>
          {stand.badge.description ? (
            <p className="mt-2 max-w-2xl text-sm text-[#9ca3af]">
              {stand.badge.description}
            </p>
          ) : null}
        </header>
      </div>

      <Notice tone="info">
        This view is read-only. Only the event organizer can create or
        deactivate QR tokens and change which stand you own.
      </Notice>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Scans" value={stand.scans} />
        <StatCard label="Visitors" value={stand.visitors} />
        <StatCard
          label="Active QR tokens"
          value={activeTokens}
          hint={`${stand.tokens.length} total`}
        />
        <StatCard label="XP per scan" value={`+${stand.badge.xpValue}`} />
      </div>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">QR tokens</h2>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Print these codes for the stand. Every scan awards the badge once per
          attendee.
        </p>

        <ul className="mt-5 space-y-3">
          {stand.tokens.length === 0 ? (
            <li className="text-sm text-[#9ca3af]">
              The organizer has not created a QR token for this stand yet.
            </li>
          ) : (
            stand.tokens.map((token) => (
              <li key={token.id}>
                <TokenCard
                  token={token}
                  origin={origin}
                  label={stand.badge.name}
                  canToggle={false}
                />
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClassName}>
          <h2 className="text-lg font-bold text-[#f1f1ed]">Recent visits</h2>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Attendees who scanned this stand, newest first.
          </p>
          <div className="mt-4">
            <StandVisits visits={stand.visits} />
          </div>
        </section>

        <section className={cardClassName}>
          <h2 className="text-lg font-bold text-[#f1f1ed]">Event</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#9ca3af]">Name</dt>
              <dd className="font-semibold text-[#f1f1ed]">
                {stand.event.name}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#9ca3af]">Location</dt>
              <dd className="font-semibold text-[#f1f1ed]">
                {stand.event.location ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#9ca3af]">Last scan</dt>
              <dd className="font-semibold text-[#f1f1ed]">
                {stand.lastScanAt
                  ? `${formatUtcDateTime(stand.lastScanAt)} UTC`
                  : "No scans yet"}
              </dd>
            </div>
          </dl>

          <Link
            href={`/leaderboard?event=${stand.event.slug}`}
            className="mt-5 inline-block rounded-lg border border-[#394351] px-4 py-2 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
          >
            Public leaderboard
          </Link>
        </section>
      </div>
    </div>
  );
}
