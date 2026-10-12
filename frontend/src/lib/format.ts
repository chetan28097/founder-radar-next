const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2019-03-01T00:00:00" -> "Mar 2019". Returns null when the date is missing or unparseable. */
export function monthYear(value?: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})/.exec(value);
  if (!m) return null;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${m[1]}` : m[1];
}

/** Whole months between two ISO dates (end defaults to now). Null if start is missing. */
export function monthsBetween(start?: string | null, end?: string | null): number | null {
  if (!start) return null;
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
}

export function durationLabel(months: number | null): string | null {
  if (months === null) return null;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y && m) return `${y} yr ${m} mo`;
  if (y) return `${y} yr`;
  return `${m} mo`;
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.round((Date.now() - then) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff} min ago`;
  const h = Math.round(diff / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return monthYear(iso) || '';
}

export function hostname(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function isKnownLocation(location?: string | null): location is string {
  return Boolean(location && location !== 'Location Unknown');
}

/** Turn fetch/API failures into a sentence a person can act on. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof TypeError) {
    return 'Could not reach the Founder Radar backend. Check that it is running on port 8000.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
