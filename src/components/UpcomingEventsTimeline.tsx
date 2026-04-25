import { useMemo } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import {
  resolveSchoolEvents, EVENT_TYPE_THEME, relativeDayLabel,
  type ResolvedSchoolEvent,
} from '../lib/schoolEvents';

/**
 * Compact, auto-updating "Upcoming Events" timeline for the Parents view.
 *
 * Replaces the old month-grid calendar — most users scan lists, not grids,
 * and the grid was mostly decorative. This shows the next N events sorted
 * chronologically with a vertical accent rail, type-tinted markers, and
 * relative-day labels ("Tomorrow", "in 5 days").
 *
 * Data comes from `resolveSchoolEvents()` so dates always reflect today.
 */
export function UpcomingEventsTimeline({
  onSelectEvent, limit = 6,
}: {
  onSelectEvent?: (event: ResolvedSchoolEvent) => void;
  limit?: number;
}) {
  const upcoming = useMemo(
    () => resolveSchoolEvents().filter((e) => !e.isPast).slice(0, limit),
    [limit],
  );
  const next = upcoming[0];

  return (
    <div className="glass-card p-5 flex flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-bold text-s800 tracking-tight border-l-4 border-accent pl-3">
          Upcoming Events
        </h3>
        <span className="text-[10px] font-mono uppercase tracking-widest text-s400">
          {upcoming.length} scheduled
        </span>
      </div>

      {next && (
        <div className="bg-gradient-to-br from-accent/10 via-orange-50 to-white border border-accent/20 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-0.5">
              Next up · {relativeDayLabel(next.date)}
            </div>
            <div className="text-sm font-bold text-s900 truncate">{next.title}</div>
            <div className="text-[11px] text-s500 mt-0.5 truncate">
              {next.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              {' · '}{next.time}
            </div>
          </div>
        </div>
      )}

      <div className="relative flex flex-col">
        {/* vertical timeline rail */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-s200" aria-hidden />

        {upcoming.length === 0 ? (
          <div className="text-xs text-s400 italic py-6 text-center">No upcoming events.</div>
        ) : upcoming.map((e, i) => (
          <TimelineRow
            key={i}
            event={e}
            onClick={() => onSelectEvent?.(e)}
            isFirst={i === 0}
            isLast={i === upcoming.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineRow({
  event, onClick, isFirst, isLast,
}: {
  event: ResolvedSchoolEvent;
  onClick: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = EVENT_TYPE_THEME[event.type];
  const dayNum = event.date.getDate();
  const monthShort = event.date.toLocaleDateString(undefined, { month: 'short' });
  const weekday = event.date.toLocaleDateString(undefined, { weekday: 'short' });

  return (
    <button
      onClick={onClick}
      className={`group relative text-left flex items-stretch gap-4 py-3 pl-0 pr-2 hover:bg-s50/60 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40
        ${isFirst ? '' : 'border-t border-s100'}
        ${isLast ? '' : ''}`}
    >
      {/* date column with marker on the rail */}
      <div className="relative w-10 shrink-0 flex flex-col items-center justify-center">
        <span
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-4 ring-white z-10"
          style={{ background: t.dot }}
          aria-hidden
        />
        <div className="opacity-0 select-none text-xs leading-none">·</div>
      </div>

      {/* date */}
      <div className="text-center min-w-[44px] shrink-0">
        <div className={`text-lg font-bold font-headline leading-none ${t.text}`}>
          {String(dayNum).padStart(2, '0')}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-s400 mt-0.5">{monthShort}</div>
      </div>

      {/* body */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <h5 className="text-xs font-bold text-s900 truncate group-hover:text-accent transition-colors">
            {event.title}
          </h5>
        </div>
        <div className="text-[10px] text-s500 mt-0.5 truncate">
          {weekday} · {event.time} · {event.venue}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${t.dot}1f`, color: t.dot }}
          >
            {t.label}
          </span>
          <span className="text-[9px] font-bold text-s500 px-1.5 py-0.5 rounded-full bg-s100">
            {relativeDayLabel(event.date)}
          </span>
        </div>
      </div>

      <ChevronRight
        size={14}
        className="self-center text-s300 group-hover:text-accent group-hover:translate-x-0.5 transition-all"
      />
    </button>
  );
}
