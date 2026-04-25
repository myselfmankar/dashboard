import type { HeatmapStudent } from '../types';

/**
 * Pure presentational class-struggle heatmap. Renders a grid of student
 * cells coloured by risk level. Independent — knows nothing about modals,
 * insight panels, or data fetching. Pair it with `StudentInlinePreview`
 * and/or `StudentDetailModal` via the parent's state.
 *
 * Reuse in: TeachersView (single class), AnalyticsView (school-wide),
 * Pen Analytics view, parent dashboards, etc.
 */

interface ClassStruggleHeatmapProps {
  students: HeatmapStudent[];
  selectedUid?: string | null;
  onSelectStudent?: (uid: string) => void;
  /** Header line. Pass null to hide the entire header. */
  title?: string | null;
  /** Subtitle (uppercase mono caption). Pass null to hide. */
  subtitle?: string | null;
  /** Show LIVE pill in subtitle. */
  showLive?: boolean;
  /** Show the colour-coded legend row. */
  showLegend?: boolean;
  /** Tailwind grid-cols class for the cell grid. */
  gridClassName?: string;
  /** Loading placeholder text when students=[]. */
  emptyLabel?: string;
}

export function ClassStruggleHeatmap({
  students,
  selectedUid = null,
  onSelectStudent,
  title = 'Class Struggle Heatmap',
  subtitle = 'Real-time pen behaviour • Today',
  showLive = true,
  showLegend = true,
  gridClassName = 'grid-cols-5 sm:grid-cols-8',
  emptyLabel = 'Loading student data…',
}: ClassStruggleHeatmapProps) {
  return (
    <div className="flex flex-col gap-3 min-w-0">
      {(title !== null || subtitle !== null) && (
        <div>
          {title !== null && (
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight">{title}</h3>
          )}
          {subtitle !== null && (
            <p className="text-[10px] font-mono text-s400 uppercase mt-1">
              {subtitle}
              {showLive && (
                <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full ml-2">
                  LIVE
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {showLegend && (
        <div className="flex flex-wrap gap-3 text-[10px] font-mono text-s500">
          <LegendDot bg="bg-green-100"  border="border-green-200"  label="On Track" />
          <LegendDot bg="bg-yellow-100" border="border-yellow-200" label="Watch" />
          <LegendDot bg="bg-orange-100" border="border-orange-200" label="Needs Help" />
          <LegendDot bg="bg-red-100"    border="border-red-200"    label="At Risk" />
          <LegendDot bg="bg-red-500"    border="border-red-600"    label="Critical" />
        </div>
      )}

      <div className={`grid ${gridClassName} gap-1`}>
        {students.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-s400 font-mono">
            {emptyLabel}
          </div>
        ) : students.map((s, i) => (
          <HeatmapCell
            key={s.uid ?? i}
            student={s}
            selected={!!selectedUid && s.uid === selectedUid}
            onClick={() => s.uid && onSelectStudent?.(s.uid)}
          />
        ))}
      </div>
    </div>
  );
}

// ── cells ───────────────────────────────────────────────────────────────────

function HeatmapCell({
  student, selected, onClick,
}: { student: HeatmapStudent; selected: boolean; onClick: () => void }) {
  const palette = riskPalette(student.risk);
  const base =
    'w-full aspect-square rounded-md border flex flex-col justify-center items-center ' +
    'hover:brightness-95 transition-all cursor-pointer shadow-sm relative overflow-hidden';
  const ring = selected ? 'ring-2 ring-accent ring-offset-2' : '';

  return (
    <div
      onClick={onClick}
      title={student.uid ? `Click to preview ${student.name}` : 'No detail available'}
      className={`${base} ${palette.bg} ${ring}`}
    >
      <div className={`text-[10px] md:text-[11px] font-bold leading-none mb-1 ${palette.name}`}>
        {student.name.split(' ')[0]}
      </div>
      <div className={`text-[8px] md:text-[9px] font-mono tracking-widest uppercase px-1 rounded-sm ${palette.score}`}>
        {student.score}%
      </div>
    </div>
  );
}

function LegendDot({ bg, border, label }: { bg: string; border: string; label: string }) {
  return (
    <span className="flex items-center">
      <div className={`w-2.5 h-2.5 ${bg} ${border} border rounded-sm mr-1.5`} />
      {label}
    </span>
  );
}

function riskPalette(risk: number): { bg: string; name: string; score: string } {
  switch (risk) {
    case 0: return { bg: 'bg-green-100 border-green-200',                       name: 'text-green-800',  score: 'text-green-700 bg-green-200/50' };
    case 1: return { bg: 'bg-yellow-100 border-yellow-200',                     name: 'text-yellow-800', score: 'text-yellow-700 bg-yellow-200/50' };
    case 2: return { bg: 'bg-orange-100 border-orange-200',                     name: 'text-orange-800', score: 'text-orange-700 bg-orange-200/50' };
    case 3: return { bg: 'bg-red-100 border-red-200 font-bold',                 name: 'text-red-800',    score: 'text-red-700 bg-red-200/50' };
    case 4:
    case 5: return {
      bg:    'bg-red-500 border-red-600 font-bold animate-pulse text-white shadow-md shadow-red-500/20',
      name:  'text-white',
      score: 'text-red-100 bg-red-600/50',
    };
    default: return { bg: 'bg-green-100 border-green-200', name: 'text-green-800', score: 'text-green-700 bg-green-200/50' };
  }
}
