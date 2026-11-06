"use server";

import { randomUUID } from "node:crypto";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/admin/audit";
import type { AdminFormState } from "@/lib/admin/forms";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { reconcileAdminRole } from "@/lib/admin/roles";
import {
  parseBadgeRarity,
  parseBadgeType,
  parseMaxScans,
  parseOptionalText,
  parseUtcDateTime,
  parseXpValue,
} from "@/lib/admin/validation";
import { isBadgeIconKey } from "@/lib/badges/icons";
import { configTag } from "@/lib/gamification/queries";

const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function addEventBadge(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const name = trimmed(formData.get("name"));

  if (name.length < 2 || name.length > 120) {
    return {
      status: "error",
      message: "The badge name must be between 2 and 120 characters.",
    };
  }

  const xp = parseXpValue(formData.get("xpValue"));

  if (!xp.ok) {
    return { status: "error", message: xp.error };
  }

  const description = parseOptionalText(
    formData.get("description"),
    1000,
    "The description",
  );

  if (!description.ok) {
    return { status: "error", message: description.error };
  }

  const type = parseBadgeType(formData.get("type"));

  if (!type.ok) {
    return { status: "error", message: type.error };
  }

  const rarity = parseBadgeRarity(formData.get("rarity"));

  if (!rarity.ok) {
    return { status: "error", message: rarity.error };
  }

  const rawIconKey = trimmed(formData.get("iconKey"));
  const iconKey = rawIconKey || null;

  if (iconKey && !isBadgeIconKey(iconKey)) {
    return { status: "error", message: "Choose an icon from the library." };
  }

  const room = parseOptionalText(formData.get("room"), 120, "The room");

  if (!room.ok) {
    return { status: "error", message: room.error };
  }

  const rawStartsAt = trimmed(formData.get("startsAt"));
  const startsAt = rawStartsAt ? parseUtcDateTime(rawStartsAt) : null;

  if (rawStartsAt && !startsAt) {
    return { status: "error", message: "Enter a valid badge start time." };
  }

  try {
    // The catalog is global: an existing name is reused as-is, so editing one
    // event can never rewrite the XP value of another event's badge.
    const badge = await prisma.badge.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: description.value,
        xpValue: xp.value,
        type: type.value,
        rarity: rarity.value,
        iconKey,
      },
      select: { id: true },
    });

    const eventBadge = await prisma.eventBadge.create({
      data: {
        eventId: event.id,
        badgeId: badge.id,
        room: room.value,
        startsAt,
      },
      select: { id: true },
    });

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      actor: session.user,
      action: "badge.added",
      entityType: "eventBadge",
      entityId: eventBadge.id,
      summary: `Added the badge “${name}” to the event.`,
      metadata: {
        type: type.value,
        rarity: rarity.value,
        xpValue: xp.value,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: "That badge is already part of this event.",
      };
    }

    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  // The badge count changes every attendee's collection total.
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${event.id}/badges?saved=badge`);
}

export async function assignStandPartner(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const eventBadgeId = String(formData.get("eventBadgeId") ?? "");
  const partnerId = trimmed(formData.get("partnerId"));

  const eventBadge = await prisma.eventBadge.findFirst({
    where: { id: eventBadgeId, eventId: event.id },
    select: { id: true, partnerId: true },
  });

  if (!eventBadge) {
    return { status: "error", message: "That badge does not belong to this event." };
  }

  const previousPartnerId = eventBadge.partnerId;

  let partnerName: string | null = null;

  if (partnerId) {
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, role: true },
    });

    if (!partner) {
      return { status: "error", message: "That account does not exist." };
    }

    // A stand can be linked to any existing account. The access is scoped by
    // EventBadge.partnerId, but the account still needs the ADMIN role to open
    // the admin area, so an attendee is promoted when assigned.
    if (partner.role === "ATTENDEE") {
      await prisma.user.update({
        where: { id: partner.id },
        data: { role: "ADMIN" },
      });
    }

    partnerName = partner.name;
  }

  try {
    await prisma.eventBadge.update({
      where: { id: eventBadge.id },
      data: { partnerId: partnerId || null },
    });

    if (previousPartnerId && previousPartnerId !== (partnerId || null)) {
      await reconcileAdminRole(previousPartnerId);
    }

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      actor: session.user,
      action: partnerId ? "badge.partner_assigned" : "badge.partner_cleared",
      entityType: "eventBadge",
      entityId: eventBadge.id,
      summary: partnerId
        ? `Assigned ${partnerName ?? "a partner"} to a stand badge.`
        : "Cleared the partner assignment of a stand badge.",
      metadata: { partnerId: partnerId || null },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  redirect(`/admin/events/${event.id}/badges?saved=partner`);
}

export async function createQrToken(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const kind = trimmed(formData.get("kind")) === "WELCOME" ? "WELCOME" : "BADGE";
  const maxScans = parseMaxScans(formData.get("maxScans"));

  if (!maxScans.ok) {
    return { status: "error", message: maxScans.error };
  }

  let eventBadgeId: string | null = null;

  if (kind === "BADGE") {
    const requestedId = String(formData.get("eventBadgeId") ?? "");
    const eventBadge = await prisma.eventBadge.findFirst({
      where: { id: requestedId, eventId: event.id },
      select: { id: true },
    });

    if (!eventBadge) {
      return {
        status: "error",
        message: "Choose a badge that belongs to this event.",
      };
    }

    eventBadgeId = eventBadge.id;
  }

  try {
    // UUIDv4: 122 random bits. The token is the secret printed on the wall, so
    // it must not be guessable or sequential.
    const qrToken = await prisma.qrToken.create({
      data: {
        token: randomUUID(),
        kind,
        eventId: event.id,
        eventBadgeId,
        maxScans: maxScans.value,
      },
      select: { id: true },
    });

    // The token secret is never logged.
    await logAudit({
      eventId: event.id,
      eventName: event.name,
      actor: session.user,
      action: "qr_token.created",
      entityType: "qrToken",
      entityId: qrToken.id,
      summary: `Created a ${kind === "WELCOME" ? "welcome" : "badge"} QR token.`,
      metadata: { kind, maxScans: maxScans.value },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  redirect(`/admin/events/${event.id}/badges?saved=token`);
}

export async function setQrTokenActive(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const tokenId = String(formData.get("tokenId") ?? "");
  const active = trimmed(formData.get("active")) === "true";

  const token = await prisma.qrToken.findFirst({
    where: { id: tokenId, eventId: event.id },
    select: { id: true },
  });

  if (!token) {
    return { status: "error", message: "That QR token does not belong to this event." };
  }

  try {
    await prisma.qrToken.update({
      where: { id: token.id },
      data: { active },
    });

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      actor: session.user,
      action: "qr_token.updated",
      entityType: "qrToken",
      entityId: token.id,
      summary: active ? "Activated a QR token." : "Paused a QR token.",
      metadata: { active },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  redirect(`/admin/events/${event.id}/badges?saved=token`);
}
