"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/admin/audit";
import type { AdminFormState } from "@/lib/admin/forms";
import { requireEventForAdmin } from "@/lib/admin/guards";
import {
  parseEventInput,
  parseOptionalText,
} from "@/lib/admin/validation";
import { configTag, eventsTag } from "@/lib/gamification/queries";

const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateEvent(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  // The id comes from the form, so it is untrusted: the guard reloads the
  // event and checks that this organizer owns it.
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const parsed = parseEventInput({
    name: formData.get("name"),
    description: formData.get("description"),
    location: formData.get("location"),
    country: formData.get("country"),
    mode: formData.get("mode"),
    status: formData.get("status"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  if (!parsed.ok) {
    return { status: "error", message: parsed.error };
  }

  try {
    await prisma.event.update({
      where: { id: event.id },
      data: parsed.value,
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  await logAudit({
    eventId: event.id,
    eventName: event.name,
    actor: session.user,
    action: "event.updated",
    entityType: "event",
    entityId: event.id,
    summary: `Updated the event details (now “${parsed.value.name}”).`,
    metadata: { mode: parsed.value.mode, status: parsed.value.status },
  });

  updateTag(eventsTag());
  // The event name and dates appear in every attendee's collection payload.
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${event.id}?saved=1`);
}

export async function addEventImage(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const url = parseOptionalText(formData.get("url"), 500, "The image URL");

  if (!url.ok) {
    return { status: "error", message: url.error };
  }

  if (!url.value || !isHttpUrl(url.value)) {
    return {
      status: "error",
      message: "The image URL must start with http:// or https://.",
    };
  }

  const alt = parseOptionalText(formData.get("alt"), 160, "The alt text");

  if (!alt.ok) {
    return { status: "error", message: alt.error };
  }

  try {
    const last = await prisma.eventImage.aggregate({
      where: { eventId: event.id },
      _max: { sortOrder: true },
    });

    const image = await prisma.eventImage.create({
      data: {
        eventId: event.id,
        url: url.value,
        alt: alt.value,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
      select: { id: true },
    });

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      actor: session.user,
      action: "gallery.image_added",
      entityType: "eventImage",
      entityId: image.id,
      summary: "Added an image to the event gallery.",
      metadata: { url: url.value },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  redirect(`/admin/events/${event.id}?saved=image`);
}

export async function removeEventImage(formData: FormData): Promise<void> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const imageId = String(formData.get("imageId") ?? "");

  try {
    const result = await prisma.eventImage.deleteMany({
      where: { id: imageId, eventId: event.id },
    });

    if (result.count > 0) {
      await logAudit({
        eventId: event.id,
        eventName: event.name,
        actor: session.user,
        action: "gallery.image_removed",
        entityType: "eventImage",
        entityId: imageId,
        summary: "Removed an image from the event gallery.",
      });
    }
  } catch (error) {
    console.error(error);
  }

  redirect(`/admin/events/${event.id}?saved=image`);
}
