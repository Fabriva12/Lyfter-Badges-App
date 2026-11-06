import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import Link from "next/link";

import SignOutButton from "@/components/auth/SignOutButton";
import { getSession } from "@/lib/session";

export default async function Navbar() {
  // Cheap cookie existence check first, the same one `proxy.ts` uses. Only a
  // logged-in visitor pays for the real session read that reveals the role.
  const hasSessionCookie = Boolean(getSessionCookie(await headers()));
  const session = hasSessionCookie ? await getSession() : null;
  const role = session?.user.role;
  const panelEntry =
    role === "ADMIN"
      ? { href: "/admin", label: "Admin" }
      : role === "SUPER_ADMIN"
        ? { href: "/super-admin", label: "Super Admin" }
        : null;

  return (
    <header className="border-b border-[#303743]">
      <nav className="mx-auto flex h-20 items-center justify-between px-10">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Lyfter Badge App — inicio"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a8d889] font-bold text-[#243020]">
            L
          </div>

          <span className="text-base font-bold">Lyfter Badge App</span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 text-sm font-medium text-gray-300 md:flex">
          <Link href="/events" className="transition hover:text-white">
            Eventos
          </Link>

          <Link href="/#como-funciona" className="transition hover:text-white">
            Cómo funciona
          </Link>

          <Link href="/leaderboard" className="transition hover:text-white">
            Leaderboard
          </Link>

          <Link href="/collection" className="transition hover:text-white">
            Colección
          </Link>

          {panelEntry ? (
            <Link
              href={panelEntry.href}
              className="transition hover:text-white"
            >
              {panelEntry.label}
            </Link>
          ) : null}

          {session ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-[#36bde9] px-5 py-2 text-sm font-semibold transition hover:bg-[#36bde9]/10"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
