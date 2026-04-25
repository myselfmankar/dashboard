import { useEffect, useMemo, useState } from 'react';
import {
  Check, AlertTriangle, AlertCircle, Info, Megaphone, Calendar,
  Filter, BellOff, ChevronRight, ExternalLink,
} from 'lucide-react';
import { api } from '../api';
import { KpiDetailModal, KpiPill } from '../components/KpiDetailModal';
import { useAuth } from '../context/AuthContext';
import type { Alert } from '../types';

/**
 * NotificationsView — live pen-session alert center.
 *
 * Driven by `api.getAlerts()` (real evo_insights → at-risk feed). Each alert
 * is clickable: opens the same `StudentDetailModal` used in TeachersView,
 * giving teachers/admins a one-click path from "alert" to "full student
 * deep-dive with AI insights".
 *
 * State kept in component memory:
 *   - readIds: alerts the user has dismissed via "Mark as read" / "Mark all"
 *   - severityFilter: critical / warning / info / all
 *
 * Notice Board + Upcoming Events are sample data (schema gap) and are clearly
 * bracketed so they're trivial to swap when the backend lands.
 */

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';

export function NotificationsView() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);

  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(() => setAlerts([]));
  }, []);

  // Counts for the filter chips.
  const counts = useMemo(() => {
    const list = alerts ?? [];
    return {
      all: list.length,
      critical: list.filter((a) => a.severity === 'critical').length,
      warning:  list.filter((a) => a.severity === 'warning').length,
      info:     list.filter((a) => a.severity === 'info').length,
      unread:   list.filter((a) => !readIds.has(a.id)).length,
    };
  }, [alerts, readIds]);

  const visible = useMemo(() => {
    const list = alerts ?? [];
    if (filter === 'all') return list;
    return list.filter((a) => a.severity === filter);
  }, [alerts, filter]);

  const markAllRead = () => {
    if (!alerts) return;
    setReadIds(new Set(alerts.map((a) => a.id)));
  };

  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Parents only see alerts about their own children — keeps the inbox calm.
  const isParent = user?.role === 'parent';

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Notifications</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">
            {alerts === null
              ? 'Loading alerts…'
              : `${counts.unread} unread • ${counts.all} total`}
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={!alerts || counts.unread === 0}
          className="flex items-center gap-2 bg-s100 text-s700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-s200 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={16} /> Mark All Read
        </button>
      </div>

      {/* Severity filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-s400" />
        <FilterChip label="All"      count={counts.all}      active={filter === 'all'}      onClick={() => setFilter('all')} />
        <FilterChip label="Critical" count={counts.critical} active={filter === 'critical'} onClick={() => setFilter('critical')} tone="red" />
        <FilterChip label="Warning"  count={counts.warning}  active={filter === 'warning'}  onClick={() => setFilter('warning')}  tone="amber" />
        <FilterChip label="Info"     count={counts.info}     active={filter === 'info'}     onClick={() => setFilter('info')}     tone="blue" />
      </div>

      {/* Live Alerts */}
      <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6 border-b border-s100 pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight">
              {isParent ? 'Alerts About Your Child' : 'Recent Alerts'}
            </h3>
            <p className="text-xs text-s500">Live pen-session intelligence • Click an alert to open student details</p>
          </div>
          <span className="animate-pulse bg-accent text-white text-[9px] font-mono tracking-widest font-bold px-2.5 py-1 rounded-full">LIVE</span>
        </div>

        <div className="flex flex-col gap-3">
          {alerts === null ? (
            <SkeletonAlertList />
          ) : visible.length === 0 ? (
            <EmptyState filter={filter} />
          ) : visible.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              read={readIds.has(a.id)}
              onOpen={() => setActiveAlert(a)}
              onToggleRead={(e) => { e.stopPropagation(); toggleRead(a.id); }}
            />
          ))}
        </div>
      </div>

      {/* ── DEMO_FALLBACK_START ──────────────────────────────────────────
          Notice Board + Upcoming Events have no Firestore collections yet.
          Replace with `api.getNotices()` / `api.getEvents()` when schema
          (`notices/*`, `events/*`) lands. Delete this entire grid block to
          remove the placeholder UI.
          ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={<Megaphone size={20} className="text-accent" />} title="Notice Board" subtitle="School-wide announcements" />
          <div className="flex flex-col gap-4">
            {NOTICES.map((n, i) => (
              <div key={i} className="flex flex-col border-b border-s100 border-dashed pb-3 last:border-0 last:pb-0">
                <h4 className="text-xs font-bold text-s800 mb-1">{n.title}</h4>
                <div className="flex justify-between items-center text-[10px] text-s500 uppercase tracking-widest font-mono">
                  <span>{n.date}</span>
                  <span>By {n.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm overflow-x-auto">
          <SectionHeader icon={<Calendar size={20} className="text-accent" />} title="Upcoming Events" subtitle="Next 7 days" />
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-s200">
                <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest pl-2">Event</th>
                <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Date</th>
                <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-s100 text-xs">
              {EVENTS.map((e, i) => (
                <tr key={i} className="hover:bg-s50 transition-colors">
                  <td className="py-2.5 pl-2 font-bold text-s800">{e.event}</td>
                  <td className="py-2.5 text-s600 font-mono text-[10px] uppercase">{e.date}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border
                      ${e.type === 'Academic' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        e.type === 'Admin'    ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                'bg-green-50 text-green-600 border-green-200'}`}>
                      {e.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── DEMO_FALLBACK_END ────────────────────────────────────────── */}

      <AlertDetailModal
        alert={activeAlert}
        onClose={() => setActiveAlert(null)}
        onMarkRead={(id) => {
          setReadIds((prev) => new Set(prev).add(id));
        }}
      />
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function AlertCard({
  alert, read, onOpen, onToggleRead,
}: {
  alert: Alert;
  read: boolean;
  onOpen: () => void;
  onToggleRead: (e: React.MouseEvent) => void;
}) {
  const theme = SEVERITY_THEMES[alert.severity];
  const Icon = theme.Icon;
  const time = alert.timestamp
    ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className={`group flex items-start gap-4 p-4 rounded-xl border-l-4 transition-all cursor-pointer hover:shadow-md ${theme.bg} ${theme.border} ${
        read ? 'opacity-60' : ''
      }`}
    >
      <div className="mt-0.5"><Icon className={theme.iconColor} size={18} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1 gap-2">
          <h4 className="text-xs font-bold text-s900 truncate">
            {alert.studentName}
            {!read && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-accent align-middle" />}
          </h4>
          <span className="text-[10px] font-mono text-s400 uppercase shrink-0">{time}</span>
        </div>
        <p className="text-[11px] text-s700 leading-relaxed line-clamp-2">{alert.issue}</p>
        <p className="text-[10px] font-mono text-s400 mt-1 uppercase tracking-widest truncate">{alert.context}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={onToggleRead}
          className="text-[10px] font-mono text-s400 hover:text-s700 uppercase tracking-widest"
          title={read ? 'Mark as unread' : 'Mark as read'}
        >
          {read ? 'Unread' : 'Read'}
        </button>
        <ChevronRight size={14} className="text-s300 group-hover:text-accent transition-colors" />
      </div>
    </div>
  );
}

function FilterChip({
  label, count, active, onClick, tone = 'gray',
}: {
  label: string; count: number; active: boolean; onClick: () => void;
  tone?: 'gray' | 'red' | 'amber' | 'blue';
}) {
  const activeStyles: Record<string, string> = {
    gray:  'bg-s900 text-white border-s900',
    red:   'bg-red-500 text-white border-red-500',
    amber: 'bg-amber-500 text-white border-amber-500',
    blue:  'bg-blue-500 text-white border-blue-500',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-colors ${
        active ? activeStyles[tone] : 'bg-white text-s600 border-s200 hover:border-s400'
      }`}
    >
      {label} <span className="ml-1 font-mono opacity-70">{count}</span>
    </button>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2 mb-6 border-b border-s100 pb-4">
      {icon}
      <div>
        <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">{title}</h3>
        <p className="text-xs text-s500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: SeverityFilter }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-s400">
      <BellOff size={28} className="mb-2 opacity-50" />
      <p className="text-xs font-mono uppercase tracking-widest">
        {filter === 'all' ? 'No alerts at this time' : `No ${filter} alerts`}
      </p>
    </div>
  );
}

function SkeletonAlertList() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-s50 border border-s100 animate-pulse" />
      ))}
    </div>
  );
}

// ── Theme map ──────────────────────────────────────────────────────────────

const SEVERITY_THEMES: Record<Alert['severity'], {
  bg: string; border: string; iconColor: string; Icon: React.ComponentType<{ className?: string; size?: number }>;
  pillBg: string; pillFg: string; label: string;
}> = {
  critical: { bg: 'bg-red-50',    border: 'border-red-500',    iconColor: 'text-red-500',    Icon: AlertTriangle, pillBg: '#fee2e2', pillFg: '#b91c1c', label: 'Critical' },
  warning:  { bg: 'bg-amber-50',  border: 'border-amber-500',  iconColor: 'text-amber-500',  Icon: AlertCircle,   pillBg: '#fef3c7', pillFg: '#92400e', label: 'Warning' },
  info:     { bg: 'bg-blue-50',   border: 'border-blue-500',   iconColor: 'text-blue-500',   Icon: Info,          pillBg: '#dbeafe', pillFg: '#1e40af', label: 'Info' },
};

// ── Centered alert detail popup ───────────────────────────────────────────
// Same look-and-feel as the KPI drill-downs used elsewhere — keeps the UX
// consistent and avoids opening a heavy slide-over panel just to read one
// alert. "Open Full Profile" still links into the full StudentDetailModal
// path (handled at view-level if/when wired).

function AlertDetailModal({
  alert, onClose, onMarkRead,
}: {
  alert: Alert | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}) {
  if (!alert) return null;
  const theme = SEVERITY_THEMES[alert.severity];
  const Icon = theme.Icon;
  const when = alert.timestamp ? new Date(alert.timestamp).toLocaleString() : '—';

  return (
    <KpiDetailModal
      open={!!alert}
      title={alert.studentName}
      subtitle={`Pen-session alert \u2022 ${when}`}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Severity badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon className={theme.iconColor} size={20} />
          <KpiPill bg={theme.pillBg} fg={theme.pillFg}>{theme.label.toUpperCase()}</KpiPill>
          <span style={{
            fontSize: 11, color: '#94a3b8',
            fontFamily: '"Roboto Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{alert.context}</span>
        </div>

        {/* Issue card */}
        <div style={{
          padding: 16, borderRadius: 12,
          background: '#fffaf5', border: '1px solid #FFD4A8',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#F47B20', fontFamily: '"DM Mono", monospace', marginBottom: 6,
          }}>Notivo AI Detected</div>
          <p style={{
            margin: 0, fontFamily: '"Lora", serif', fontStyle: 'italic',
            fontSize: 14, color: '#7c2d12', lineHeight: 1.55,
          }}>{alert.issue}</p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={() => { onMarkRead(alert.id); onClose(); }}
            style={{
              padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0',
              background: '#fff', color: '#475569', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >Mark as Read</button>
          {alert.studentUid && (
            <a
              href={`#/teachers?uid=${alert.studentUid}`}
              onClick={onClose}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10, border: 'none',
                background: '#F47B20', color: '#fff', fontWeight: 700, fontSize: 12,
                textDecoration: 'none', fontFamily: 'Inter, sans-serif',
              }}
            >
              Open Full Profile <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </KpiDetailModal>
  );
}

// ── Sample notice / event data (schema gap) ────────────────────────────────

const NOTICES = [
  { title: 'New Transport Routes',          date: 'Apr 24, 2026', author: 'Transport Dept' },
  { title: 'Annual Day Practice Schedule',  date: 'Apr 22, 2026', author: 'Cultural Cmte' },
  { title: 'Revised Library Timings',       date: 'Apr 20, 2026', author: 'Librarian' },
];

const EVENTS = [
  { event: 'Inter-school Science Fair', date: 'May 02', type: 'Academic' },
  { event: 'Parent-Teacher Meeting',    date: 'May 05', type: 'Admin' },
  { event: 'Term Break Begins',         date: 'May 18', type: 'Holiday' },
];
