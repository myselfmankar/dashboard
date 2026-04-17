import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Users, BookOpen, PenTool, AlertCircle } from 'lucide-react';
import { KpiItem } from '../components/KpiItem';

export function DashboardView() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([api.getKpis(), api.getAlerts(), api.getDemographics()])
      .then(([kpis, alerts, demographics]) => setData({ kpis, alerts, demographics }))
      .catch(console.error);
  }, []);

  if (!data) return <div className="p-8 text-s400 font-mono text-sm">Synchronizing Notivo Cloud...</div>;

  const topTeachers = [
    { name: 'Emilia Clarke', subject: 'English', cls: '10-A', status: 'Online' },
    { name: 'Dr. John Doe', subject: 'Physics', cls: '12-C', status: 'In Class' },
    { name: 'Sarah Parker', subject: 'Biology', cls: '9-B', status: 'Reviewing' },
    { name: 'Leon Carter', subject: 'Math', cls: '10-C', status: 'In Class' },
  ];

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
        
        {/* Demographics SVG Chart */}
        <div className="bg-white rounded-2xl border border-s200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Student Demographics</h3>
            <p className="text-xs text-s500 mt-1">Gender split - AY 2024-25</p>
          </div>
          <div className="flex justify-center mt-4 mb-2">
            <svg width="100%" height="170" viewBox="0 0 260 170" style={{ display: 'block' }}>
              {/* Background circle */}
              <circle cx="88" cy="80" r="55" fill="none" stroke="#f1f5f9" strokeWidth="22"/>
              {/* Male segment 54.8% */}
              <circle cx="88" cy="80" r="55" fill="none" stroke="#F47B20" strokeWidth="22" strokeDasharray="189.3 345.6" strokeDashoffset="0" transform="rotate(-90 88 80)"/>
              {/* Female segment 45.2% */}
              <circle cx="88" cy="80" r="55" fill="none" stroke="#f472b6" strokeWidth="22" strokeDasharray="156.3 345.6" strokeDashoffset="156.3" transform="rotate(-90 88 80)"/>
              
              {/* Center text */}
              <text x="88" y="76" textAnchor="middle" fontSize="17" fontWeight="800" fill="#1e293b" className="font-headline tracking-wider">3,842</text>
              <text x="88" y="91" textAnchor="middle" fontSize="9" fill="#94a3b8" className="font-mono tracking-widest uppercase">Students</text>
              
              {/* Legend container shifted right */}
              <g transform="translate(150, 48)">
                {/* Male Legend */}
                <circle cx="8" cy="6" r="5" fill="#F47B20"/>
                <text x="17" y="10" fontSize="11" fontWeight="600" fill="#1e293b" className="font-bold">Male</text>
                <text x="17" y="24" fontSize="10" fill="#64748b" className="font-mono tracking-wider">2,104 • 54.8%</text>
                
                {/* Female Legend */}
                <circle cx="8" cy="40" r="5" fill="#f472b6"/>
                <text x="17" y="44" fontSize="11" fontWeight="600" fill="#1e293b" className="font-bold">Female</text>
                <text x="17" y="58" fontSize="10" fill="#64748b" className="font-mono tracking-wider">1,738 • 45.2%</text>
              </g>
            </svg>
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
                {topTeachers.map((t, i) => (
                  <tr key={i} className="bg-s50 rounded-xl hover:bg-s100 transition-colors">
                    <td className="py-2.5 px-3 rounded-l-xl font-bold text-s800">{t.name}</td>
                    <td className="py-2.5 px-3">{t.subject}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{t.cls}</td>
                    <td className="py-2.5 px-3 rounded-r-xl text-right">
                      <span className={`text-[10px] px-2 py-1 flex items-center justify-end font-bold rounded uppercase tracking-widest ${t.status === 'Online' ? 'text-green-600' : t.status === 'In Class' ? 'text-blue-600' : 'text-orange-600'}`}>
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
        
        {/* Weekly Attendance SVG Bar Chart */}
        <div className="bg-white rounded-2xl border border-s200 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Weekly Attendance</h3>
            <p className="text-xs text-s500 mt-1">Present vs Absent</p>
          </div>
          <div className="flex justify-center w-full">
            <svg width="100%" height="145" viewBox="0 0 300 145" style={{ display: 'block' }}>
              {/* Grid Lines */}
              {[8, 35, 62, 89].map((y, i) => (
                <line key={i} x1="25" y1={y} x2="292" y2={y} stroke="#f1f5f9" strokeWidth="1"/>
              ))}
              <line x1="25" y1="117" x2="292" y2="117" stroke="#e2e8f0" strokeWidth="1"/>
              
              {/* Y-Axis Labels */}
              {['0', '100', '200', '300', '400'].map((val, i) => (
                <text key={i} x="22" y={120 - i*28} textAnchor="end" fontSize="8" fill="#94a3b8" className="font-mono">{val}</text>
              ))}

              {/* Mon */}
              <rect x="35" y="24" width="11" height="93" fill="#F47B20" rx="2"/>
              <rect x="48" y="101" width="11" height="16" fill="#fca5a5" rx="2"/>
              
              {/* Tue */}
              <rect x="79" y="17" width="11" height="100" fill="#F47B20" rx="2"/>
              <rect x="92" y="108" width="11" height="9" fill="#fca5a5" rx="2"/>
              
              {/* Wed */}
              <rect x="124" y="21" width="11" height="96" fill="#F47B20" rx="2"/>
              <rect x="137" y="104" width="11" height="13" fill="#fca5a5" rx="2"/>
              
              {/* Thu */}
              <rect x="168" y="15" width="11" height="102" fill="#F47B20" rx="2"/>
              <rect x="181" y="110" width="11" height="7" fill="#fca5a5" rx="2"/>
              
              {/* Fri */}
              <rect x="212" y="28" width="11" height="89" fill="#F47B20" rx="2"/>
              <rect x="225" y="97" width="11" height="20" fill="#fca5a5" rx="2"/>
              
              {/* Sat */}
              <rect x="256" y="38" width="11" height="79" fill="#F47B20" rx="2"/>
              <rect x="269" y="87" width="11" height="30" fill="#fca5a5" rx="2"/>

              {/* X-Axis Labels */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <text key={day} x={47 + i*44} y="130" textAnchor="middle" fontSize="8" fill="#94a3b8" className="uppercase tracking-widest">{day}</text>
              ))}

              {/* Legend below chart */}
              <rect x="78" y="138" width="10" height="5" fill="#F47B20" rx="2"/>
              <text x="91" y="143" fontSize="9" fill="#64748b" className="font-bold">Present</text>
              <rect x="148" y="138" width="10" height="5" fill="#fca5a5" rx="2"/>
              <text x="161" y="143" fontSize="9" fill="#64748b" className="font-bold">Absent</text>
            </svg>
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
             <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl shadow-[0_2px_10px_-4px_rgba(239,68,68,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                <div>
                   <div className="text-[11px] font-bold text-s900 leading-snug"><span className="text-red-700">Tanya M.</span> — 9m 40s hesitation. Writing speed &darr; 88%.</div>
                   <div className="text-[9px] font-mono text-s500 mt-1 uppercase tracking-widest">Grade 10-A • Mathematics • 2 min ago</div>
                </div>
             </div>
             <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl shadow-[0_2px_10px_-4px_rgba(245,158,11,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                <div>
                   <div className="text-[11px] font-bold text-s900 leading-snug"><span className="text-amber-700">Rahul V.</span> — Attempted Q4 three times, crossed out each time.</div>
                   <div className="text-[9px] font-mono text-s500 mt-1 uppercase tracking-widest">Grade 10-A • Mathematics • 8 min ago</div>
                </div>
             </div>
             <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl shadow-[0_2px_10px_-4px_rgba(245,158,11,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                <div>
                   <div className="text-[11px] font-bold text-s900 leading-snug"><span className="text-amber-700">Vivaan T.</span> — Full writing stop for 2:55 on integration problem.</div>
                   <div className="text-[9px] font-mono text-s500 mt-1 uppercase tracking-widest">Grade 10-A • Mathematics • 11 min ago</div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
