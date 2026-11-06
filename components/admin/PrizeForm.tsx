"use client";

import { useActionState } from "react";

import { savePrize } from "@/app/admin/events/[id]/prize/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface PrizeFormProps {
  eventId: string;
  badgeCount: number;
  prize: {
    name: string;
    description: string | null;
    imageUrl: string | null;
    requiredBadgesCount: number;
    revealedAt: Date | null;
  } | null;
}

export default function PrizeForm({
  eventId,
  badgeCount,
  prize,
}: PrizeFormProps) {
  const [state, formAction, isPending] = useActionState(
    savePrize,
    initialAdminFormState,
  );

  const canSave = badgeCount > 0;

  return (
    <form action={formAction} className={cardClassName}>
      <input type="hidden" name="eventId" value={eventId} />

      <h2 className="text-lg font-bold text-[#f1f1ed]">
        {prize ? "Edit prize" : "Create prize"}
      </h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        The prize stays a secret for attendees until they complete the required
        badge count. Announcing it reveals the details to everyone without
        granting it.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="prize-name" className={labelClassName}>
            Name
          </label>
          <input
            id="prize-name"
            name="name"
            required
            maxLength={120}
            defaultValue={prize?.name ?? ""}
            placeholder="Lyfter Swag Kit"
            className={inputClassName}
            disabled={!canSave}
          />
        </div>

        <div>
          <label htmlFor="prize-required" className={labelClassName}>
            Required badges
          </label>
          <input
            id="prize-required"
            name="requiredBadgesCount"
            type="number"
            min={1}
            max={Math.max(badgeCount, 1)}
            step={1}
            required
            defaultValue={prize?.requiredBadgesCount ?? badgeCount}
            className={inputClassName}
            disabled={!canSave}
          />
          <p className="mt-1 text-xs text-[#9ca3af]">
            This event has {badgeCount} {badgeCount === 1 ? "badge" : "badges"}.
          </p>
        </div>

        <div>
          <label htmlFor="prize-image" className={labelClassName}>
            Image URL (optional)
          </label>
          <input
            id="prize-image"
            name="imageUrl"
            type="url"
            maxLength={500}
            defaultValue={prize?.imageUrl ?? ""}
            placeholder="https://…"
            className={inputClassName}
            disabled={!canSave}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="prize-description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="prize-description"
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={prize?.description ?? ""}
            className={inputClassName}
            disabled={!canSave}
          />
        </div>

        <label className="flex items-center gap-3 text-sm font-semibold text-[#d7dce3] sm:col-span-2">
          <input
            type="checkbox"
            name="announce"
            defaultChecked={Boolean(prize?.revealedAt)}
            disabled={!canSave}
            className="h-4 w-4 rounded border-[#39424f] bg-[#171b21]"
          />
          Announce the prize to every attendee now
        </label>
      </div>

      {!canSave ? (
        <p className="mt-4 rounded-lg border border-[#ffc875]/40 bg-[#ffc875]/10 px-4 py-3 text-sm font-medium text-[#ffe0b2]">
          Add at least one badge to the event before creating a prize.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-[#f47f8a]/40 bg-[#f47f8a]/10 px-4 py-3 text-sm font-medium text-[#ffb3ba]"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !canSave}
        className={`mt-5 ${primaryButtonClassName}`}
      >
        {isPending ? "Saving…" : prize ? "Save prize" : "Create prize"}
      </button>
    </form>
  );
}
