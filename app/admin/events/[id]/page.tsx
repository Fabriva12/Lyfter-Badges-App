import type { Metadata } from "next";
import Link from "next/link";

import EventForm from "@/components/admin/EventForm";
import EventGallery from "@/components/admin/EventGallery";
import EventTabs from "@/components/admin/EventTabs";
import Notice from "@/components/admin/Notice";
import ScanTable from "@/components/admin/ScanTable";
import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { formatUtcRange } from "@/lib/admin/format";
import { getEventMetrics, getRecentEventScans } from "@/lib/admin/queries";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Event · Admin · Lyfter Badges",
};

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function AdminEventPage({
  params,
  searchParams,
}: EventPageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { event } = await requireEventForAdmin(id);

  const [metrics, recentScans] = await Promise.all([
    getEventMetrics(event.id),
    getRecentEventScans(event.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← All events
        </Link>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="mt-2 text-sm text-[#9ca3af]">
              {formatUtcRange(event.startsAt, event.endsAt)}
              {event.location ? ` · ${event.location}` : ""}
              {event.country ? `, ${event.country}` : ""}
            </p>
            <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className="rounded-full border border-[#39424f] px-3 py-1 text-[#9ca3af]">
                {EVENT_MODE_LABELS[event.mode] ?? event.mode}
              </span>
              <span className="rounded-full bg-[#36bde9]/15 px-3 py-1 text-[#7fd8f5]">
                {EVENT_STATUS_LABELS[event.status] ?? event.status}
              </span>
            </p>
            <p className="mt-1 font-mono text-xs text-[#6b7280]">
              {event.slug}
            </p>
          </div>

          <Link
            href={`/leaderboard?event=${event.slug}`}
            className="rounded-lg border border-[#394351] px-4 py-2 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
          >
            Public leaderboard
          </Link>
        </header>
      </div>

      {saved === "1" ? (
        <Notice tone="success">Event saved. The public views are fresh.</Notice>
      ) : null}

      {saved === "image" ? (
        <Notice tone="success">Gallery updated.</Notice>
      ) : null}

      <EventTabs eventId={event.id} active="overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendees" value={metrics.attendees} />
        <StatCard label="Scans" value={metrics.scans} />
        <StatCard label="Badges" value={metrics.badges} />
        <StatCard
          label="Active QR tokens"
          value={metrics.activeTokens}
          hint={`${metrics.xpAwarded} XP awarded in this event`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <EventForm event={event} />

        <section className={cardClassName}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#f1f1ed]">Recent scans</h2>
            <Link
              href={`/admin/events/${event.id}/scans`}
              className="text-sm font-semibold text-[#36bde9] hover:text-[#7fd8f5]"
            >
              View all
            </Link>
          </div>

          <div className="mt-5">
            <ScanTable
              scans={recentScans}
              emptyMessage="Nobody scanned a badge in this event yet."
            />
          </div>
        </section>
      </div>

      <EventGallery eventId={event.id} images={event.images} />
    </div>
  );
}
