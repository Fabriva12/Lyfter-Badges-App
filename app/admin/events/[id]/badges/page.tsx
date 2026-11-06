import type { Metadata } from "next";
import Link from "next/link";

import AddBadgeForm from "@/components/admin/AddBadgeForm";
import BadgeAdminCard from "@/components/admin/BadgeAdminCard";
import CreateTokenForm from "@/components/admin/CreateTokenForm";
import EventTabs from "@/components/admin/EventTabs";
import Notice from "@/components/admin/Notice";
import TokenCard from "@/components/admin/TokenCard";
import { cardClassName } from "@/components/admin/formStyles";
import { requireEventForAdmin } from "@/lib/admin/guards";
import {
  getBadgeCatalog,
  getEventBadgesAdmin,
  getStandPartnerOptions,
  getWelcomeTokens,
} from "@/lib/admin/queries";
import { getRequestOrigin } from "@/lib/request";

export const metadata: Metadata = {
  title: "Badges & QR · Admin · Lyfter Badges",
};

interface BadgesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

const SAVED_MESSAGES: Record<string, string> = {
  badge: "Badge added to the event.",
  token: "QR tokens updated.",
  partner: "Stand partner updated.",
};

export default async function AdminBadgesPage({
  params,
  searchParams,
}: BadgesPageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { event } = await requireEventForAdmin(id);

  const [badges, welcomeTokens, catalog, partners, origin] = await Promise.all([
    getEventBadgesAdmin(event.id),
    getWelcomeTokens(event.id),
    getBadgeCatalog(),
    getStandPartnerOptions(),
    getRequestOrigin(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Badges & QR</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Each badge gets its own QR token. Print it and stick it on the talk
          wall or the stand; the welcome token goes at the entrance.
        </p>
      </div>

      {saved && SAVED_MESSAGES[saved] ? (
        <Notice tone="success">{SAVED_MESSAGES[saved]}</Notice>
      ) : null}

      <EventTabs eventId={event.id} active="badges" />

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">Add a badge</h2>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Pick a name from the catalog or type a new one.
        </p>

        <div className="mt-5">
          <AddBadgeForm eventId={event.id} catalog={catalog} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#f1f1ed]">
          Event badges ({badges.length})
        </h2>

        {badges.length === 0 ? (
          <p className="rounded-xl border border-[#39424f] bg-[#252c35] px-4 py-8 text-center text-sm text-[#9ca3af]">
            This event has no badges yet. Add the first one above.
          </p>
        ) : (
          <ul className="space-y-4">
            {badges.map((badge) => (
              <BadgeAdminCard
                key={badge.id}
                badge={badge}
                eventId={event.id}
                origin={origin}
                partners={partners}
              />
            ))}
          </ul>
        )}
      </section>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">Welcome QR</h2>
        <p className="mt-1 text-sm text-[#9ca3af]">
          A welcome token checks the attendee in. It awards no XP; badges only
          count after check-in.
        </p>

        <ul className="mt-5 space-y-3">
          {welcomeTokens.length === 0 ? (
            <li className="text-sm text-[#9ca3af]">
              No welcome token yet. Create one for the event entrance.
            </li>
          ) : (
            welcomeTokens.map((token) => (
              <li key={token.id}>
                <TokenCard
                  token={token}
                  eventId={event.id}
                  origin={origin}
                  label="Welcome check-in"
                />
              </li>
            ))
          )}
        </ul>

        <CreateTokenForm eventId={event.id} kind="WELCOME" />
      </section>
    </div>
  );
}
