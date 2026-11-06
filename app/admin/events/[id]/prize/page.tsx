import type { Metadata } from "next";
import Link from "next/link";

import EventTabs from "@/components/admin/EventTabs";
import Notice from "@/components/admin/Notice";
import PrizeForm from "@/components/admin/PrizeForm";
import { cardClassName } from "@/components/admin/formStyles";
import { formatUtcDateTime } from "@/lib/admin/format";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { getPrizeAdmin } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Prize · Admin · Lyfter Badges",
};

interface PrizePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function AdminPrizePage({
  params,
  searchParams,
}: PrizePageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { event } = await requireEventForAdmin(id);
  const { prize, badgeCount } = await getPrizeAdmin(event.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Prize</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          One prize per event. Attendees see it when they complete the set, or
          earlier if you announce it.
        </p>
      </div>

      {saved === "1" ? (
        <Notice tone="success">Prize saved.</Notice>
      ) : null}

      <EventTabs eventId={event.id} active="prize" />

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">Current state</h2>

        {!prize ? (
          <p className="mt-2 text-sm text-[#9ca3af]">
            No prize configured yet. The attendee collection shows no prize card
            for this event.
          </p>
        ) : (
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-widest text-[#9ca3af]">
                Attendee visibility
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#f1f1ed]">
                {prize.revealedAt
                  ? "Announced to everyone"
                  : "Secret until completion"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-[#9ca3af]">
                Requirement
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#f1f1ed]">
                {prize.requiredBadgesCount} of {badgeCount} badges
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-[#9ca3af]">
                Announced at
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#f1f1ed]">
                {prize.revealedAt
                  ? `${formatUtcDateTime(prize.revealedAt)} UTC`
                  : "Not announced"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <div className="max-w-3xl">
        <PrizeForm
          eventId={event.id}
          badgeCount={badgeCount}
          prize={prize}
        />
      </div>
    </div>
  );
}
