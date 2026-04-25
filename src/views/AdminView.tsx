import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import {
  Sparkles, AlertTriangle, AlertCircle, BarChart as BarChartIcon, MonitorPlay,
  ChevronRight, ExternalLink, Info,
} from 'lucide-react';
import { KpiItem } from '../components/KpiItem';
import { HeatmapWithInsights } from '../components/HeatmapWithInsights';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { usePrewarmAiCache } from '../lib/usePrewarmAiCache';
import { AdminKpiModals, type AdminKpi } from '../components/AdminKpiModals';
import {
  KpiDetailModal, KpiTable, KpiRow, KpiCell, KpiPill, KpiBar,
} from '../components/KpiDetailModal';
import type { WeakConcept, HeatmapStudent, Demographics, Alert as AlertItem } from '../types';

type TeacherPerf = { name: string; issues: number; total: number; avgScore: number };

/**
 * AdminView — school-wide overview for principals / heads of school.
 *
 * Mirrors `view-pen-analytics` from the HTML MVP, plus the salvageable
 * Demographics donut and Live Alerts feed from the now-retired DashboardView.
 *
 * Sections:
 *   1. Top KPI strip: At-Risk / Needing Attention / Avg Score / Active Sessions
 *   2. Two-column row: Teacher Class Performance | Weak Topics + AI insight
 *   3. School-wide Student Heatmap (reusable composite)
 *   4. Two-column row: Engagement Donut | Live Alerts
 */
export function AdminView() {
  const [concepts, setConcepts] = useState<WeakConcept[]>([]);
  const [students, setStudents] = useState<HeatmapStudent[]>([]);
  const [teachersPerf, setTeachersPerf] = useState<{ name: string; issues: number; total: number; avgScore: number }[]>([]);
  const [kpis, setKpis] = useState({ atRisk: 0, needingAttention: 0, avgClassScore: 0, activeSessions: 0 });
  const [demographics, setDemographics] = useState<Demographics[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [openKpi, setOpenKpi] = useState<AdminKpi | null>(null);
  const [activeTeacher, setActiveTeacher] = useState<TeacherPerf | null>(null);
  const [engagementOpen, setEngagementOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlertItem | null>(null);

  useEffect(() => {
    Promise.all([
      api.getWeakConcepts(),
      api.getStudentsWithRisk(),
      api.getTeachers(),
      api.getAnalyticsKpis(),
      api.getDemographics(),
      api.getAlerts(),
      api.getKpis(),
    ]).then(([c, studs, tList, k, demo, al, kpi]) => {
      setConcepts(c);
      setStudents(studs);
      setKpis(k);
      setDemographics(demo);
      setAlerts(al);
      setTotalStudents(kpi.totalStudents ?? studs.length);

      const avgScore = studs.length > 0 ? Math.round(studs.reduce((a, s) => a + s.score, 0) / studs.length) : 0;
      setTeachersPerf(tList.map((t) => ({
        name: t.name,
        issues: studs.filter((s) => s.risk >= 3).length,
        total: studs.length,
        avgScore,
      })));
    }).catch(console.error);
  }, []);

  // Pre-warm AI for the top-risk students so admin clicks open instantly.
  usePrewarmAiCache(students.slice(0, 10));

  const engagementBreakdown = useMemo(() => {
    const attending = demographics.find((d) => d.label === 'Attending')?.value ?? 0;
    const absent = demographics.find((d) => d.label === 'Absent')?.value ?? 0;
    const total = attending + absent;
    return {
      attending, absent, total,
      attendingPct: total > 0 ? Math.round((attending / total) * 100) : 0,
      absentPct:    total > 0 ? Math.round((absent / total) * 100) : 0,
    };
  }, [demographics]);

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Admin Overview</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">School-wide intelligence • Real-time</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 bg-s50 border border-s200 rounded-lg text-xs font-semibold text-s800 outline-none focus:border-accent">
            <option>All Grades</option>
            <option>Grade 10</option>
            <option>Grade 9</option>
          </select>
          <select className="px-3 py-1.5 bg-s50 border border-s200 rounded-lg text-xs font-semibold text-s800 outline-none focus:border-accent">
            <option>All Subjects</option>
            <option>Mathematics</option>
            <option>Science</option>
          </select>
        </div>
      </div>

      {/* Admin KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiItem title="AT-RISK STUDENTS"   mtc="red"    value={kpis.atRisk}              trend="Need immediate attention"      icon={<AlertTriangle/>} isDown onClick={() => setOpenKpi('atrisk')} />
        <KpiItem title="NEEDING ATTENTION"  mtc="amber"  value={kpis.needingAttention}    trend="Hesitation above baseline"     icon={<AlertCircle/>} isDown onClick={() => setOpenKpi('attention')} />
        <KpiItem title="AVG CLASS SCORE"    mtc="blue"   value={`${kpis.avgClassScore}%`} trend="Across all tracked classes"    icon={<BarChartIcon/>} onClick={() => setOpenKpi('avgscore')} />
        <KpiItem title="ACTIVE SESSIONS"    mtc="green"  value={kpis.activeSessions}      trend="Classes using smart pens today" icon={<MonitorPlay/>} onClick={() => setOpenKpi('sessions')} />
      </div>

      <AdminKpiModals active={openKpi} students={students} onClose={() => setOpenKpi(null)} />

      {/* Middle Grid: Teacher Performance | Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Teacher Class Performance */}
        <div className="lg:col-span-3 bg-white border border-s200 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Teacher Class Performance</h3>
            <p className="text-xs text-s500 mt-1">Ranked by at-risk student count • Today</p>
          </div>

          <div className="flex flex-col gap-4">
            {teachersPerf.length === 0 ? (
              <div className="text-xs text-s400 font-mono text-center py-4">Loading faculty…</div>
            ) : teachersPerf.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTeacher(t)}
                className="group text-left flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-s100 bg-s50 gap-4 hover:bg-white hover:border-accent/40 hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
                    {t.name.split(' ').map((n) => n[0]).join('').replace('.', '')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-s900 leading-none group-hover:text-accent transition-colors">{t.name}</h4>
                    <p className="text-[10px] text-s500 mt-1 font-mono uppercase">Avg Score: {t.avgScore}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex flex-col items-center">
                    <span className="text-red-500 font-bold">{t.issues}</span>
                    <span className="text-[9px] text-s400 uppercase tracking-widest mt-0.5">At Risk</span>
                  </div>
                  <div className="h-6 w-px bg-s200" />
                  <div className="flex flex-col items-center">
                    <span className="text-s800 font-bold">{t.total}</span>
                    <span className="text-[9px] text-s400 uppercase tracking-widest mt-0.5">Students</span>
                  </div>
                  <ChevronRight size={14} className="text-s400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* School-wide Weak Topics & AI */}
        <div className="lg:col-span-2 bg-white border border-s200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">School-wide Weak Topics</h3>
            <p className="text-xs text-s500 mt-1">Mathematics • Grade 10 • Today</p>
          </div>

          <div className="flex flex-col flex-1">
            {concepts.length > 0 ? (
              <ResponsiveContainer width="100%" height={concepts.slice(0, 4).length * 44 + 20}>
                <BarChart
                  data={concepts.slice(0, 4)}
                  layout="vertical"
                  barSize={10}
                  margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'DM Mono, monospace' }} tickLine={false} axisLine={false} unit="%" />
                  <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      fontSize: 11, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value) => [`${value}%`, 'Error Rate']}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {concepts.slice(0, 4).map((_: WeakConcept, i: number) => (
                      <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-s400 font-mono">Loading concepts...</div>
            )}
          </div>

          {/* AI Box */}
          <div className="mt-6 bg-[#fffaf5] border border-orange-200 rounded-xl p-4 shadow-inner">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="text-accent" size={14} />
              <span className="font-headline tracking-widest text-[11px] text-accent uppercase font-bold">NOTIVO AI</span>
            </div>
            <p className="text-xs text-orange-900 leading-relaxed font-serif italic pb-1">
              Integration by Parts (39%) is the weakest concept across Grade 10 today. 7 of 32 students show critical hesitation specifically at this step. Suggest targeted 15-min intervention in the next class session.
            </p>
          </div>
        </div>

      </div>

      {/* School-wide Heatmap — reusable composite */}
      <HeatmapWithInsights
        students={students}
        title="School-wide Student Heatmap"
        subtitle="All tracked students • Click any cell for AI insights"
        showLive={false}
      />

      {/* Bottom Grid: Engagement Donut | Live Alerts (salvaged from old Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Engagement Donut */}
        <button
          onClick={() => setEngagementOpen(true)}
          className="text-left bg-white rounded-2xl border border-s200 p-6 shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-accent/40 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none group-hover:text-accent transition-colors">Today's Engagement</h3>
              <p className="text-xs text-s500 mt-1">Attending vs Absent • Pen-session activity</p>
            </div>
            <ChevronRight size={16} className="text-s400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </div>
          <div className="flex items-center justify-center mt-4 mb-2 gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={demographics}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {demographics.map((_: Demographics, i: number) => (
                    <Cell key={i} fill={i === 0 ? '#F47B20' : '#f472b6'} />
                  ))}
                </Pie>
                <text x="50%" y="46%" textAnchor="middle" fontSize={18} fontWeight={800} fill="#1e293b" className="font-headline tracking-wider">
                  {totalStudents.toLocaleString()}
                </text>
                <text x="50%" y="58%" textAnchor="middle" fontSize={9} fill="#94a3b8" className="font-mono tracking-widest uppercase">
                  Students
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4">
              {demographics.map((d: Demographics, i: number) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: i === 0 ? '#F47B20' : '#f472b6' }} />
                  <div>
                    <div className="text-xs font-bold text-s800">{d.label}</div>
                    <div className="text-[10px] font-mono text-s500 tracking-wider">
                      {d.value.toLocaleString()}
                      {totalStudents > 0 && <> • {((d.value / totalStudents) * 100).toFixed(1)}%</>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </button>

        {/* Live Alert Feed */}
        <div className="bg-gradient-to-br from-[#fff8f3] to-[#fff5ee] border border-[#FFD4A8] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3b1f7a] tracking-tight leading-none">Notivo Intelligence</h3>
              <p className="text-xs text-s500 mt-1">Live pen session alerts • Today</p>
            </div>
            <span className="animate-pulse bg-accent text-white text-[9px] font-mono tracking-widest font-bold px-2.5 py-1 rounded-full">LIVE</span>
          </div>
          <div className="flex flex-col gap-3">
            {alerts.length === 0 ? (
              <div className="text-xs text-s400 font-mono text-center py-4">No alerts at this time</div>
            ) : alerts.slice(0, 3).map((a, i) => (
              <button
                key={a.id}
                onClick={() => setActiveAlert(a)}
                className={`group text-left w-full flex items-start gap-2 p-2.5 rounded-xl shadow-[0_2px_10px_-4px_rgba(239,68,68,0.2)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                  i === 0 ? 'bg-red-50 border border-red-200 hover:border-red-300' : 'bg-amber-50 border border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${i === 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-s900 leading-snug">
                    <span className={i === 0 ? 'text-red-700' : 'text-amber-700'}>{a.studentName}</span> — {a.issue}
                  </div>
                  <div className="text-[9px] font-mono text-s500 mt-1 uppercase tracking-widest">{a.context}</div>
                </div>
                <ChevronRight size={12} className={`shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform ${i === 0 ? 'text-red-400' : 'text-amber-400'}`} />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Drill-down modals ──────────────────────────────────────────── */}
      <TeacherDetailModal teacher={activeTeacher} onClose={() => setActiveTeacher(null)} />
      <EngagementDetailModal
        open={engagementOpen}
        onClose={() => setEngagementOpen(false)}
        breakdown={engagementBreakdown}
      />
      <AlertDetailModal alert={activeAlert} onClose={() => setActiveAlert(null)} />
    </div>
  );
}

// ── Drill-down: Teacher row ───────────────────────────────────────────────

function TeacherDetailModal({ teacher, onClose }: { teacher: TeacherPerf | null; onClose: () => void }) {
  if (!teacher) return null;
  const initials = teacher.name.split(' ').map((n) => n[0]).join('').replace('.', '');
  const tier: 'best' | 'good' | 'risk' =
    teacher.avgScore >= 80 ? 'best' : teacher.avgScore >= 60 ? 'good' : 'risk';
  const tierColor =
    tier === 'best' ? { bg: '#dcfce7', fg: '#166534', label: 'Strong' }
    : tier === 'good' ? { bg: '#dbeafe', fg: '#1e40af', label: 'Steady' }
    : { bg: '#fee2e2', fg: '#991b1b', label: 'Needs support' };

  return (
    <KpiDetailModal
      open
      title={teacher.name}
      subtitle={`Faculty performance • Avg score ${teacher.avgScore}%`}
      onClose={onClose}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#e0e7ff',
          color: '#4338ca', fontWeight: 700, fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{initials}</div>
        <div>
          <KpiPill bg={tierColor.bg} fg={tierColor.fg}>{tierColor.label}</KpiPill>
        </div>
      </div>

      <KpiTable headers={['Metric', 'Value', 'Status']}>
        <KpiRow>
          <KpiCell bold>Avg Class Score</KpiCell>
          <KpiCell><KpiBar pct={teacher.avgScore} color={tier === 'best' ? '#10b981' : tier === 'good' ? '#3b82f6' : '#ef4444'} /></KpiCell>
          <KpiCell><KpiPill bg={tierColor.bg} fg={tierColor.fg}>{tierColor.label}</KpiPill></KpiCell>
        </KpiRow>
        <KpiRow>
          <KpiCell bold>Students At Risk</KpiCell>
          <KpiCell mono color={teacher.issues > 0 ? '#dc2626' : undefined}>{teacher.issues}</KpiCell>
          <KpiCell>
            <KpiPill
              bg={teacher.issues > 0 ? '#fee2e2' : '#dcfce7'}
              fg={teacher.issues > 0 ? '#991b1b' : '#166534'}
            >{teacher.issues > 0 ? 'Attention' : 'Healthy'}</KpiPill>
          </KpiCell>
        </KpiRow>
        <KpiRow>
          <KpiCell bold>Total Students</KpiCell>
          <KpiCell mono>{teacher.total}</KpiCell>
          <KpiCell><KpiPill bg="#f1f5f9" fg="#475569">Roster</KpiPill></KpiCell>
        </KpiRow>
      </KpiTable>

      <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
        <button
          onClick={() => { window.location.hash = '#/teachers'; onClose(); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, border: 'none',
            background: '#1e293b', color: '#fff', fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Open faculty page <ExternalLink size={12} />
        </button>
      </div>
    </KpiDetailModal>
  );
}

// ── Drill-down: Engagement donut ──────────────────────────────────────────

function EngagementDetailModal({
  open, onClose, breakdown,
}: {
  open: boolean;
  onClose: () => void;
  breakdown: { attending: number; absent: number; total: number; attendingPct: number; absentPct: number };
}) {
  if (!open) return null;
  return (
    <KpiDetailModal
      open
      title="Today's Engagement"
      subtitle="Pen-session activity • Attending vs Absent"
      onClose={onClose}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <Stat label="Total Students" value={breakdown.total.toLocaleString()} />
        <Stat label="Attending"      value={breakdown.attending.toLocaleString()} color="#F47B20" />
        <Stat label="Absent"         value={breakdown.absent.toLocaleString()} color="#ec4899" />
      </div>

      <KpiTable headers={['Segment', 'Students', 'Share']}>
        <KpiRow>
          <KpiCell bold>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F47B20' }} />
              Attending
            </span>
          </KpiCell>
          <KpiCell mono>{breakdown.attending}</KpiCell>
          <KpiCell><KpiBar pct={breakdown.attendingPct} color="#F47B20" /></KpiCell>
        </KpiRow>
        <KpiRow>
          <KpiCell bold>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ec4899' }} />
              Absent
            </span>
          </KpiCell>
          <KpiCell mono>{breakdown.absent}</KpiCell>
          <KpiCell><KpiBar pct={breakdown.absentPct} color="#ec4899" /></KpiCell>
        </KpiRow>
      </KpiTable>

      <div style={{
        marginTop: 18, padding: 14, borderRadius: 12,
        background: '#f8fafc', border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <Info size={14} style={{ color: '#64748b', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
          Attendance is derived from <strong>pen-session activity</strong>: any student with at least
          one pen session today counts as Attending. Replace with a dedicated
          <code style={{ background: '#e2e8f0', padding: '0 4px', borderRadius: 4, margin: '0 4px' }}>attendance</code>
          collection when available.
        </div>
      </div>
    </KpiDetailModal>
  );
}

// ── Drill-down: Notivo Intelligence alert ─────────────────────────────────

function AlertDetailModal({ alert, onClose }: { alert: AlertItem | null; onClose: () => void }) {
  if (!alert) return null;
  const sevTheme =
    alert.severity === 'critical' ? { bg: '#fee2e2', fg: '#991b1b', label: 'Critical' }
    : alert.severity === 'warning' ? { bg: '#fef3c7', fg: '#92400e', label: 'Warning' }
    : { bg: '#dbeafe', fg: '#1e40af', label: 'Info' };

  return (
    <KpiDetailModal
      open
      title={alert.studentName}
      subtitle={alert.context}
      onClose={onClose}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <KpiPill bg={sevTheme.bg} fg={sevTheme.fg}>{sevTheme.label.toUpperCase()}</KpiPill>
        {alert.timestamp && (
          <span style={{
            fontFamily: '"Roboto Mono", monospace', fontSize: 10,
            color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {new Date(alert.timestamp).toLocaleString()}
          </span>
        )}
      </div>

      <div style={{
        padding: 16, borderRadius: 12,
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '1px solid #fde68a',
      }}>
        <div style={{
          fontFamily: '"Roboto Mono", monospace', fontSize: 10,
          color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 6, fontWeight: 600,
        }}>
          ⚡ Notivo AI Detected
        </div>
        <p style={{
          margin: 0, fontFamily: '"Lora", serif', fontStyle: 'italic',
          color: '#78350f', fontSize: 14, lineHeight: 1.6,
        }}>
          {alert.issue}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
            background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
        {alert.studentUid && (
          <button
            onClick={() => { window.location.hash = `#/teachers?uid=${alert.studentUid}`; onClose(); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, border: 'none',
              background: '#F47B20', color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Open student profile <ExternalLink size={12} />
          </button>
        )}
      </div>
    </KpiDetailModal>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      padding: 12, borderRadius: 12, background: '#f8fafc',
      border: '1px solid #e2e8f0',
    }}>
      <div style={{
        fontFamily: '"Roboto Mono", monospace', fontSize: 9,
        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: 4, fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? '#1e293b', fontFamily: '"Lora", serif' }}>
        {value}
      </div>
    </div>
  );
}
