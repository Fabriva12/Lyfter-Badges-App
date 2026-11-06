/** Formatters shared by the admin pages. Dates render in UTC, like the public
 * pages, so the organizer sees exactly what the attendee sees. */
export function formatUtcDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatUtcRange(startsAt: Date, endsAt: Date): string {
  return `${formatUtcDateTime(startsAt)} – ${formatUtcDateTime(endsAt)} UTC`;
}
