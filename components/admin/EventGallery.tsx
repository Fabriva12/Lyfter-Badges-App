"use client";

import { useActionState } from "react";

import {
  addEventImage,
  removeEventImage,
} from "@/app/admin/events/[id]/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface EventGalleryProps {
  eventId: string;
  images: Array<{ id: string; url: string; alt: string | null }>;
}

export default function EventGallery({ eventId, images }: EventGalleryProps) {
  const [state, formAction, isPending] = useActionState(
    addEventImage,
    initialAdminFormState,
  );

  return (
    <section className={cardClassName}>
      <h2 className="text-lg font-bold text-[#f1f1ed]">Gallery</h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        Photos of the event. Paste a public image URL; the first one is used as
        the cover on the public listing.
      </p>

      <form action={formAction} className="mt-5">
        <input type="hidden" name="eventId" value={eventId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gallery-url" className={labelClassName}>
              Image URL
            </label>
            <input
              id="gallery-url"
              name="url"
              type="url"
              required
              maxLength={500}
              placeholder="https://…"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="gallery-alt" className={labelClassName}>
              Alt text (optional)
            </label>
            <input
              id="gallery-alt"
              name="alt"
              maxLength={160}
              placeholder="Opening keynote on the main stage"
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
          className={`mt-4 ${primaryButtonClassName}`}
        >
          {isPending ? "Adding…" : "Add image"}
        </button>
      </form>

      {images.length === 0 ? (
        <p className="mt-6 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
          No images yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <li
              key={image.id}
              className="overflow-hidden rounded-lg border border-[#39424f] bg-[#1f252d]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt ?? "Event photo"}
                className="h-40 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-3 p-3">
                <p className="min-w-0 truncate text-xs text-[#9ca3af]">
                  {image.alt ?? image.url}
                </p>
                <form action={removeEventImage}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <button
                    type="submit"
                    className="text-xs font-semibold text-[#f47f8a] transition hover:text-[#ffb3ba]"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
