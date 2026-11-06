// Pure input parsing for the admin forms. Every Server Action uses these
// helpers before touching the database, so a malformed form never reaches
// Prisma. No Prisma import: all of this is testable with plain values.

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export const EVENT_MODES = ["IN_PERSON", "VIRTUAL", "HYBRID"] as const;
export type EventModeValue = (typeof EVENT_MODES)[number];

export const EVENT_STATUSES = ["DRAFT", "ACTIVE", "FINISHED"] as const;
export type EventStatusValue = (typeof EVENT_STATUSES)[number];

export const BADGE_TYPES = ["WELCOME", "TALK", "STAND", "SPECIAL"] as const;
export type BadgeTypeValue = (typeof BADGE_TYPES)[number];

export const BADGE_RARITIES = ["COMMON", "RARE", "LIMITED"] as const;
export type BadgeRarityValue = (typeof BADGE_RARITIES)[number];

export interface EventInput {
  name: string;
  description: string | null;
  location: string | null;
  country: string | null;
  mode: EventModeValue;
  status: EventStatusValue;
  startsAt: Date;
  endsAt: Date;
}

const MAX_NAME = 120;
const MAX_DESCRIPTION = 1000;
const MAX_LOCATION = 120;
const MAX_COUNTRY = 80;

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseMode(value: unknown): ParseResult<EventModeValue> {
  const raw = trimmed(value) || "IN_PERSON";

  if (!EVENT_MODES.includes(raw as EventModeValue)) {
    return { ok: false, error: "Choose a valid event mode." };
  }

  return { ok: true, value: raw as EventModeValue };
}

function parseStatus(value: unknown): ParseResult<EventStatusValue> {
  const raw = trimmed(value) || "DRAFT";

  if (!EVENT_STATUSES.includes(raw as EventStatusValue)) {
    return { ok: false, error: "Choose a valid event status." };
  }

  return { ok: true, value: raw as EventStatusValue };
}

export function parseBadgeType(value: unknown): ParseResult<BadgeTypeValue> {
  const raw = trimmed(value) || "TALK";

  if (!BADGE_TYPES.includes(raw as BadgeTypeValue)) {
    return { ok: false, error: "Choose a valid badge type." };
  }

  return { ok: true, value: raw as BadgeTypeValue };
}

export function parseBadgeRarity(
  value: unknown,
): ParseResult<BadgeRarityValue> {
  const raw = trimmed(value) || "COMMON";

  if (!BADGE_RARITIES.includes(raw as BadgeRarityValue)) {
    return { ok: false, error: "Choose a valid badge rarity." };
  }

  return { ok: true, value: raw as BadgeRarityValue };
}

/**
 * Parses the `datetime-local` value the admin form submits.
 *
 * The whole app renders dates in UTC (the public pages format with
 * `timeZone: "UTC"`), so a browser-local value would silently shift the event.
 * A value without a timezone is therefore read as UTC.
 */
export function parseUtcDateTime(value: unknown): Date | null {
  const raw = trimmed(value);

  if (!raw) {
    return null;
  }

  // `datetime-local` submits "YYYY-MM-DDTHH:mm"; tag it as UTC.
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)
    ? `${raw}:00.000Z`
    : raw;

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Value for a `datetime-local` input, rendered in UTC. */
export function toUtcInputValue(date: Date): string {
  return date.toISOString().slice(0, 16);
}

export function parseEventInput(raw: {
  name?: unknown;
  description?: unknown;
  location?: unknown;
  country?: unknown;
  mode?: unknown;
  status?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
}): ParseResult<EventInput> {
  const name = trimmed(raw.name);

  if (name.length < 2) {
    return { ok: false, error: "Enter an event name of at least 2 characters." };
  }

  if (name.length > MAX_NAME) {
    return {
      ok: false,
      error: `The event name must be at most ${MAX_NAME} characters.`,
    };
  }

  const description = trimmed(raw.description);
  const location = trimmed(raw.location);
  const country = trimmed(raw.country);

  if (description.length > MAX_DESCRIPTION) {
    return {
      ok: false,
      error: `The description must be at most ${MAX_DESCRIPTION} characters.`,
    };
  }

  if (location.length > MAX_LOCATION) {
    return {
      ok: false,
      error: `The location must be at most ${MAX_LOCATION} characters.`,
    };
  }

  if (country.length > MAX_COUNTRY) {
    return {
      ok: false,
      error: `The country must be at most ${MAX_COUNTRY} characters.`,
    };
  }

  const mode = parseMode(raw.mode);

  if (!mode.ok) {
    return mode;
  }

  const status = parseStatus(raw.status);

  if (!status.ok) {
    return status;
  }

  const startsAt = parseUtcDateTime(raw.startsAt);
  const endsAt = parseUtcDateTime(raw.endsAt);

  if (!startsAt) {
    return { ok: false, error: "Enter a valid start date and time." };
  }

  if (!endsAt) {
    return { ok: false, error: "Enter a valid end date and time." };
  }

  if (endsAt.getTime() <= startsAt.getTime()) {
    return { ok: false, error: "The event must end after it starts." };
  }

  return {
    ok: true,
    value: {
      name,
      description: description || null,
      location: location || null,
      country: country || null,
      mode: mode.value,
      status: status.value,
      startsAt,
      endsAt,
    },
  };
}

export function parseXpValue(value: unknown): ParseResult<number> {
  const raw = trimmed(value);
  const xp = Number(raw);

  if (!raw || !Number.isInteger(xp) || xp < 1 || xp > 10000) {
    return {
      ok: false,
      error: "XP must be a whole number between 1 and 10000.",
    };
  }

  return { ok: true, value: xp };
}

/** Empty means unlimited scans, which is stored as `null`. */
export function parseMaxScans(value: unknown): ParseResult<number | null> {
  const raw = trimmed(value);

  if (!raw) {
    return { ok: true, value: null };
  }

  const max = Number(raw);

  if (!Number.isInteger(max) || max < 1 || max > 100000) {
    return {
      ok: false,
      error: "The scan limit must be a whole number between 1 and 100000.",
    };
  }

  return { ok: true, value: max };
}

/**
 * The prize requirement must fit the event: requiring more badges than the
 * event offers makes the prize impossible to earn.
 */
export function parseRequiredBadges(
  value: unknown,
  eventBadgeCount: number,
): ParseResult<number> {
  if (eventBadgeCount < 1) {
    return {
      ok: false,
      error: "Add at least one badge to the event before creating a prize.",
    };
  }

  const raw = trimmed(value);
  const required = Number(raw);

  if (!Number.isInteger(required) || required < 1) {
    return { ok: false, error: "The prize must require at least one badge." };
  }

  if (required > eventBadgeCount) {
    return {
      ok: false,
      error: `This event only has ${eventBadgeCount} badge(s).`,
    };
  }

  return { ok: true, value: required };
}

/** Generic optional text field with a length cap. */
export function parseOptionalText(
  value: unknown,
  max: number,
  label: string,
): ParseResult<string | null> {
  const raw = trimmed(value);

  if (raw.length > max) {
    return {
      ok: false,
      error: `${label} must be at most ${max} characters.`,
    };
  }

  return { ok: true, value: raw || null };
}

/** Normalizes an email typed by the organizer when assigning a partner. */
export function parseEmail(value: unknown): ParseResult<string> {
  const email = trimmed(value).toLowerCase();

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, error: "Enter a valid email address." };
  }

  return { ok: true, value: email };
}
