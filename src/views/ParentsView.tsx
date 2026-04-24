import { Calendar, FileText, CheckCircle, Download, Eye, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SubjectPerformance } from '../types';

const childrenPerformance: Record<string, SubjectPerformance[]> = {
  'Richi Hassan': [
    { subject: 'Mathematics', score: 82, grade: 'good' },
    { subject: 'English', score: 74, grade: 'fair' },
    { subject: 'Science', score: 91, grade: 'good' },
    { subject: 'History', score: 58, grade: 'weak' },
    { subject: 'Computer Sci', score: 88, grade: 'good' },
  ],
  'Mark Willy': [
    { subject: 'Mathematics', score: 65, grade: 'fair' },
    { subject: 'English', score: 89, grade: 'good' },
    { subject: 'Science', score: 72, grade: 'fair' },
    { subject: 'History', score: 44, grade: 'weak' },
    { subject: 'Computer Sci', score: 78, grade: 'fair' },
  ],
};

export function ParentsView() {
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Parents</h1>
        <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">My Children Overview</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-accent flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-2xl font-headline text-accent">06</div>
            <div className="text-xs font-bold text-s700 uppercase tracking-wide">Upcoming Events</div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-green-600 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-2xl font-headline text-green-600">15</div>
            <div className="text-xs font-bold text-s700 uppercase tracking-wide">Upcoming Exams</div>
          </div>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm text-teal-600 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-headline text-teal-600">08</div>
            <div className="text-xs font-bold text-s700 uppercase tracking-wide">Result Published</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Child Cards (left side) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <ChildCard 
            title="My Children_01" 
            name="Richi Hassan" 
            gender="Female"
            roll="# 2901"
            addmId="# 1250"
            addmDate="05/04/2016"
            cls="2"
            section="A"
            bg="bg-indigo-50"
            iconColor="text-indigo-500"
          />
          <ChildCard 
            title="My Children_02" 
            name="Mark Willy" 
            gender="Male"
            roll="# 2959"
            addmId="# 1259"
            addmDate="15/04/2016"
            cls="6"
            section="B"
            bg="bg-amber-50"
            iconColor="text-amber-500"
          />
        </div>

        {/* Notice Board (right side) */}
        <div className="glass-card p-5">
           <h3 className="font-serif text-lg font-bold text-s800 tracking-tight mb-4 border-l-4 border-accent pl-3">School Events</h3>
           <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
             <EventItem date="20" month="Mar" title="Parent-Teacher Meeting" time="9:00 AM – 1:00 PM • School Hall" theme="orange" badge="Today+4" />
             <EventItem date="28" month="Mar" title="Annual Sports Day" time="8:00 AM – 5:00 PM • Sports Ground" theme="green" badge="12 days" />
             <EventItem date="05" month="Apr" title="Science Exhibition" time="10:00 AM – 4:00 PM • Lab Block" theme="blue" badge="20 days" />
             <EventItem date="14" month="Apr" title="Cultural Fest" time="All Day • Auditorium" theme="purple" badge="29 days" />
             <EventItem date="22" month="Apr" title="Earth Day Plantation" time="7:00 AM – 9:00 PM • School Garden" theme="orange-dark" badge="37 days" />
           </div>
        </div>
      </div>

      {/* Learning Insights - Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(childrenPerformance).map(([childName, subjects]) => (
          <div key={childName} className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-serif text-lg font-bold text-s800 tracking-tight">{childName}</h3>
              <p className="text-xs text-s500 mt-1">Subject Performance • Current Term</p>
            </div>
            <ResponsiveContainer width="100%" height={subjects.length * 40 + 20}>
              <BarChart
                data={subjects}
                layout="vertical"
                barSize={12}
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'DM Mono, monospace' }}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
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
                  formatter={(value) => [`${value}%`, 'Score']}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {subjects.map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.grade === 'good' ? '#22c55e' : s.grade === 'fair' ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-[10px] font-mono text-s500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" />Good (80%+)</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" />Fair (60-79%)</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" />Weak (&lt;60%)</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

function ChildCard({ title, name, gender, roll, addmId, addmDate, cls, section, bg, iconColor }: any) {
  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
      <div className="flex justify-between items-center mb-6 pl-2">
         <h3 className="font-headline text-lg text-s900 tracking-wide uppercase">{title}</h3>
         <div className="flex gap-2">
           <button className="w-8 h-8 rounded-full border border-s200 flex items-center justify-center hover:bg-s50 text-s500"><Eye size={14}/></button>
           <button className="w-8 h-8 rounded-full border border-green-200 bg-green-50 flex items-center justify-center hover:bg-green-100 text-green-600"><Download size={14}/></button>
           <button className="w-8 h-8 rounded-full border border-red-200 bg-red-50 flex items-center justify-center hover:bg-red-100 text-red-600"><AlertTriangle size={14}/></button>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 pl-2">
         <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${bg} ${iconColor} shrink-0`}>
           <Users size={40} />
         </div>
         <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
           <InfoRow label="Name" value={name} />
           <InfoRow label="Gender" value={gender} />
           <InfoRow label="Roll" value={roll} />
           <InfoRow label="Admission ID" value={addmId} />
           <InfoRow label="Admission Date" value={addmDate} />
           <InfoRow label="Class" value={cls} />
           <InfoRow label="Section" value={section} />
         </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col border-b border-s100 border-dashed pb-1">
      <span className="text-[10px] font-mono text-s400 uppercase">{label}</span>
      <span className="text-sm font-semibold text-s800">{value}</span>
    </div>
  );
}

function EventItem({ date, month, title, time, theme, badge }: any) {
  const themes: any = {
    'orange': { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-500', badgeBg: 'bg-white', badgeText: 'text-orange-500', badgeBorder: 'border-orange-200' },
    'green': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-500', badgeBg: 'bg-green-100', badgeText: 'text-green-700', badgeBorder: 'border-transparent' },
    'blue': { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-500', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', badgeBorder: 'border-transparent' },
    'purple': { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-500', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', badgeBorder: 'border-transparent' },
    'orange-dark': { bg: 'bg-orange-50', border: 'border-orange-600', text: 'text-orange-600', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', badgeBorder: 'border-transparent' },
  };

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
      <div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${t.badgeBg} ${t.badgeText} ${t.badgeBorder}`}>{badge}</span>
      </div>
    </div>
  );
}
