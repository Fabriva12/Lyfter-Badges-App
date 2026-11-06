// Pure leaderboard ranking logic. No Prisma import: this module must stay
// testable with plain data and survive a Prisma API change.

export interface LeaderboardEntry {
  userId: string;
  name: string;
  image: string | null;
  /** XP the attendee earned inside the event. */
  xp: number;
  /** Badges the attendee collected inside the event. */
  badges: number;
}

export interface RankedAttendee extends LeaderboardEntry {
  /** Competition rank: tied attendees share it and the next one skips. */
  rank: number;
  /** Sequential 1-based index in the sorted list. */
  position: number;
}

export interface LeaderboardRanking {
  /** Every attendee of the event, already ranked. */
  rows: RankedAttendee[];
  /** The first three rows of the ranking. */
  top: RankedAttendee[];
}

/**
 * Clamp a counter to a usable value.
 *
 * Same defensive habit as `collectionProgress` in `collection.ts`: a
 * negative or non-finite counter is truncated to zero instead of leaking
 * into the ranking.
 */
function safeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Sort order for the leaderboard.
 *
 * XP is the primary axis and badge count the secondary one, which mirrors
 * the two cuts of `Scan` the leaderboard reads. The display name is the
 * third axis and the user id the last one, so the order stays
 * deterministic even when two attendees share the same name.
 */
function compareAttendees(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (a.xp !== b.xp) {
    return b.xp - a.xp;
  }

  if (a.badges !== b.badges) {
    return b.badges - a.badges;
  }

  const byName = a.name.localeCompare(b.name);

  if (byName !== 0) {
    return byName;
  }

  // Codepoint order instead of `localeCompare`: user ids are opaque
  // strings and must not depend on the ICU locale of the server.
  if (a.userId === b.userId) {
    return 0;
  }

  return a.userId < b.userId ? -1 : 1;
}

/**
 * Rank the attendees of a single event.
 *
 * `rank` is a standard competition rank: attendees with the same XP and
 * the same badge count share it and the next rank skips (1, 1, 3).
 * `position` is the sequential index inside the sorted list, so it never
 * skips. They are different numbers on purpose: the rank answers "how
 * many attendees are ahead of me", the position answers "where am I in
 * the list".
 *
 * An empty input returns an empty ranking instead of throwing.
 */
export function rankAttendees(
  entries: LeaderboardEntry[],
): LeaderboardRanking {
  if (entries.length === 0) {
    return { rows: [], top: [] };
  }

  const sorted = entries
    .map((entry) => ({
      userId: entry.userId,
      name: entry.name,
      image: entry.image,
      xp: safeCount(entry.xp),
      badges: safeCount(entry.badges),
    }))
    .sort(compareAttendees);

  const rows: RankedAttendee[] = [];
  let rank = 0;
  let previousXp = 0;
  let previousBadges = 0;

  sorted.forEach((entry, index) => {
    const isTied =
      index > 0 && entry.xp === previousXp && entry.badges === previousBadges;

    if (!isTied) {
      rank = index + 1;
      previousXp = entry.xp;
      previousBadges = entry.badges;
    }

    rows.push({ ...entry, rank, position: index + 1 });
  });

  return { rows, top: rows.slice(0, 3) };
}
