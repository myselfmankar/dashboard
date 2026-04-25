import { useEffect, useState } from 'react';
import type { StudentDetail } from '../types';
import { api } from '../api';

/**
 * Compact inline preview of a student — shown next to the Class Struggle
 * Heatmap when a cell is clicked. Covers the at-a-glance view:
 *   - identity (avatar, name, grade, pen ID, tier badge)
 *   - 4 pen-behaviour KPIs
 *   - session timeline bar
 *   - one-line NOTIVO AI evoSummary
 *   - top 3 live alerts
 *
 * "View more" pops the full StudentDetailModal side panel for the same uid.
 */

interface InlinePreviewProps {
  uid: string;
  onViewMore: () => void;
  onClose: () => void;
}

const TIER_META = {
  best: { label: 'On Track', bg: '#dcfce7', fg: '#166534', dot: '#22c55e', avatar: 'linear-gradient(135deg, #22c55e, #4ade80)' },
  good: { label: 'Watch',    bg: '#fef9c3', fg: '#854d0e', dot: '#eab308', avatar: 'linear-gradient(135deg, #eab308, #facc15)' },
  risk: { label: 'Critical', bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444', avatar: 'linear-gradient(135deg, #ef4444, #f87171)' },
} as const;

const SEVERITY_DOT = {
  HIGH: '#ef4444',
  MEDIUM: '#f97316',
  LOW: '#eab308',
  UNKNOWN: '#94a3b8',
} as const;

export function StudentInlinePreview({ uid, onViewMore, onClose }: InlinePreviewProps) {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getStudentDetail(uid)
      .then((d) => { if (!cancelled) { setData(d as StudentDetail); setLoading(false); } })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [uid]);

  if (loading) {
    return (
      <div className="bg-white border border-s200 rounded-xl p-4 text-xs text-s400 font-mono">
        Loading student…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-700 font-mono">
        Could not load: {error ?? 'unknown'}
      </div>
    );
  }

  const tier = TIER_META[data.tier];
  const initials = data.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const pen = data.penBehaviour;
  const total = pen.writingPct + pen.hesitationPct + pen.redoPct || 1;
  const w = (pen.writingPct / total) * 100;
  const h = (pen.hesitationPct / total) * 100;
  const r = (pen.redoPct / total) * 100;

  return (
    <div className="bg-white border border-s200 rounded-xl p-4 shadow-sm flex flex-col gap-3 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: tier.avatar }}
        >{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-s900 truncate">{data.name}</div>
          <div className="text-[10px] text-s500 font-mono mt-0.5 truncate">
            {data.className || 'Class —'} · Pen ID #{data.penId}
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shrink-0"
          style={{ background: tier.bg, color: tier.fg }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.dot }} />
          {tier.label}
        </div>
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="w-7 h-7 rounded-md bg-s100 hover:bg-s200 text-s500 text-base shrink-0 flex items-center justify-center"
        >×</button>
      </div>

      {/* Section label */}
      <div className="text-[10px] font-mono text-s400 uppercase tracking-widest">
        PEN BEHAVIOUR · TODAY'S SESSION
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-4 gap-1.5">
        <KpiCell value={pen.totalHesitation}    label="Total hesitation" tone="orange" />
        <KpiCell value={`${pen.crossOuts}x`}    label="Cross-outs"       tone="amber" />
        <KpiCell value={`${pen.speedDropPct}%`} label="Speed drop"       tone="red" />
        <KpiCell value={pen.pagesWritten}       label="Pages written"    tone="blue" />
      </div>

      {/* Session timeline */}
      <div>
        <div className="text-[11px] text-s500 mb-1">Session timeline</div>
        <div className="flex h-7 rounded-md overflow-hidden">
          <div style={{ width: `${w}%` }} className="bg-green-200 flex items-center justify-center text-[10px] font-bold text-green-800">
            {w >= 14 && 'Writing'}
          </div>
          <div style={{ width: `${h}%` }} className="bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-800">
            {h >= 14 && 'Hesitation'}
          </div>
          <div style={{ width: `${r}%` }} className="bg-red-200 flex items-center justify-center text-[10px] font-bold text-red-800">
            {r >= 14 && 'Re-do'}
          </div>
        </div>
      </div>

      {/* NOTIVO AI single-line summary */}
      <div className="rounded-lg p-3 border" style={{
        background: 'linear-gradient(135deg, #fff8f3, #fff5ee)', borderColor: '#FFD4A8',
      }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-md bg-accent text-white text-[10px] font-bold flex items-center justify-center">+</div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent">NOTIVO AI</span>
        </div>
        <p className="text-[12px] text-orange-900 leading-snug line-clamp-2 m-0">{data.evoSummary}</p>
      </div>

      {/* Live alert feed (top 3) */}
      {data.alerts.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-s400 uppercase tracking-widest mb-2">Live Alert Feed</div>
          <div className="flex flex-col gap-2">
            {data.alerts.slice(0, 3).map((a, i) => (
              <div key={i} className="flex gap-2 items-start text-[11px]">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: SEVERITY_DOT[a.severity] ?? SEVERITY_DOT.UNKNOWN }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-s700 leading-snug">{a.text}</div>
                  <div className="text-[9px] text-s400 font-mono mt-0.5">{a.ago}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View more */}
      <button
        onClick={onViewMore}
        className="mt-1 w-full py-2 rounded-lg bg-s900 hover:bg-s800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
      >
        View more <span className="text-sm">→</span>
      </button>
    </div>
  );
}

const TONE = {
  orange: { bg: '#fff7ed', fg: '#9a3412', border: '#fed7aa' },
  amber:  { bg: '#fefce8', fg: '#854d0e', border: '#fde68a' },
  red:    { bg: '#fef2f2', fg: '#991b1b', border: '#fecaca' },
  blue:   { bg: '#eff6ff', fg: '#1e40af', border: '#bfdbfe' },
} as const;

function KpiCell({ value, label, tone }: { value: string | number; label: string; tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <div
      className="rounded-md py-2 px-1 flex flex-col items-center justify-center min-w-0"
      style={{ background: t.bg, border: `1px solid ${t.border}` }}
    >
      <div
        className="font-mono font-bold text-base leading-none truncate max-w-full"
        style={{ color: t.fg }}
      >{value}</div>
      <div className="text-[8.5px] text-s500 mt-1 text-center leading-tight">{label}</div>
    </div>
  );
}
