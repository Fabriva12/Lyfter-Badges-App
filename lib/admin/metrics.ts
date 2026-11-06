// Pure metric helpers. No Prisma import: the data-access layer shapes the rows
// and these functions own the math, so they are testable with plain values.

export interface HourBucket {
  hour: number;
  count: number;
}

/** Counts scans per UTC hour of the day (24 buckets, including empty ones). */
export function bucketScansByHour(dates: Date[]): HourBucket[] {
  const counts = new Array<number>(24).fill(0);

  for (const date of dates) {
    const hour = date.getUTCHours();

    if (hour >= 0 && hour < 24) {
      counts[hour] += 1;
    }
  }

  return counts.map((count, hour) => ({ hour, count }));
}

/** Busiest hour, or null when there are no scans. Ties keep the earliest. */
export function peakHour(buckets: HourBucket[]): HourBucket | null {
  let peak: HourBucket | null = null;

  for (const bucket of buckets) {
    if (bucket.count > 0 && (!peak || bucket.count > peak.count)) {
      peak = bucket;
    }
  }

  return peak;
}

/** `0` → `00:00`, `13` → `13:00`. */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** Percentage of the tallest bar, for CSS progress bars. */
export function barWidth(count: number, max: number): number {
  if (max <= 0) {
    return 0;
  }

  return Math.round((count / max) * 100);
}
