import { useEffect, useState } from 'react';
import { Layers, Users, TrendingUp, Plus, BookOpen } from 'lucide-react';
import { KpiItem } from '../components/KpiItem';
import { api } from '../api';
import type { Teacher } from '../types';

const COLOR_CYCLE = ['blue', 'purple', 'green', 'orange', 'cyan', 'pink'];

export function CoursesView() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    api.getTeachers().then(setTeachers).catch(console.error);
  }, []);

  const courses = teachers.map((t, i) => ({
    title: t.sub || 'Class',
    code: t.cls,
    instructor: t.name,
    enrollments: 0,   // no enrollment count in current schema
    progress: 0,
    color: COLOR_CYCLE[i % COLOR_CYCLE.length],
  }));

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Courses</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">{teachers.length} active classes this semester</p>
        </div>
        <button className="flex items-center gap-2 bg-s900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-sm">
          <Plus size={16} /> New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiItem title="Active Courses" mtc="blue" value={teachers.length} trend="This term" icon={<Layers/>} />
        <KpiItem title="Enrollments" mtc="green" value="N/A" trend="No schema yet" icon={<Users/>} />
        <KpiItem title="Avg Completion" mtc="purple" value="N/A" trend="No schema yet" icon={<TrendingUp/>} />
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-s400 font-mono text-sm">Loading courses…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((c, i) => (
            <CourseCard key={i} {...c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ title, code, instructor, enrollments, progress, color }: any) {
  const colors: any = {
    'blue': { bg: 'bg-blue-50', text: 'text-blue-600', fill: 'bg-blue-500' },
    'purple': { bg: 'bg-purple-50', text: 'text-purple-600', fill: 'bg-purple-500' },
    'green': { bg: 'bg-green-50', text: 'text-green-600', fill: 'bg-green-500' },
    'orange': { bg: 'bg-orange-50', text: 'text-orange-600', fill: 'bg-orange-500' },
    'cyan': { bg: 'bg-cyan-50', text: 'text-cyan-600', fill: 'bg-cyan-500' },
    'pink': { bg: 'bg-pink-50', text: 'text-pink-600', fill: 'bg-pink-500' },
  };
  const t = colors[color] || colors.blue;

  return (
    <div className="bg-white border border-s200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col group">
      <div className="flex justify-between items-start mb-4">
         <div className={`w-12 h-12 rounded-xl ${t.bg} ${t.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
           <BookOpen size={24} />
         </div>
         <span className="font-mono text-[10px] bg-s100 text-s600 px-2 py-1 rounded border border-s200">{code}</span>
      </div>
      
      <h3 className="font-serif font-bold text-lg text-s900 tracking-tight leading-tight mb-1">{title}</h3>
      <p className="text-[11px] text-s500 uppercase tracking-wide font-semibold mb-6">By {instructor}</p>

      <div className="mt-auto">
        <div className="flex justify-between items-center text-[10px] font-bold text-s500 mb-2 font-mono uppercase">
          <span className="flex items-center gap-1"><Users size={12} className="text-s400"/> {enrollments} Students</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-s100 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full ${t.fill}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
