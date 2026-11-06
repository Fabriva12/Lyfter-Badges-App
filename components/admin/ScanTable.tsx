import { formatUtcDateTime } from "@/lib/admin/format";
import type { RecentScan } from "@/lib/admin/queries";

interface ScanTableProps {
  scans: RecentScan[];
  emptyMessage?: string;
}

export default function ScanTable({
  scans,
  emptyMessage = "No scans yet.",
}: ScanTableProps) {
  if (scans.length === 0) {
    return (
      <p className="rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-widest text-[#9ca3af]">
          <tr>
            <th className="py-2 pr-4 font-semibold">Attendee</th>
            <th className="py-2 pr-4 font-semibold">Badge</th>
            <th className="py-2 pr-4 font-semibold">XP</th>
            <th className="py-2 font-semibold">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#303743]">
          {scans.map((scan) => (
            <tr key={scan.id}>
              <td className="py-3 pr-4 text-[#f1f1ed]">
                {scan.attendeeName}
                <span className="block text-xs text-[#6b7280]">
                  {scan.attendeeEmail}
                </span>
              </td>
              <td className="py-3 pr-4 text-[#d7dce3]">{scan.badgeName}</td>
              <td className="py-3 pr-4 text-[#a8d889]">+{scan.xpAwarded}</td>
              <td className="py-3 text-[#9ca3af]">
                {formatUtcDateTime(scan.scannedAt)} UTC
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
