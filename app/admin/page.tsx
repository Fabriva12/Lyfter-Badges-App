import type { Metadata } from "next";
import { redirect } from "next/navigation";

import OrganizerDashboard from "@/components/admin/OrganizerDashboard";
import PartnerDashboard from "@/components/admin/PartnerDashboard";
import { requireAdmin } from "@/lib/admin/guards";
import {
  getAdminCompanies,
  getCompanyEventSummaries,
  getStandSummaries,
} from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Lyfter Badges",
};

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/super-admin");
  }

  const [companies, stands] = await Promise.all([
    getAdminCompanies(session.user.id),
    getStandSummaries(session.user.id),
  ]);

  if (companies.length === 0 && stands.length === 0) {
    return (
      <p className="rounded-xl border border-[#39424f] bg-[#252c35] px-4 py-8 text-center text-sm text-[#9ca3af]">
        Your account has no company or stand assigned yet. Ask a super admin to
        grant you access.
      </p>
    );
  }

  const events = await getCompanyEventSummaries(
    companies.map((company) => company.id),
  );

  return (
    <div className="space-y-14">
      {companies.length > 0 ? (
        <OrganizerDashboard events={events} companies={companies} />
      ) : null}

      {stands.length > 0 ? <PartnerDashboard stands={stands} /> : null}
    </div>
  );
}
