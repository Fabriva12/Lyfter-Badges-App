"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { claimScan } from "@/app/s/[token]/actions";
import ShareButtons from "@/components/share/ShareButtons";
import type { ScanFormState } from "@/lib/forms";
import { buildShareText } from "@/lib/share";

interface ScanClaimProps {
  token: string;
  origin: string;
}

const initialState: ScanFormState = { status: "idle" };

export default function ScanClaim({ token, origin }: ScanClaimProps) {
  const [state, formAction, isPending] = useActionState(
    claimScan,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    if (hasAutoSubmitted.current) {
      return;
    }
    hasAutoSubmitted.current = true;
    formRef.current?.requestSubmit();
  }, []);

  const isTerminal =
    state.status === "collected" ||
    state.status === "checked-in" ||
    state.status === "error";

  return (
    <div className="mt-6 w-full max-w-md">
      <form
        action={formAction}
        ref={formRef}
        className="rounded-xl border border-[#39424f] bg-[#252c35] p-7 shadow-2xl shadow-black/30"
      >
        <input type="hidden" name="token" value={token} />

        {state.status === "collected" ? (
          <div
            role="status"
            className="rounded-lg border border-[#a8d889]/40 bg-[#a8d889]/10 px-4 py-4 text-center"
          >
            <p className="text-base font-bold text-[#a8d889]">
              {state.badge.name}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#a8d889]">
              +{state.badge.xpAwarded} XP
            </p>
            <p className="mt-2 text-sm text-[#d7dce3]">
              Badge collected at {state.eventName}.
            </p>
            {state.levelUp ? (
              <p className="mt-2 text-sm font-bold text-[#36bde9]">
                Level up! You are now {state.levelUp.name}
              </p>
            ) : null}
            {state.alreadyCollected ? (
              <p className="mt-1 text-sm text-[#9ca3af]">
                You already collected this badge.
              </p>
            ) : null}
            <div className="mt-4">
              <ShareButtons
                url={`${origin}/badge/${state.badge.eventBadgeId}`}
                text={buildShareText({
                  badgeName: state.badge.name,
                  eventName: state.eventName,
                  xp: state.badge.xpAwarded,
                })}
                title={state.badge.name}
              />
            </div>
          </div>
        ) : null}

        {state.status === "checked-in" ? (
          <div
            role="status"
            className="rounded-lg border border-[#a8d889]/40 bg-[#a8d889]/10 px-4 py-4 text-center"
          >
            <p className="text-base font-bold text-[#a8d889]">
              You&apos;re checked in at {state.eventName}.
            </p>
            {state.alreadyCheckedIn ? (
              <p className="mt-2 text-sm text-[#9ca3af]">
                You were already checked in.
              </p>
            ) : null}
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="space-y-4 text-center">
            <p
              role="alert"
              className="rounded-lg border border-[#f47f8a]/40 bg-[#f47f8a]/10 px-4 py-3 text-sm font-medium text-[#ffb3ba]"
            >
              {state.message}
            </p>
            <Link
              href="/"
              className="inline-block rounded-lg border border-[#394351] px-6 py-3 text-sm font-semibold text-[#d7dce3] transition hover:bg-[#272d36]"
            >
              Go to the homepage
            </Link>
          </div>
        ) : null}

        {isPending ? (
          <p className="animate-pulse text-center text-sm font-semibold text-[#9ca3af]">
            Awarding your badge…
          </p>
        ) : null}

        {!isTerminal ? (
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 w-full rounded-lg bg-[#a8d889] px-6 py-3 text-sm font-bold text-[#263021] transition hover:bg-[#b8e39a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Please wait…" : "Collect badge"}
          </button>
        ) : null}
      </form>
    </div>
  );
}
