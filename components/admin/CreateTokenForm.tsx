"use client";

import { useActionState } from "react";

import { createQrToken } from "@/app/admin/events/[id]/badges/actions";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface CreateTokenFormProps {
  eventId: string;
  kind: "BADGE" | "WELCOME";
  eventBadgeId?: string;
}

export default function CreateTokenForm({
  eventId,
  kind,
  eventBadgeId,
}: CreateTokenFormProps) {
  const [state, formAction, isPending] = useActionState(
    createQrToken,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="kind" value={kind} />
      {eventBadgeId ? (
        <input type="hidden" name="eventBadgeId" value={eventBadgeId} />
      ) : null}

      <div>
        <label htmlFor={`max-scans-${eventBadgeId ?? kind}`} className={labelClassName}>
          Scan limit
        </label>
        <input
          id={`max-scans-${eventBadgeId ?? kind}`}
          name="maxScans"
          type="number"
          min={1}
          step={1}
          placeholder="Unlimited"
          className={`${inputClassName} w-40`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`${primaryButtonClassName} px-4 py-3 text-xs`}
      >
        {isPending ? "Creating…" : "Create QR token"}
      </button>

      {state.status === "error" ? (
        <p role="alert" className="w-full text-xs text-[#ffb3ba]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
