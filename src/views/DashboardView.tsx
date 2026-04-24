import { useEffect, useState } from 'react';
import { api } from '../api';
import { Users, BookOpen, PenTool, AlertCircle } from 'lucide-react';
import { KpiItem } from '../components/KpiItem';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { DashboardData, AttendanceDay, Demographics, Teacher } from '../types';

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const attendanceData: AttendanceDay[] = [
    { day: 'Mon', present: 345, absent: 55 },
    { day: 'Tue', present: 370, absent: 30 },
    { day: 'Wed', present: 355, absent: 45 },
    { day: 'Thu', present: 380, absent: 20 },
    { day: 'Fri', present: 330, absent: 70 },
    { day: 'Sat', present: 290, absent: 110 },
  ];

  useEffect(() => {
    Promise.all([api.getKpis(), api.getAlerts(), api.getDemographics(), api.getTeachers()])
      .then(([kpis, alerts, demographics, teacherList]) => {
        setData({ kpis, alerts, demographics });
        setTeachers(teacherList);
      })
      .catch(console.error);
  }, []);

  if (!data) return <div className="p-8 text-s400 font-mono text-sm">Synchronizing Notivo Cloud...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Administrator Overview</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">Real-time school intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiItem title="Students" mtc="blue" value={data.kpis.totalStudents.toLocaleString()} trend={data.kpis.totalStudentsChange} icon={<Users/>} />
        <KpiItem title="Teachers" mtc="orange" value={data.kpis.totalTeachers} trend={data.kpis.totalTeachersChange} icon={<BookOpen/>} />
        <KpiItem title="Live Sessions" mtc="pink" value={data.kpis.penSessionsToday} trend={`${data.kpis.penSessionsLive} active`} icon={<PenTool/>} />
        <KpiItem title="At Risk" mtc="amber" value={data.kpis.studentsAtRisk} trend="Review needed" icon={<AlertCircle/>} isDown />
      </div>

      {/* Row 2: Demographics & Top Teachers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Demographics Donut Chart */}
        <div className="bg-white rounded-2xl border border-s200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Student Demographics</h3>
            <p className="text-xs text-s500 mt-1">Gender split - AY 2024-25</p>
          </div>
          <div className="flex items-center justify-center mt-4 mb-2 gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={data.demographics}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.demographics.map((_: Demographics, i: number) => (
                    <Cell key={i} fill={i === 0 ? '#F47B20' : '#f472b6'} />
                  ))}
                </Pie>
                <text x="50%" y="46%" textAnchor="middle" fontSize={18} fontWeight={800} fill="#1e293b" className="font-headline tracking-wider">
                  {data.kpis.totalStudents.toLocaleString()}
                </text>
                <text x="50%" y="58%" textAnchor="middle" fontSize={9} fill="#94a3b8" className="font-mono tracking-widest uppercase">
                  Students
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4">
              {data.demographics.map((d: Demographics, i: number) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: i === 0 ? '#F47B20' : '#f472b6' }} />
                  <div>
                    <div className="text-xs font-bold text-s800">{d.label}</div>
                    <div className="text-[10px] font-mono text-s500 tracking-wider">
                      {d.value.toLocaleString()}
                      {data.kpis.totalStudents > 0 && (
                        <> • {((d.value / data.kpis.totalStudents) * 100).toFixed(1)}%</>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Teachers */}
        <div className="bg-white rounded-2xl border border-s200 p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="mb-4">
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Top Teachers</h3>
            <p className="text-xs text-s500 mt-1">Faculty highlights</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-s700 border-separate" style={{ borderSpacing: '0 8px' }}>
              <thead>
                <tr className="text-[#64748b] text-[10px] uppercase tracking-widest font-mono">
                  <th className="pb-2 font-normal">Name</th>
                  <th className="pb-2 font-normal">Subject</th>
                  <th className="pb-2 font-normal">Class</th>
                  <th className="pb-2 font-normal text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-xs text-s400 font-mono">Loading faculty…</td></tr>
                ) : teachers.map((t, i) => (
                  <tr key={i} className="bg-s50 rounded-xl hover:bg-s100 transition-colors">
                    <td className="py-2.5 px-3 rounded-l-xl font-bold text-s800">{t.name}</td>
                    <td className="py-2.5 px-3">{t.sub}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{t.cls}</td>
                    <td className="py-2.5 px-3 rounded-r-xl text-right">
                      <span className="text-[10px] px-2 py-1 flex items-center justify-end font-bold rounded uppercase tracking-widest text-green-600">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Weekly Attendance Chart & Live Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Attendance Bar Chart */}
        <div className="bg-white rounded-2xl border border-s200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Weekly Attendance</h3>
            <p className="text-xs text-s500 mt-1">Present vs Absent</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={attendanceData} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'DM Mono, monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'DM Mono, monospace' }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingTop: 8 }}
              />
              <Bar dataKey="present" name="Present" fill="#F47B20" radius={[3, 3, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#fca5a5" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
            {data.alerts.length === 0 ? (
              <div className="text-xs text-s400 font-mono text-center py-4">No alerts at this time</div>
            ) : data.alerts.slice(0, 3).map((a, i) => (
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
