import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import ScanClaim from "@/components/scan/ScanClaim";
import { prisma } from "@/lib/db";
import { getRequestOrigin } from "@/lib/request";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Collect your badge · Lyfter Badges",
};

interface ScanPageProps {
  params: Promise<{ token: string }>;
}

export default async function ScanPage({ params }: ScanPageProps) {
  const { token } = await params;

  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/s/${token}`)}`);
  }

  const qr = await prisma.qrToken.findUnique({
    where: { token },
    include: { event: true, eventBadge: { include: { badge: true } } },
  });

  if (!qr || !qr.active) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#171b21] px-4 py-16">
        <div className="w-full max-w-md rounded-xl border border-[#39424f] bg-[#252c35] p-8 text-center shadow-2xl shadow-black/30">
          <h1 className="text-lg font-bold text-[#f1f1ed]">
            This QR code is not valid or is no longer active.
          </h1>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg border border-[#394351] px-6 py-3 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
          >
            Go to the homepage
          </Link>
        </div>
      </main>
    );
  }

  const isWelcome = qr.kind === "WELCOME";
  const badge = qr.eventBadge?.badge ?? null;
  const origin = await getRequestOrigin();

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#171b21] px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-[#39424f] bg-[#252c35] p-8 text-center shadow-2xl shadow-black/30">
        {isWelcome ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#36bde9]">
              Check in
            </p>
            <h1 className="mt-3 text-2xl font-bold text-[#f1f1ed]">
              {qr.event.name}
            </h1>
            <p className="mt-3 text-sm text-[#9ca3af]">
              Welcome! Claim your check-in below.
            </p>
          </>
        ) : badge ? (
          <>
            {badge.imageUrl ? (
              <Image
                src={badge.imageUrl}
                alt={badge.name}
                width={96}
                height={96}
                unoptimized
                className="mx-auto rounded-2xl object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-[#a8d889] text-4xl font-black text-[#263021]"
              >
                {badge.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="mt-5 text-2xl font-bold text-[#f1f1ed]">
              {badge.name}
            </h1>
            {badge.description ? (
              <p className="mt-2 text-sm text-[#d7dce3]">{badge.description}</p>
            ) : null}
            <p className="mt-3 text-sm font-semibold text-[#a8d889]">
              +{badge.xpValue} XP
            </p>
            {qr.eventBadge?.room ? (
              <p className="mt-1 text-sm text-[#9ca3af]">
                {qr.eventBadge.room}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-[#9ca3af]">{qr.event.name}</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-[#f1f1ed]">
              This QR code is not configured correctly.
            </h1>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg border border-[#394351] px-6 py-3 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Go to the homepage
            </Link>
          </>
        )}
      </div>

      {isWelcome || badge ? <ScanClaim token={token} origin={origin} /> : null}
    </main>
  );
}
