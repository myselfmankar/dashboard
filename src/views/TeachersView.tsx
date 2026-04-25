import { useState, useEffect } from 'react';
import { BookOpen, Users, TrendingUp, ClipboardList } from 'lucide-react';
import { KpiItem } from '../components/KpiItem';
import { HeatmapWithInsights } from '../components/HeatmapWithInsights';
import { TeacherKpiModals, type TeacherKpi } from '../components/TeacherKpiModals';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { usePrewarmAiCache } from '../lib/usePrewarmAiCache';
import type { HeatmapStudent } from '../types';

export function TeachersView() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Teacher';
  const [students, setStudents] = useState<HeatmapStudent[]>([]);
  const [openKpi, setOpenKpi] = useState<TeacherKpi | null>(null);

  useEffect(() => {
    api.getStudentsWithRisk().then(setStudents).catch(console.error);
  }, []);

  // Pre-warm the AI cache so demo clicks open instantly.
  usePrewarmAiCache(students);

  const avgScore = students.length > 0
    ? `${Math.round(students.reduce((s, x) => s + x.score, 0) / students.length)}%`
    : '--';
  const pendingReviews = students.filter((s) => s.risk >= 3).length;

  return (
    <div className="flex gap-6 h-full p-4 lg:p-0">
      {/* MAIN COLUMN */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-[#FFE8D0] to-white border border-[#FFD4A8] rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <h2 className="text-3xl font-headline tracking-wide text-s900 mb-2">Welcome Back, <span className="text-accent font-serif italic">{firstName}!</span></h2>
            <p className="text-sm font-semibold text-s600">Your students completed <strong className="text-s900">80%</strong> of the tasks.</p>
            <p className="text-sm font-semibold text-s600">Progress is <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">very good!</span></p>
          </div>
          {/* SVG Illustration */}
          <div className="absolute right-0 bottom-0 w-[180px] md:w-[220px] opacity-90">
            <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <rect x="20" y="72" width="80" height="6" rx="3" fill="#FFE8D0"/>
              <rect x="26" y="78" width="5" height="18" rx="2" fill="#FFD4A8"/>
              <rect x="89" y="78" width="5" height="18" rx="2" fill="#FFD4A8"/>
              <rect x="28" y="48" width="22" height="26" rx="6" fill="#fbbf24"/>
              <circle cx="39" cy="40" r="11" fill="#fde68a"/>
              <path d="M28 38 Q39 28 50 38" fill="#92400e"/>
              <circle cx="35" cy="40" r="1.5" fill="#78350f"/>
              <circle cx="43" cy="40" r="1.5" fill="#78350f"/>
              <path d="M35 45 Q39 49 43 45" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <rect x="70" y="42" width="28" height="32" rx="7" fill="#F47B20"/>
              <circle cx="84" cy="32" r="13" fill="#fde68a"/>
              <path d="M71 28 Q84 16 97 28 Q97 22 84 18 Q71 22 71 28Z" fill="#1e293b"/>
              <circle cx="79" cy="31" r="2" fill="#78350f"/>
              <circle cx="89" cy="31" r="2" fill="#78350f"/>
              <path d="M79 37 Q84 41 89 37" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M70 55 Q58 60 55 68" stroke="#F47B20" strokeWidth="6" strokeLinecap="round"/>
              <rect x="30" y="62" width="26" height="16" rx="3" fill="#a5f3fc"/>
              <line x1="43" y1="62" x2="43" y2="78" stroke="#67e8f9" strokeWidth="1"/>
              <rect x="4" y="64" width="8" height="10" rx="2" fill="#d1fae5"/>
              <path d="M8 64 Q4 56 10 52 Q12 58 8 64Z" fill="#34d399"/>
              <path d="M8 64 Q14 56 8 50 Q6 56 8 64Z" fill="#6ee7b7"/>
            </svg>
          </div>
        </div>

        {/* Teacher KPI Cards — click to drill down */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiItem title="My Classes" mtc="blue" value={1} trend="This term" icon={<BookOpen/>} onClick={() => setOpenKpi('classes')} />
          <KpiItem title="Attendance Rate" mtc="green" value="N/A" trend="No data yet" icon={<Users/>} onClick={() => setOpenKpi('attendance')} />
          <KpiItem title="Avg Score" mtc="purple" value={avgScore} trend="Current term" icon={<TrendingUp/>} onClick={() => setOpenKpi('scores')} />
          <KpiItem title="Pending Reviews" mtc="amber" value={pendingReviews} trend="Action needed" icon={<ClipboardList/>} isDown onClick={() => setOpenKpi('reviews')} />
        </div>

        <TeacherKpiModals active={openKpi} students={students} onClose={() => setOpenKpi(null)} />

        {/* Heatmap & Insights — independent reusable widget */}
        <HeatmapWithInsights
          students={students}
          subtitle="Real-time pen behaviour • Grade 10-A • Mathematics • Today"
          emptyRightSlot={
            <>
              <div className="bg-s50 border border-s100 rounded-xl p-4 flex-1 flex flex-col justify-center items-center text-center text-xs text-s400">
                Click any student cell to view pen analytics
              </div>
              <div>
                <div className="text-[10px] font-mono text-s400 uppercase tracking-widest mb-2 border-b border-s100 pb-1">Live Alert Feed</div>
                {students.filter((s) => s.risk >= 4).length === 0 ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700 font-mono">No critical alerts</div>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs shadow-sm">
                    <div className="font-bold text-s900 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {students.find((s) => s.risk >= 4)?.name}
                    </div>
                    <div className="text-[11px] text-s600 mt-1 leading-snug">Risk level {students.find((s) => s.risk >= 4)?.risk} • Score {students.find((s) => s.risk >= 4)?.score}%</div>
                  </div>
                )}
              </div>
            </>
          }
        />

      </div>

    </div>
  );
}
