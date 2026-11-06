export const EVENT_MODE_LABELS: Record<string, string> = {
  IN_PERSON: "In person",
  VIRTUAL: "Virtual",
  HYBRID: "Hybrid",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  FINISHED: "Finished",
};

export const BADGE_TYPE_LABELS: Record<string, string> = {
  WELCOME: "Welcome",
  TALK: "Talk",
  STAND: "Stand",
  SPECIAL: "Special",
};

export const BADGE_RARITY_LABELS: Record<string, string> = {
  COMMON: "Common",
  RARE: "Rare",
  LIMITED: "Limited edition",
};

/** Formatters shared by the public pages. Dates render in UTC, like the admin
 * pages, so the attendee sees the same range an organizer configured. */
export function formatEventDate(startsAt: Date, endsAt: Date): string {
  const day = startsAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const start = startsAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  const end = endsAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return `${day} · ${start} – ${end} UTC`;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "event.created": "Event created",
  "event.updated": "Event updated",
  "gallery.image_added": "Gallery image added",
  "gallery.image_removed": "Gallery image removed",
  "badge.added": "Badge added",
  "badge.partner_assigned": "Partner assigned",
  "badge.partner_cleared": "Partner cleared",
  "qr_token.created": "QR token created",
  "qr_token.updated": "QR token updated",
  "prize.saved": "Prize saved",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}
