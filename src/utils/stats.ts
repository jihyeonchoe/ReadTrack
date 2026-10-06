import { localDateString } from '@/utils/reading';

export type StatSession = {
  id: string;
  book_id: string;
  session_date: string; // YYYY-MM-DD (local)
  minutes: number | null;
  pages: number | null;
  created_at: string; // ISO timestamp, saved when the session ended
  books: { genre: string | null } | null;
};

export type StatBook = {
  id: string;
  status: string;
  finished_at: string | null;
};

export type Mode = 'month' | 'year';

export const GENRES = [
  'Fiction',
  'Non-fiction',
  'Self-help',
  'Business',
  'Science',
  'History',
  'Essay',
  'Other',
] as const;

// ---------- dates ----------

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Monday of the week containing `d`. */
export function startOfWeek(d: Date) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(c, -((c.getDay() + 6) % 7));
}

export type Period = { start: string; end: string; prevStart: string; prevEnd: string; label: string; prevLabel: string };

/** Current month or year as inclusive YYYY-MM-DD ranges, plus the previous one for comparison. */
export function getPeriod(mode: Mode, now = new Date()): Period {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (mode === 'month') {
    return {
      start: localDateString(new Date(y, m, 1)),
      end: localDateString(new Date(y, m + 1, 0)),
      prevStart: localDateString(new Date(y, m - 1, 1)),
      prevEnd: localDateString(new Date(y, m, 0)),
      label: now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      prevLabel: 'last month',
    };
  }
  return {
    start: `${y}-01-01`,
    end: `${y}-12-31`,
    prevStart: `${y - 1}-01-01`,
    prevEnd: `${y - 1}-12-31`,
    label: String(y),
    prevLabel: 'last year',
  };
}

const within = (date: string, start: string, end: string) => date >= start && date <= end;

// ---------- summary ----------

/** When a book was finished: its finished_at, or (for older books) the date of its last session. */
export function finishedDates(books: StatBook[], sessions: StatSession[]): string[] {
  const lastSession: Record<string, string> = {};
  for (const s of sessions) {
    if (!lastSession[s.book_id] || s.session_date > lastSession[s.book_id]) {
      lastSession[s.book_id] = s.session_date;
    }
  }
  return books
    .filter((b) => b.status === 'finished')
    .map((b) => (b.finished_at ? localDateString(new Date(b.finished_at)) : lastSession[b.id]))
    .filter((d): d is string => Boolean(d));
}

export type Summary = { minutes: number; pages: number; sessions: number; days: number; books: number };

export function summarize(
  sessions: StatSession[],
  finished: string[],
  start: string,
  end: string
): Summary {
  const inRange = sessions.filter((s) => within(s.session_date, start, end));
  return {
    minutes: inRange.reduce((sum, s) => sum + (s.minutes ?? 0), 0),
    pages: inRange.reduce((sum, s) => sum + (s.pages ?? 0), 0),
    sessions: inRange.length,
    days: new Set(inRange.map((s) => s.session_date)).size,
    books: finished.filter((d) => within(d, start, end)).length,
  };
}

// ---------- charts ----------

export type Bar = {
  label: string; // short axis label, e.g. "J"
  fullLabel?: string; // shown when the bar is selected, e.g. "Jan"
  value: number;
  current: boolean;
};

/** Minutes read on each day of the current week, Monday first. */
export function weekBars(sessions: StatSession[], now = new Date()): Bar[] {
  const monday = startOfWeek(now);
  const today = localDateString(now);
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
    const date = localDateString(addDays(monday, i));
    const value = sessions
      .filter((s) => s.session_date === date)
      .reduce((sum, s) => sum + (s.minutes ?? 0), 0);
    return { label, value, current: date === today };
  });
}

/** Minutes read in each month of the given year. */
export function monthBars(sessions: StatSession[], now = new Date()): Bar[] {
  const y = now.getFullYear();
  return 'JFMAMJJASOND'.split('').map((label, i) => {
    const prefix = `${y}-${String(i + 1).padStart(2, '0')}`;
    const value = sessions
      .filter((s) => s.session_date.startsWith(prefix))
      .reduce((sum, s) => sum + (s.minutes ?? 0), 0);
    return { label, fullLabel: monthName(y, i), value, current: i === now.getMonth() };
  });
}

function monthName(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, { month: 'short' });
}

/** Books finished in each month of the current year. */
export function booksByMonth(finished: string[], now = new Date()): Bar[] {
  const y = now.getFullYear();
  return 'JFMAMJJASOND'.split('').map((label, i) => {
    const prefix = `${y}-${String(i + 1).padStart(2, '0')}`;
    return {
      label,
      fullLabel: monthName(y, i),
      value: finished.filter((d) => d.startsWith(prefix)).length,
      current: i === now.getMonth(),
    };
  });
}

/** Books finished per year, from your first finished book's year (max 6 years) to this year. */
export function booksByYear(finished: string[], now = new Date()): Bar[] {
  const thisYear = now.getFullYear();
  const first = finished.length ? Math.min(...finished.map((d) => Number(d.slice(0, 4)))) : thisYear;
  const from = Math.max(first, thisYear - 5);
  const bars: Bar[] = [];
  for (let y = from; y <= thisYear; y++) {
    bars.push({
      label: `'${String(y).slice(2)}`,
      fullLabel: String(y),
      value: finished.filter((d) => d.startsWith(String(y))).length,
      current: y === thisYear,
    });
  }
  return bars;
}

/** Minutes read per date (YYYY-MM-DD → minutes). A date with a session but no minutes counts as 0. */
export function minutesByDate(sessions: StatSession[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sessions) map[s.session_date] = (map[s.session_date] ?? 0) + (s.minutes ?? 0);
  return map;
}

export type Share = { label: string; value: number };

/** Minutes by time of day, using the session's start time (end time minus its minutes). */
export function timeOfDay(sessions: StatSession[], start: string, end: string): Share[] {
  const buckets: Share[] = [
    { label: 'Morning · 5–12', value: 0 },
    { label: 'Afternoon · 12–17', value: 0 },
    { label: 'Evening · 17–21', value: 0 },
    { label: 'Night · 21–5', value: 0 },
  ];
  for (const s of sessions) {
    if (!within(s.session_date, start, end) || !s.minutes) continue;
    const started = new Date(new Date(s.created_at).getTime() - s.minutes * 60_000);
    const h = started.getHours();
    const i = h >= 5 && h < 12 ? 0 : h >= 12 && h < 17 ? 1 : h >= 17 && h < 21 ? 2 : 3;
    buckets[i].value += s.minutes;
  }
  return buckets;
}

/** Minutes by book genre, largest first. Books without a genre are grouped as "No genre". */
export function genreShares(sessions: StatSession[], start: string, end: string): Share[] {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    if (!within(s.session_date, start, end) || !s.minutes) continue;
    const g = s.books?.genre ?? 'No genre';
    map[g] = (map[g] ?? 0) + s.minutes;
  }
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// ---------- streaks & records ----------

/** Current streak (counts if you read today or yesterday) and longest streak ever, in days. */
export function streaks(sessions: StatSession[], now = new Date()) {
  const dates = [...new Set(sessions.map((s) => s.session_date))].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    run = prev && localDateString(addDays(parseLocal(prev), 1)) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  const today = localDateString(now);
  const yesterday = localDateString(addDays(now, -1));
  const last = dates[dates.length - 1];
  const current = last === today || last === yesterday ? run : 0;
  return { current, longest };
}

function parseLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export type Records = {
  longestSession: number | null; // minutes
  mostMinutesInDay: number | null;
  mostPagesInDay: number | null;
};

export function records(sessions: StatSession[]): Records {
  const longestSession = Math.max(0, ...sessions.map((s) => s.minutes ?? 0)) || null;
  const mostMinutesInDay = Math.max(0, ...Object.values(minutesByDate(sessions))) || null;

  const pagesByDay: Record<string, number> = {};
  for (const s of sessions) pagesByDay[s.session_date] = (pagesByDay[s.session_date] ?? 0) + (s.pages ?? 0);
  const mostPagesInDay = Math.max(0, ...Object.values(pagesByDay)) || null;

  return { longestSession, mostMinutesInDay, mostPagesInDay };
}

// ---------- goals ----------

/** How far through the year / week we are (0–1), for the "on track" marker. */
export function yearElapsed(now = new Date()) {
  const y = now.getFullYear();
  const start = new Date(y, 0, 1).getTime();
  const end = new Date(y + 1, 0, 1).getTime();
  return (now.getTime() - start) / (end - start);
}

export function weekElapsed(now = new Date()) {
  return (now.getTime() - startOfWeek(now).getTime()) / (7 * 24 * 60 * 60 * 1000);
}
