import type { Metadata } from "next";
import Link from "next/link";

import EventTabs from "@/components/admin/EventTabs";
import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { formatUtcDateTime } from "@/lib/admin/format";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { getEventAttendees } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Participants · Admin · Lyfter Badges",
};

interface AttendeesPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAttendeesPage({
  params,
}: AttendeesPageProps) {
  const { id } = await params;
  const { event } = await requireEventForAdmin(id);

  const attendees = await getEventAttendees(event.id);
  const totalBadges = attendees.reduce(
    (total, attendee) => total + attendee.badges.length,
    0,
  );
  const checkedIn = attendees.filter(
    (attendee) => attendee.badges.length > 0,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/events/${event.id}`}
          className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
        >
          ← {event.name}
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Participants</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Registered attendees, the badges each one redeemed and their XP in
          this event.
        </p>
      </div>

      <EventTabs eventId={event.id} active="attendees" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registered" value={attendees.length} />
        <StatCard label="Collected a badge" value={checkedIn} />
        <StatCard label="Badges redeemed" value={totalBadges} />
      </div>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">Attendee list</h2>

        {attendees.length === 0 ? (
          <p className="mt-5 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
            Nobody registered to this event yet.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-[#9ca3af]">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Attendee</th>
                  <th className="py-2 pr-4 font-semibold">Registered</th>
                  <th className="py-2 pr-4 font-semibold">Badges redeemed</th>
                  <th className="py-2 font-semibold">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303743]">
                {attendees.map((attendee) => (
                  <tr key={attendee.userId}>
                    <td className="py-3 pr-4 align-top text-[#f1f1ed]">
                      {attendee.name}
                      <span className="block text-xs text-[#6b7280]">
                        {attendee.email}
                      </span>
                    </td>
                    <td className="py-3 pr-4 align-top text-[#9ca3af]">
                      {formatUtcDateTime(attendee.registeredAt)} UTC
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {attendee.badges.length === 0 ? (
                        <span className="text-[#6b7280]">None yet</span>
                      ) : (
                        <ul className="flex flex-wrap gap-1.5">
                          {attendee.badges.map((badge) => (
                            <li
                              key={badge.eventBadgeId}
                              className="rounded-full bg-[#36bde9]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7fd8f5]"
                              title={`${formatUtcDateTime(badge.scannedAt)} UTC`}
                            >
                              {badge.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-3 align-top font-semibold text-[#a8d889]">
                      {attendee.xpEarned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
