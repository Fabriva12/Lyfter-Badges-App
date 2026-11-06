"use client";

import { useActionState } from "react";

import { createEvent } from "@/app/admin/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";
import type { AdminCompany } from "@/lib/admin/queries";
import { EVENT_MODES, EVENT_STATUSES } from "@/lib/admin/validation";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";

interface CreateEventFormProps {
  companies: AdminCompany[];
}

export default function CreateEventForm({ companies }: CreateEventFormProps) {
  const [state, formAction, isPending] = useActionState(
    createEvent,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className={cardClassName}>
      <h2 className="text-lg font-bold text-[#f1f1ed]">Create an event</h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        The event URL is generated from the name and cannot be changed later.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="new-company" className={labelClassName}>
            Company
          </label>
          <select
            id="new-company"
            name="companyId"
            required
            defaultValue={companies[0]?.id ?? ""}
            className={inputClassName}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="new-name" className={labelClassName}>
            Name
          </label>
          <input
            id="new-name"
            name="name"
            required
            maxLength={120}
            placeholder="Lyfter Meetup 2027"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="new-location" className={labelClassName}>
            Location
          </label>
          <input
            id="new-location"
            name="location"
            maxLength={120}
            placeholder="Buenos Aires"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="new-country" className={labelClassName}>
            Country
          </label>
          <input
            id="new-country"
            name="country"
            maxLength={80}
            placeholder="Argentina"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="new-mode" className={labelClassName}>
            Mode
          </label>
          <select
            id="new-mode"
            name="mode"
            defaultValue="IN_PERSON"
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
          <label htmlFor="new-status" className={labelClassName}>
            Status
          </label>
          <select
            id="new-status"
            name="status"
            defaultValue="DRAFT"
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
            <label htmlFor="new-starts-at" className={labelClassName}>
              Starts (UTC)
            </label>
            <input
              id="new-starts-at"
              name="startsAt"
              type="datetime-local"
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="new-ends-at" className={labelClassName}>
              Ends (UTC)
            </label>
            <input
              id="new-ends-at"
              name="endsAt"
              type="datetime-local"
              required
              className={inputClassName}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="new-description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="new-description"
            name="description"
            rows={3}
            maxLength={1000}
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
        {isPending ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
