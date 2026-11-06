"use client";

import { useActionState } from "react";

import { updateEvent } from "@/app/admin/events/[id]/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";
import {
  EVENT_MODES,
  EVENT_STATUSES,
  toUtcInputValue,
} from "@/lib/admin/validation";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";

interface EventFormProps {
  event: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    location: string | null;
    country: string | null;
    mode: string;
    status: string;
    startsAt: Date;
    endsAt: Date;
  };
}

export default function EventForm({ event }: EventFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateEvent,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className={cardClassName}>
      <h2 className="text-lg font-bold text-[#f1f1ed]">Event details</h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        The public URL is <code>{`/leaderboard?event=${event.slug}`}</code> and
        it does not change with the name.
      </p>

      <input type="hidden" name="eventId" value={event.id} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="event-name" className={labelClassName}>
            Name
          </label>
          <input
            id="event-name"
            name="name"
            required
            maxLength={120}
            defaultValue={event.name}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-location" className={labelClassName}>
            Location
          </label>
          <input
            id="event-location"
            name="location"
            maxLength={120}
            defaultValue={event.location ?? ""}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-country" className={labelClassName}>
            Country
          </label>
          <input
            id="event-country"
            name="country"
            maxLength={80}
            defaultValue={event.country ?? ""}
            placeholder="Argentina"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-mode" className={labelClassName}>
            Mode
          </label>
          <select
            id="event-mode"
            name="mode"
            defaultValue={event.mode}
            className={inputClassName}
          >
            {EVENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {EVENT_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event-status" className={labelClassName}>
            Status
          </label>
          <select
            id="event-status"
            name="status"
            defaultValue={event.status}
            className={inputClassName}
          >
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {EVENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-starts-at" className={labelClassName}>
              Starts (UTC)
            </label>
            <input
              id="event-starts-at"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={toUtcInputValue(event.startsAt)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="event-ends-at" className={labelClassName}>
              Ends (UTC)
            </label>
            <input
              id="event-ends-at"
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={toUtcInputValue(event.endsAt)}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="event-description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="event-description"
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={event.description ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

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
        disabled={isPending}
        className={`mt-5 ${primaryButtonClassName}`}
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
