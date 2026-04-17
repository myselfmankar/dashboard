import { useState } from 'react';

export function TimetableView() {
  const [grade, setGrade] = useState('Grade 10-A');
  
  // Dummy data for timetable
  const periods = [
    { period: '1', start: '08:00 AM', end: '08:45 AM', duration: '45 mins' },
    { period: '2', start: '08:45 AM', end: '09:30 AM', duration: '45 mins' },
    { period: 'Break', start: '09:30 AM', end: '09:45 AM', duration: '15 mins' },
    { period: '3', start: '09:45 AM', end: '10:30 AM', duration: '45 mins' },
    { period: '4', start: '10:30 AM', end: '11:15 AM', duration: '45 mins' },
    { period: 'Lunch', start: '11:15 AM', end: '12:00 PM', duration: '45 mins' },
    { period: '5', start: '12:00 PM', end: '12:45 PM', duration: '45 mins' },
    { period: '6', start: '12:45 PM', end: '01:30 PM', duration: '45 mins' },
  ];

  const assignments = [
    { subject: 'Mathematics', teacher: 'Leon Carter', periods: 6 },
    { subject: 'Physics', teacher: 'Amara Singh', periods: 5 },
    { subject: 'Chemistry', teacher: 'Priya Mehta', periods: 4 },
    { subject: 'English', teacher: 'James Okafor', periods: 5 },
    { subject: 'Computer Sci', teacher: 'Ivan Torres', periods: 3 },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const gridPeriods = [1, 2, 'Break', 3, 4, 'Lunch', 5, 6];

  const getSubject = (day: string, p: any) => {
    if (p === 'Break' || p === 'Lunch') return p;
    // Just pseudo-random for visualization
    const subs = ['Math', 'Phys', 'Chem', 'Eng', 'CS', 'PE'];
    return subs[(day.charCodeAt(0) + (p as number)) % subs.length];
  }

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-s200 shadow-sm">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Timetable</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">Academic schedule - {grade}</p>
        </div>
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

      <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
         <div className="mb-6">
           <h3 className="font-serif text-lg font-bold text-s800 tracking-tight">Weekly Schedule</h3>
           <p className="text-xs text-s500">Mon-Fri class timetable</p>
         </div>

         {/* Timetable Grid */}
         <div className="overflow-x-auto">
            <div className="min-w-[600px]">
               {/* Header (Periods) */}
               <div className="grid grid-cols-9 gap-2 mb-2">
                 <div className="w-16"></div> {/* Empty corner */}
                 {gridPeriods.map((p, i) => (
                   <div key={i} className="text-center font-mono text-[10px] text-s400 uppercase tracking-widest px-2">{typeof p === 'number' ? `P${p}` : p}</div>
                 ))}
               </div>

               {/* Rows (Days) */}
               <div className="flex flex-col gap-2">
                 {days.map(day => (
                   <div key={day} className="grid grid-cols-9 gap-2">
                     <div className="flex items-center justify-end pr-4 font-bold text-xs text-s800 w-16">{day}</div>
                     {gridPeriods.map((p, i) => {
                       const isBreak = p === 'Break' || p === 'Lunch';
                       const subj = getSubject(day, p);
                       const colors: any = {
                         'Math': 'bg-blue-50 text-blue-700 border-blue-200',
                         'Phys': 'bg-purple-50 text-purple-700 border-purple-200',
                         'Chem': 'bg-green-50 text-green-700 border-green-200',
                         'Eng': 'bg-orange-50 text-orange-700 border-orange-200',
                         'CS': 'bg-cyan-50 text-cyan-700 border-cyan-200',
                         'PE': 'bg-pink-50 text-pink-700 border-pink-200',
                       };
                       const colorClass = isBreak ? 'bg-s50 text-s400 border-dashed border-s200' : (colors[subj] || 'bg-white text-s800 border-s200');

                       return (
                         <div key={i} className={`flex items-center justify-center h-12 rounded-xl text-[11px] font-bold border ${colorClass} transition-transform hover:scale-105 cursor-pointer`}>
                           {subj}
                         </div>
                       )
                     })}
                   </div>
                 ))}
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
                {periods.map((p, i) => (
                  <tr key={i} className={`hover:bg-s50 transition-colors ${['Break','Lunch'].includes(p.period)?'bg-s50':''}`}>
                    <td className="py-2.5 pl-2 font-semibold text-s800">{p.period}</td>
                    <td className="py-2.5 text-s600">{p.start}</td>
                    <td className="py-2.5 text-s600">{p.end}</td>
                    <td className="py-2.5 text-s600">{p.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>

         {/* Teacher Assignments */}
         <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <h3 className="font-serif text-lg font-bold text-s800 tracking-tight mb-1">Teacher Assignments</h3>
            <p className="text-xs text-s500 mb-4">Subject-wise allocation</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-s200">
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest pl-2">Subject</th>
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Teacher</th>
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Periods/Wk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-s100 text-xs">
                {assignments.map((a, i) => (
                  <tr key={i} className="hover:bg-s50 transition-colors">
                    <td className="py-2.5 pl-2 font-bold text-s800 whitespace-nowrap"><span className="bg-s100 px-2 py-0.5 rounded-full text-s700">{a.subject}</span></td>
                    <td className="py-2.5 text-s600 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-accent/20 text-accent font-bold flex items-center justify-center text-[9px]">{a.teacher.substring(0,2).toUpperCase()}</div>
                      {a.teacher}
                    </td>
                    <td className="py-2.5 text-s600 font-mono">{a.periods}</td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}
