import { useEffect, useMemo, useState } from 'react';
import { Calendar, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { StudentInlinePreview } from '../components/StudentInlinePreview';
import { StudentDetailModal } from '../components/StudentDetailModal';
import { ParentKpiModals, type ParentKpi } from '../components/ParentKpiModals';
import { UpcomingEventsTimeline } from '../components/UpcomingEventsTimeline';
import { usePrewarmAiCache } from '../lib/usePrewarmAiCache';
import { resolveSchoolEvents } from '../lib/schoolEvents';
import type { HeatmapStudent } from '../types';

/**
 * ParentsView — "My Children" portal.
 *
 * For each child of the signed-in parent (resolved via `users/{uid}.childUids`
 * or legacy `childUid`), we render the same `StudentInlinePreview` card used
 * elsewhere in the app — pen-behaviour KPIs, AI summary, top alerts. Clicking
 * "View more" opens the full `StudentDetailModal` slide-in.
 *
 * Top KPI strip + School Events list are sample data (no schema yet).
 */
export function ParentsView() {
  const { user } = useAuth();
  const [children, setChildren] = useState<HeatmapStudent[] | null>(null);
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [openKpi, setOpenKpi] = useState<ParentKpi | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    api.getChildrenForParent(user.uid)
      .then(setChildren)
      .catch((err) => { console.error(err); setChildren([]); });
  }, [user?.uid]);

  // Pre-warm AI for the children so "View more" opens instantly.
  usePrewarmAiCache(children ?? []);

  // Live event count for the KPI strip — auto-updates as days pass.
  const upcomingCount = useMemo(
    () => resolveSchoolEvents().filter((e) => !e.isPast).length,
    [],
  );

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">My Children</h1>
        <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">Live learning insights from Notivo Smart Pen</p>
      </div>

      {/* KPI Cards Row (sample) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SampleKpi icon={<Calendar size={24} />}    value={String(upcomingCount).padStart(2, '0')} label="Upcoming Events"  tone="orange" onClick={() => setOpenKpi('events')} />
        <SampleKpi icon={<FileText size={24} />}    value="15" label="Upcoming Exams"   tone="green"  onClick={() => setOpenKpi('exams')} />
        <SampleKpi icon={<CheckCircle size={24} />} value="08" label="Result Published" tone="teal"   onClick={() => setOpenKpi('results')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Children inline previews */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {children === null ? (
            <div className="glass-card p-6 text-xs text-s400 font-mono">Loading children…</div>
          ) : children.length === 0 ? (
            <div className="glass-card p-6 text-xs text-s500 font-mono flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              No children linked to this parent account yet.
            </div>
          ) : children.map((child) => (
            child.uid ? (
              <ChildPreviewCard
                key={child.uid}
                child={child}
                uid={child.uid}
                onViewMore={() => setActiveUid(child.uid!)}
              />
            ) : null
          ))}
        </div>

        {/* Auto-updating Upcoming Events timeline */}
        <UpcomingEventsTimeline onSelectEvent={() => setOpenKpi('events')} />
      </div>

      <StudentDetailModal uid={activeUid} onClose={() => setActiveUid(null)} />
      <ParentKpiModals active={openKpi} onClose={() => setOpenKpi(null)} />
    </div>
  );
}

// ── Child preview card wrapper: small label + reused StudentInlinePreview ──

function ChildPreviewCard({
  child,
  uid,
  onViewMore,
}: {
  child: HeatmapStudent;
  uid: string;
  onViewMore: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-s400 uppercase tracking-widest">My Child</span>
        <span className="text-[10px] font-mono text-s400 uppercase tracking-widest">
          Risk Tier: <span className="text-s700 font-bold">{child.risk}</span>
        </span>
      </div>
      <StudentInlinePreview uid={uid} onViewMore={onViewMore} />
    </div>
  );
}

// ── Sample KPI tile (events / exams / results) ─────────────────────────────

function SampleKpi({
  icon, value, label, tone, onClick,
}: {
  icon: React.ReactNode; value: string; label: string;
  tone: 'orange' | 'green' | 'teal';
  onClick?: () => void;
}) {
  const themes = {
    orange: 'bg-orange-50 border-orange-200 text-accent',
    green:  'bg-green-50 border-green-200 text-green-600',
    teal:   'bg-teal-50 border-teal-200 text-teal-600',
  } as const;
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`border rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${themes[tone]}`}
    >
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-2xl font-headline">{value}</div>
        <div className="text-xs font-bold text-s700 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
