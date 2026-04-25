/**
 * Shared school-events data. Each entry stores a `daysFromToday` offset
 * (not a fixed date) so the parent calendar and KPI drill-downs always
 * stay current — regardless of when the demo is opened.
 *
 * Replace with a Firestore `events` collection when the schema lands; the
 * offset trick is just to avoid the demo going stale.
 *
 * NOTE: this file is the single source of truth used by both
 *   - `ParentsView.tsx` (calendar widget + KPI strip)
 *   - `ParentKpiModals.tsx` (Upcoming Events drill-down)
 */

export type SchoolEventType = 'academic' | 'sports' | 'cultural' | 'admin' | 'service';

export interface SchoolEventDef {
  daysFromToday: number;          // offset from "today" so dates stay current
  title: string;
  venue: string;
  time: string;
  audience: string;
  type: SchoolEventType;
}

export interface ResolvedSchoolEvent extends SchoolEventDef {
  date: Date;
  isPast: boolean;
}

const RAW: SchoolEventDef[] = [
  { daysFromToday: 1,  title: 'Parent-Teacher Meeting',   venue: 'School Hall',     time: '9:00 AM – 1:00 PM',  audience: 'All Parents',     type: 'admin' },
  { daysFromToday: 5,  title: 'Mid-term Result Briefing', venue: 'Auditorium',      time: '5:00 PM – 6:30 PM',  audience: 'Grade 10–12',     type: 'academic' },
  { daysFromToday: 9,  title: 'Annual Sports Day',        venue: 'Sports Ground',   time: '8:00 AM – 5:00 PM',  audience: 'School-wide',     type: 'sports' },
  { daysFromToday: 16, title: 'Science Exhibition',       venue: 'Lab Block',       time: '10:00 AM – 4:00 PM', audience: 'Grade 8–12',      type: 'academic' },
  { daysFromToday: 22, title: 'Cultural Fest',            venue: 'Auditorium',      time: 'All Day',            audience: 'School-wide',     type: 'cultural' },
  { daysFromToday: 28, title: 'Earth Day Plantation',     venue: 'School Garden',   time: '7:00 AM – 9:00 AM',  audience: 'Volunteers',      type: 'service' },
  { daysFromToday: 35, title: 'Inter-School Debate',      venue: 'Auditorium',      time: '11:00 AM – 3:00 PM', audience: 'Grade 11–12',     type: 'academic' },
];

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function resolveSchoolEvents(now: Date = new Date()): ResolvedSchoolEvent[] {
  const today = startOfDay(now);
  return RAW.map((e) => {
    const date = new Date(today);
    date.setDate(today.getDate() + e.daysFromToday);
    return { ...e, date, isPast: date < today };
  });
}

/** "20 Mar" style short label (used by the KPI drill-down table). */
export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

/** "Apr 24, 2026" long label (used for notice timestamps). */
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Format a date offset from today as "DD Mon" so demo data never goes stale. */
export function relDateShort(daysFromNow: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return formatShortDate(d);
}

/** Format a date offset from today as "Apr 24, 2026". */
export function relDateLong(daysFromNow: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return formatLongDate(d);
}

/** "in 3 days" / "today" / "tomorrow" / "5 days ago". */
export function relativeDayLabel(d: Date, now: Date = new Date()): string {
  const today = startOfDay(now);
  const target = startOfDay(d);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export const EVENT_TYPE_THEME: Record<SchoolEventType, { dot: string; bg: string; border: string; text: string; label: string }> = {
  academic: { dot: '#3b82f6', bg: 'bg-blue-50',   border: 'border-blue-500',   text: 'text-blue-600',   label: 'Academic' },
  sports:   { dot: '#10b981', bg: 'bg-green-50',  border: 'border-green-500',  text: 'text-green-600',  label: 'Sports'   },
  cultural: { dot: '#a855f7', bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', label: 'Cultural' },
  admin:    { dot: '#F47B20', bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600', label: 'Admin'    },
  service:  { dot: '#14b8a6', bg: 'bg-teal-50',   border: 'border-teal-500',   text: 'text-teal-600',   label: 'Service'  },
};
