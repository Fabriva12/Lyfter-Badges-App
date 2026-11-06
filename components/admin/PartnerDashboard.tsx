import Link from "next/link";

import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import { formatUtcRange } from "@/lib/admin/format";
import type { StandSummary } from "@/lib/admin/queries";

interface PartnerDashboardProps {
  stands: StandSummary[];
}

export default function PartnerDashboard({ stands }: PartnerDashboardProps) {
  const totals = stands.reduce(
    (accumulator, stand) => ({
      scans: accumulator.scans + stand.scans,
      visitors: accumulator.visitors + stand.visitors,
    }),
    { scans: 0, visitors: 0 },
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Stand console
        </p>
        <h1 className="mt-2 text-3xl font-bold">Your stands</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Traffic for the badges assigned to you. A stand admin only sees their
          own stand, never the rest of the event.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Stands" value={stands.length} />
        <StatCard
          label="Total scans"
          value={totals.scans}
          hint={`${totals.visitors} visitor check-ins`}
        />
      </div>

      {stands.length === 0 ? (
        <p className="rounded-xl border border-[#39424f] bg-[#252c35] px-4 py-8 text-center text-sm text-[#9ca3af]">
          No stand has been assigned to your account yet. Ask the event admin
          to link your account to a stand.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {stands.map((stand) => (
            <li key={stand.id} className={cardClassName}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#f1f1ed]">
                    {stand.badgeName}
                  </h2>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    {stand.eventName}
                    {stand.room ? ` · ${stand.room}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    {formatUtcRange(stand.startsAt, stand.endsAt)}
                  </p>
                </div>
                <span className="rounded-full bg-[#36bde9]/10 px-3 py-1 text-xs font-semibold text-[#7fd8f5]">
                  +{stand.xpValue} XP
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-[#1f252d] px-2 py-3">
                  <dt className="text-xs text-[#9ca3af]">Scans</dt>
                  <dd className="mt-1 text-lg font-bold">{stand.scans}</dd>
                </div>
                <div className="rounded-lg bg-[#1f252d] px-2 py-3">
                  <dt className="text-xs text-[#9ca3af]">Visitors</dt>
                  <dd className="mt-1 text-lg font-bold">{stand.visitors}</dd>
                </div>
              </dl>

              <Link
                href={`/admin/stands/${stand.id}`}
                className="mt-5 inline-block rounded-lg bg-[#a8d889] px-4 py-2 text-sm font-semibold text-[#263021] transition hover:bg-[#b8e39a]"
              >
                Open stand
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
