import { useEffect, useState } from 'react';
import { Calendar, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { StudentInlinePreview } from '../components/StudentInlinePreview';
import { StudentDetailModal } from '../components/StudentDetailModal';
import { ParentKpiModals, type ParentKpi } from '../components/ParentKpiModals';
import { usePrewarmAiCache } from '../lib/usePrewarmAiCache';
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

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">My Children</h1>
        <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">Live learning insights from Notivo Smart Pen</p>
      </div>

      {/* KPI Cards Row (sample) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SampleKpi icon={<Calendar size={24} />}    value="06" label="Upcoming Events"  tone="orange" onClick={() => setOpenKpi('events')} />
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
            <ChildPreviewCard
              key={child.uid}
              child={child}
              onViewMore={() => setActiveUid(child.uid)}
            />
          ))}
        </div>

        {/* School Events (sample) */}
        <div className="glass-card p-5">
          <h3 className="font-serif text-lg font-bold text-s800 tracking-tight mb-4 border-l-4 border-accent pl-3">School Events</h3>
          <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-2">
            <EventItem date="20" month="Mar" title="Parent-Teacher Meeting" time="9:00 AM – 1:00 PM • School Hall" theme="orange" badge="Today+4" />
            <EventItem date="28" month="Mar" title="Annual Sports Day" time="8:00 AM – 5:00 PM • Sports Ground" theme="green" badge="12 days" />
            <EventItem date="05" month="Apr" title="Science Exhibition" time="10:00 AM – 4:00 PM • Lab Block" theme="blue" badge="20 days" />
            <EventItem date="14" month="Apr" title="Cultural Fest" time="All Day • Auditorium" theme="purple" badge="29 days" />
            <EventItem date="22" month="Apr" title="Earth Day Plantation" time="7:00 AM – 9:00 PM • Garden" theme="orange-dark" badge="37 days" />
          </div>
        </div>
      </div>

      <StudentDetailModal uid={activeUid} onClose={() => setActiveUid(null)} />
      <ParentKpiModals active={openKpi} onClose={() => setOpenKpi(null)} />
    </div>
  );
}

// ── Child preview card wrapper: small label + reused StudentInlinePreview ──

function ChildPreviewCard({
  child,
  onViewMore,
}: {
  child: HeatmapStudent;
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
      <StudentInlinePreview uid={child.uid} onViewMore={onViewMore} />
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

// ── School events (sample) ─────────────────────────────────────────────────

function EventItem({
  date, month, title, time, theme, badge,
}: {
  date: string; month: string; title: string; time: string;
  theme: 'orange' | 'green' | 'blue' | 'purple' | 'orange-dark';
  badge: string;
}) {
  const themes = {
    'orange':      { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-500', badgeBg: 'bg-white',         badgeText: 'text-orange-500', badgeBorder: 'border-orange-200' },
    'green':       { bg: 'bg-green-50',  border: 'border-green-500',  text: 'text-green-500',  badgeBg: 'bg-green-100',     badgeText: 'text-green-700',  badgeBorder: 'border-transparent' },
    'blue':        { bg: 'bg-blue-50',   border: 'border-blue-500',   text: 'text-blue-500',   badgeBg: 'bg-blue-100',      badgeText: 'text-blue-700',   badgeBorder: 'border-transparent' },
    'purple':      { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-500', badgeBg: 'bg-purple-100',    badgeText: 'text-purple-700', badgeBorder: 'border-transparent' },
    'orange-dark': { bg: 'bg-orange-50', border: 'border-orange-600', text: 'text-orange-600', badgeBg: 'bg-orange-100',    badgeText: 'text-orange-700', badgeBorder: 'border-transparent' },
  } as const;
  const t = themes[theme];
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border-l-4 ${t.bg} ${t.border}`}>
      <div className="text-center min-w-[40px]">
        <div className={`text-xl font-bold font-headline leading-none ${t.text}`}>{date}</div>
        <div className="text-[9px] uppercase tracking-wider text-s400">{month}</div>
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-s900">{title}</h4>
        <p className="text-[10px] text-s500 mt-0.5">{time}</p>
      </div>
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${t.badgeBg} ${t.badgeText} ${t.badgeBorder}`}>{badge}</span>
    </div>
  );
}
