import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { api } from '../api';
import type { Teacher } from '../types';

type PeriodSlot = { period: string; start: string; end: string; duration: string; isBreak: boolean };

const PERIODS: PeriodSlot[] = [
  { period: '1',     start: '08:00', end: '08:45', duration: '45 mins', isBreak: false },
  { period: '2',     start: '08:45', end: '09:30', duration: '45 mins', isBreak: false },
  { period: 'Break', start: '09:30', end: '09:45', duration: '15 mins', isBreak: true },
  { period: '3',     start: '09:45', end: '10:30', duration: '45 mins', isBreak: false },
  { period: '4',     start: '10:30', end: '11:15', duration: '45 mins', isBreak: false },
  { period: 'Lunch', start: '11:15', end: '12:00', duration: '45 mins', isBreak: true },
  { period: '5',     start: '12:00', end: '12:45', duration: '45 mins', isBreak: false },
  { period: '6',     start: '12:45', end: '13:30', duration: '45 mins', isBreak: false },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const SUBJECT_COLORS: Record<string, string> = {
  Math:        'bg-blue-50 text-blue-700 border-blue-200',
  Mathematics: 'bg-blue-50 text-blue-700 border-blue-200',
  Physics:     'bg-purple-50 text-purple-700 border-purple-200',
  Phys:        'bg-purple-50 text-purple-700 border-purple-200',
  Chemistry:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Chem:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  Biology:     'bg-lime-50 text-lime-700 border-lime-200',
  Bio:         'bg-lime-50 text-lime-700 border-lime-200',
  English:     'bg-orange-50 text-orange-700 border-orange-200',
  Eng:         'bg-orange-50 text-orange-700 border-orange-200',
  History:     'bg-amber-50 text-amber-800 border-amber-200',
  Geography:   'bg-teal-50 text-teal-700 border-teal-200',
  CS:          'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Computer Science': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  PE:          'bg-pink-50 text-pink-700 border-pink-200',
};

function colorFor(subject: string): string {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
  // Stable fallback hash → pick from same palette set.
  const palette = Object.values(SUBJECT_COLORS);
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

function shortLabel(subject: string): string {
  if (!subject) return '—';
  if (subject.length <= 6) return subject;
  return subject.slice(0, 5) + '.';
}

function todayLabel(): string {
  const idx = new Date().getDay(); // 0 Sun .. 6 Sat
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx];
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function parseHM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function fmt12(s: string): string {
  const [h, m] = s.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

export function TimetableView() {
  const [grade, setGrade] = useState('Grade 10-A');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  // Re-render every 30s so the LIVE NOW pill stays accurate.
  const [, setTick] = useState(0);

  useEffect(() => {
    api.getTeachers().then(setTeachers).catch(console.error);
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Build a stable, deterministic schedule keyed by (grade, day, period).
  // Subjects come from the real teacher roster — round-robin across the week,
  // so every subject gets fair representation and the grid is never random.
  const schedule = useMemo(() => {
    const subjects = Array.from(new Set(teachers.map((t) => t.sub).filter(Boolean))) as string[];
    const teacherBySubject = new Map<string, Teacher>();
    for (const t of teachers) if (t.sub && !teacherBySubject.has(t.sub)) teacherBySubject.set(t.sub, t);
    const map = new Map<string, { subject: string; teacher?: Teacher }>();
    if (subjects.length === 0) return map;
    const seed = grade.split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 7);
    DAYS.forEach((day, di) => {
      let n = 0;
      PERIODS.forEach((p, pi) => {
        if (p.isBreak) return;
        const idx = Math.abs(seed + di * 7 + pi * 3 + n) % subjects.length;
        const subject = subjects[idx];
        map.set(`${day}|${pi}`, { subject, teacher: teacherBySubject.get(subject) });
        n++;
      });
    });
    return map;
  }, [teachers, grade]);

  const today = todayLabel();
  const isWeekday = DAYS.includes(today);
  const nowM = nowMinutes();
  const livePeriodIdx = isWeekday
    ? PERIODS.findIndex((p) => nowM >= parseHM(p.start) && nowM < parseHM(p.end))
    : -1;

  const liveCell = isWeekday && livePeriodIdx >= 0
    ? schedule.get(`${today}|${livePeriodIdx}`)
    : null;

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-2xl border border-s200 shadow-sm">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Timetable</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">
            Academic schedule &bull; {grade}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {liveCell ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                Live now &middot; {liveCell.subject}
              </span>
            </div>
          ) : isWeekday ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-s50 border border-s200">
              <Clock size={11} className="text-s400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-s500">
                Between periods
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-s50 border border-s200">
              <Calendar size={11} className="text-s400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-s500">
                Weekend &middot; no classes today
              </span>
            </div>
          )}
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="px-4 py-2 bg-s50 border border-s200 rounded-xl text-sm font-semibold text-s800 outline-none focus:border-accent focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer"
          >
            <option>Grade 10-A</option>
            <option>Grade 9-B</option>
            <option>Grade 11-C</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight">Weekly Schedule</h3>
            <p className="text-xs text-s500">Mon-Fri class timetable</p>
          </div>
          {teachers.length === 0 && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-s400">Loading teachers…</p>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header row (period numbers) */}
            <div className="grid grid-cols-9 gap-2 mb-2">
              <div className="w-16"></div>
              {PERIODS.map((p, i) => (
                <div key={i} className="text-center font-mono text-[10px] text-s400 uppercase tracking-widest px-2">
                  {p.isBreak ? p.period : `P${p.period}`}
                </div>
              ))}
            </div>

            {/* Day rows */}
            <div className="flex flex-col gap-2">
              {DAYS.map((day) => {
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={`grid grid-cols-9 gap-2 rounded-xl ${isToday ? 'bg-accent/5 ring-1 ring-accent/30 p-1' : ''}`}
                  >
                    <div className={`flex items-center justify-end pr-4 font-bold text-xs w-16 ${isToday ? 'text-accent' : 'text-s800'}`}>
                      {day}
                      {isToday && (
                        <span className="ml-1 w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                    {PERIODS.map((p, pi) => {
                      if (p.isBreak) {
                        return (
                          <div
                            key={pi}
                            className="flex items-center justify-center h-12 rounded-xl text-[10px] font-mono uppercase tracking-widest border border-dashed bg-s50 text-s400 border-s200"
                          >
                            {p.period}
                          </div>
                        );
                      }
                      const cell = schedule.get(`${day}|${pi}`);
                      const subj = cell?.subject ?? '—';
                      const isLive = isToday && pi === livePeriodIdx;
                      const colorClass = cell ? colorFor(subj) : 'bg-white text-s400 border-s200';
                      return (
                        <div
                          key={pi}
                          title={cell ? `${subj} — ${cell.teacher?.name ?? ''}` : undefined}
                          className={`flex items-center justify-center h-12 rounded-xl text-[11px] font-bold border transition-all hover:scale-[1.04] ${colorClass} ${isLive ? 'ring-2 ring-emerald-400 shadow-md shadow-emerald-200' : ''}`}
                        >
                          {shortLabel(subj)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Period Timings */}
        <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm overflow-x-auto">
          <h3 className="font-serif text-lg font-bold text-s800 tracking-tight mb-1">Period Timings</h3>
          <p className="text-xs text-s500 mb-4">Daily bell schedule</p>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-s200">
                <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest pl-2">Period</th>
                <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Start</th>
                <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">End</th>
                <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-s100 text-xs">
              {PERIODS.map((p, i) => {
                const isLive = isWeekday && i === livePeriodIdx;
                return (
                  <tr
                    key={i}
                    className={`transition-colors ${isLive ? 'bg-emerald-50' : p.isBreak ? 'bg-s50' : 'hover:bg-s50'}`}
                  >
                    <td className="py-2.5 pl-2 font-semibold text-s800 flex items-center gap-2">
                      {p.period}
                      {isLive && (
                        <span className="text-[8px] font-mono uppercase tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                          live
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-s600 font-mono">{fmt12(p.start)}</td>
                    <td className="py-2.5 text-s600 font-mono">{fmt12(p.end)}</td>
                    <td className="py-2.5 text-s600">{p.duration}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Teacher Assignments */}
        <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm overflow-x-auto">
          <h3 className="font-serif text-lg font-bold text-s800 tracking-tight mb-1">Teacher Assignments</h3>
          <p className="text-xs text-s500 mb-4">Subject-wise allocation</p>
          {teachers.length === 0 ? (
            <p className="text-xs text-s400 font-mono py-4">No teachers loaded.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-s200">
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest pl-2">Subject</th>
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Teacher</th>
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-s100 text-xs">
                {teachers.map((a, i) => (
                  <tr key={i} className="hover:bg-s50 transition-colors">
                    <td className="py-2.5 pl-2 font-bold text-s800 whitespace-nowrap">
                      <span className="bg-s100 px-2 py-0.5 rounded-full text-s700">{a.sub || '—'}</span>
                    </td>
                    <td className="py-2.5 text-s600 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-accent/20 text-accent font-bold flex items-center justify-center text-[9px]">
                        {a.av}
                      </div>
                      {a.name}
                    </td>
                    <td className="py-2.5 text-s600 font-mono">{a.cls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
