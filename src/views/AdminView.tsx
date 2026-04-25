import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Sparkles, AlertTriangle, AlertCircle, BarChart as BarChartIcon, MonitorPlay,
} from 'lucide-react';
import { KpiItem } from '../components/KpiItem';
import { HeatmapWithInsights } from '../components/HeatmapWithInsights';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { usePrewarmAiCache } from '../lib/usePrewarmAiCache';
import { AdminKpiModals, type AdminKpi } from '../components/AdminKpiModals';
import type { WeakConcept, HeatmapStudent, Demographics, Alert as AlertItem } from '../types';

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
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-s100 bg-s50 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {t.name.split(' ').map((n) => n[0]).join('').replace('.', '')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-s900 leading-none">{t.name}</h4>
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
                </div>
              </div>
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
        <div className="bg-white rounded-2xl border border-s200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Today's Engagement</h3>
            <p className="text-xs text-s500 mt-1">Attending vs Absent • Pen-session activity</p>
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
        </div>

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
              <div key={a.id} className={`flex items-start gap-2 p-2.5 rounded-xl shadow-[0_2px_10px_-4px_rgba(239,68,68,0.2)] ${
                i === 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${i === 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div>
                  <div className="text-[11px] font-bold text-s900 leading-snug">
                    <span className={i === 0 ? 'text-red-700' : 'text-amber-700'}>{a.studentName}</span> — {a.issue}
                  </div>
                  <div className="text-[9px] font-mono text-s500 mt-1 uppercase tracking-widest">{a.context}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
