import type { Metadata } from "next";
import Link from "next/link";

import StatCard from "@/components/admin/StatCard";
import { cardClassName } from "@/components/admin/formStyles";
import AddCompanyAdminForm from "@/components/admin/super-admin/AddCompanyAdminForm";
import CreateCompanyForm from "@/components/admin/super-admin/CreateCompanyForm";
import RemoveCompanyAdminButton from "@/components/admin/super-admin/RemoveCompanyAdminButton";
import { formatUtcRange } from "@/lib/admin/format";
import { requireSuperAdmin } from "@/lib/admin/guards";
import {
  getAllCompanies,
  getAllEventSummaries,
} from "@/lib/admin/queries";
import { EVENT_STATUS_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Super admin · Lyfter Badges",
};

export default async function SuperAdminPage() {
  await requireSuperAdmin();
  const [companies, events] = await Promise.all([
    getAllCompanies(),
    getAllEventSummaries(),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Super admin
        </p>
        <h1 className="mt-2 text-3xl font-bold">Platform overview</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Every company and event on the platform. Company admins only see their
          own scope.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Companies" value={companies.length} />
        <StatCard
          label="Company admins"
          value={companies.reduce(
            (total, company) => total + company.members.length,
            0,
          )}
        />
        <StatCard label="Events" value={events.length} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <CreateCompanyForm />

        <div className={cardClassName}>
          <h2 className="text-lg font-bold text-[#f1f1ed]">Companies</h2>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Add an existing account by email. Attendees are promoted to admin
            automatically.
          </p>

          {companies.length === 0 ? (
            <p className="mt-4 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-8 text-center text-sm text-[#9ca3af]">
              No companies created yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {companies.map((company) => (
                <li
                  key={company.id}
                  className="rounded-lg border border-[#39424f] bg-[#1f252d] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#f1f1ed]">
                        {company.name}
                      </h3>
                      <p className="text-xs text-[#9ca3af]">
                        /{company.slug} · {company.events} event
                        {company.events === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  {company.members.length > 0 ? (
                    <ul className="mt-3 divide-y divide-[#303743] text-sm">
                      {company.members.map((member) => (
                        <li
                          key={member.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2"
                        >
                          <div>
                            <span className="text-[#f1f1ed]">
                              {member.name}
                            </span>
                            <span className="ml-2 text-xs text-[#9ca3af]">
                              {member.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-[#7fd8f5]">
                              {member.role}
                            </span>
                            <RemoveCompanyAdminButton
                              companyId={company.id}
                              userId={member.id}
                              userName={member.name}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-[#9ca3af]">
                      No admins yet.
                    </p>
                  )}

                  <AddCompanyAdminForm companyId={company.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={cardClassName}>
        <h2 className="text-lg font-bold text-[#f1f1ed]">All events</h2>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Open any event as a super admin, regardless of its company.
        </p>

        {events.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-8 text-center text-sm text-[#9ca3af]">
            No events created yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#303743]">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="font-semibold text-[#f1f1ed] transition hover:text-[#7fd8f5]"
                  >
                    {event.name}
                  </Link>
                  <p className="text-xs text-[#9ca3af]">
                    {event.companyName ?? "No company"} ·{" "}
                    {EVENT_STATUS_LABELS[
                      event.status as keyof typeof EVENT_STATUS_LABELS
                    ] ?? event.status}{" "}
                    · {formatUtcRange(event.startsAt, event.endsAt)}
                  </p>
                </div>
                <span className="text-xs text-[#9ca3af]">
                  {event.badges} badges · {event.attendees} attendees
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
