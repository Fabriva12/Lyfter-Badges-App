import Link from "next/link";
import type { ReactNode } from "react";

import { getSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const isSuperAdmin = session?.user.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#171b21] text-[#f1f1ed]">
      <div className="border-b border-[#303743] bg-[#1c222a]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-[#a8d889] text-xs font-black text-[#243020]">
              {isSuperAdmin ? "S" : "A"}
            </span>
            <span className="text-sm font-bold">
              {isSuperAdmin ? "Super admin console" : "Admin console"}
            </span>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-[#9ca3af] transition hover:text-[#f1f1ed]"
          >
            Back to site
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 py-10">{children}</div>
    </div>
  );
}
