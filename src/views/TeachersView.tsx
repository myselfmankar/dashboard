import { useState } from 'react';
import { BookOpen, Users, TrendingUp, ClipboardList } from 'lucide-react';
import { KpiItem } from '../components/KpiItem';

const hmStudents = [
  {name:"Aarav S.",risk:0,score:91},
  {name:"Priya M.",risk:0,score:88},
  {name:"Riya K.",risk:1,score:82},
  {name:"Aryan P.",risk:1,score:80},
  {name:"Sneha D.",risk:1,score:79},
  {name:"Kabir L.",risk:1,score:77},
  {name:"Ananya R.",risk:2,score:71},
  {name:"Vivaan T.",risk:2,score:68},
  {name:"Ishaan G.",risk:2,score:65},
  {name:"Meera J.",risk:2,score:63},
  {name:"Rahul V.",risk:3,score:55},
  {name:"Pooja B.",risk:3,score:52},
  {name:"Dev S.",risk:3,score:50},
  {name:"Nisha P.",risk:4,score:42},
  {name:"Rohan A.",risk:4,score:38},
  {name:"Tanya M.",risk:5,score:29},
  {name:"Kiran R.",risk:0,score:86},
  {name:"Sana Q.",risk:1,score:78},
  {name:"Aditya N.",risk:2,score:66},
  {name:"Diya C.",risk:0,score:93},
  {name:"Farhan I.",risk:3,score:53},
  {name:"Lavanya T.",risk:1,score:81},
  {name:"Mihir J.",risk:2,score:70},
  {name:"Natasha K.",risk:0,score:90},
  {name:"Om P.",risk:4,score:40},
  {name:"Preethi S.",risk:1,score:83},
  {name:"Rajat M.",risk:2,score:64},
  {name:"Shruti A.",risk:0,score:87},
  {name:"Tejas R.",risk:3,score:51},
  {name:"Usha N.",risk:1,score:76},
  {name:"Zara K.",risk:5,score:31},
  {name:"Veer S.",risk:2,score:67},
];

export function TeachersView() {
  const [data] = useState({
    kpis: {
      myClasses: 6,
      attendanceRate: '94%',
      avgScore: '78%',
      pendingReviews: 3
    }
  });

  return (
    <div className="flex gap-6 h-full p-4 lg:p-0">
      {/* LEFT/MAIN LAYER */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-[#FFE8D0] to-white border border-[#FFD4A8] rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <h2 className="text-3xl font-headline tracking-wide text-s900 mb-2">Welcome Back, <span className="text-accent font-serif italic">Tiana!</span></h2>
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

        {/* Teacher KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiItem title="My Classes" mtc="blue" value={data.kpis.myClasses} trend="This term" icon={<BookOpen/>} />
          <KpiItem title="Attendance Rate" mtc="green" value={data.kpis.attendanceRate} trend="Above avg" icon={<Users/>} />
          <KpiItem title="Avg Score" mtc="purple" value={data.kpis.avgScore} trend="+3% vs last" icon={<TrendingUp/>} />
          <KpiItem title="Pending Reviews" mtc="amber" value={data.kpis.pendingReviews} trend="Action needed" icon={<ClipboardList/>} isDown />
        </div>

        {/* Heatmap & Alerts */}
        <div className="bg-white border border-s200 rounded-2xl p-5 shadow-sm">
           <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-s800 tracking-tight">Class Struggle Heatmap</h3>
                <p className="text-[10px] font-mono text-s400 uppercase mt-1">Real-time pen behaviour • Grade 10-A • Mathematics • Today <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full ml-2">LIVE</span></p>
              </div>
           </div>
           
           <div className="flex gap-4 mb-4 text-[10px] font-mono text-s500">
             <span className="flex items-center"><div className="w-2.5 h-2.5 bg-green-100 border border-green-200 rounded-sm mr-1.5"/>On Track</span>
             <span className="flex items-center"><div className="w-2.5 h-2.5 bg-yellow-100 border border-yellow-200 rounded-sm mr-1.5"/>Watch</span>
             <span className="flex items-center"><div className="w-2.5 h-2.5 bg-orange-100 border border-orange-200 rounded-sm mr-1.5"/>Needs Help</span>
             <span className="flex items-center"><div className="w-2.5 h-2.5 bg-red-100 border border-red-200 rounded-sm mr-1.5"/>At Risk</span>
             <span className="flex items-center"><div className="w-2.5 h-2.5 bg-red-500 border border-red-600 rounded-sm mr-1.5"/>Critical</span>
           </div>

           <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 grid grid-cols-5 sm:grid-cols-8 gap-1">
                 {hmStudents.map((s, i) => {
                   let baseStyles = "w-full aspect-square rounded-md border flex flex-col justify-center items-center hover:brightness-95 transition-all cursor-pointer shadow-sm relative overflow-hidden";
                   let colorStyles = "";
                   let nameColor = "";
                   let scoreColor = "";

                   switch(s.risk) {
                     case 0:
                       colorStyles = "bg-green-100 border-green-200";
                       nameColor = "text-green-800";
                       scoreColor = "text-green-700 bg-green-200/50";
                       break;
                     case 1:
                       colorStyles = "bg-yellow-100 border-yellow-200";
                       nameColor = "text-yellow-800";
                       scoreColor = "text-yellow-700 bg-yellow-200/50";
                       break;
                     case 2:
                       colorStyles = "bg-orange-100 border-orange-200";
                       nameColor = "text-orange-800";
                       scoreColor = "text-orange-700 bg-orange-200/50";
                       break;
                     case 3:
                       colorStyles = "bg-red-100 border-red-200 font-bold";
                       nameColor = "text-red-800";
                       scoreColor = "text-red-700 bg-red-200/50";
                       break;
                     case 4:
                     case 5:
                       colorStyles = "bg-red-500 border-red-600 font-bold animate-pulse text-white shadow-md shadow-red-500/20";
                       nameColor = "text-white";
                       scoreColor = "text-red-100 bg-red-600/50";
                       break;
                     default:
                       colorStyles = "bg-green-100 border-green-200";
                   }
                   
                   return (
                     <div key={i} className={`${baseStyles} ${colorStyles}`}>
                       <div className={`text-[10px] md:text-[11px] font-bold leading-none mb-1 ${nameColor}`}>
                         {s.name.split(' ')[0]}
                       </div>
                       <div className={`text-[8px] md:text-[9px] font-mono tracking-widest uppercase px-1 rounded-sm ${scoreColor}`}>
                         {s.score}%
                       </div>
                     </div>
                   )
                 })}
              </div>

              <div className="w-full md:w-[280px] flex flex-col gap-4">
                 <div className="bg-s50 border border-s100 rounded-xl p-4 flex-1 flex flex-col justify-center items-center text-center text-xs text-s400">
                    Click any student cell to view pen analytics
                 </div>
                 <div>
                    <div className="text-[10px] font-mono text-s400 uppercase tracking-widest mb-2 border-b border-s100 pb-1">Live Alert Feed</div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs shadow-sm">
                      <div className="font-bold text-s900 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Tanya M.
                      </div>
                      <div className="text-[11px] text-s600 mt-1 leading-snug">9m 40s hesitation. Writing speed ↓ 88%.</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* RIGHT PANEL - CALENDAR/TASKS */}
      <div className="hidden xl:flex flex-col w-[280px] shrink-0 gap-6 border-l border-s200 pl-6 h-full overflow-y-auto pb-6">
        
        {/* Calendar */}
        <div>
          <h3 className="font-serif text-lg font-bold text-s800 tracking-tight mb-3">Calendar</h3>
          <div className="bg-white border border-s200 rounded-xl p-4">
             <div className="flex justify-between items-center mb-4 text-xs font-bold text-s500">
               <button className="hover:text-accent">‹</button>
               <span>March 2026</span>
               <button className="hover:text-accent">›</button>
             </div>
             <div className="grid grid-cols-7 gap-y-2 text-center text-[10px]">
               {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d=><div key={d} className="font-mono text-s400">{d}</div>)}
               {Array.from({length: 6}).map((_,i)=><div key={`p-${i}`}/>)}
               {Array.from({length: 31}).map((_,i)=>(
                 <div key={i} className={`w-6 h-6 mx-auto flex flex-col justify-center items-center rounded-full font-bold
                    ${i+1===14 ? 'bg-accent text-white shadow-md' : [8,15,22].includes(i+1) ? 'text-accent bg-orange-50' : 'text-s600'}
                 `}>{i+1}</div>
               ))}
             </div>
          </div>
        </div>

        {/* Lessons */}
        <div>
           <div className="flex justify-between items-center mb-3">
             <h3 className="font-serif text-lg font-bold text-s800 tracking-tight">Lessons</h3>
             <span className="text-[10px] text-accent font-bold cursor-pointer">View all</span>
           </div>
           
           <div className="flex flex-col gap-3">
             <div className="bg-white border border-s200 rounded-xl p-3 flex gap-3 shadow-sm">
               <div className="w-1 bg-accent rounded-full shrink-0" />
               <div className="flex-1">
                 <div className="text-xs font-bold text-s800">Common English</div>
                 <div className="text-[10px] text-s400 mb-2">Thu 08 • 9:00 PM</div>
                 <div className="flex -space-x-2">
                   {['bg-purple-500','bg-blue-500','bg-green-500'].map((c,i)=>(
                     <div key={i} className={`w-5 h-5 rounded-full border border-white ${c} text-[8px] text-white flex items-center justify-center`}>AM</div>
                   ))}
                   <div className="w-5 h-5 rounded-full border border-white bg-s100 text-s500 text-[8px] flex items-center justify-center font-bold">+4</div>
                 </div>
               </div>
             </div>

             <div className="bg-white border border-s200 rounded-xl p-3 flex gap-3 shadow-sm">
               <div className="w-1 bg-amber-500 rounded-full shrink-0" />
               <div className="flex-1">
                 <div className="text-xs font-bold text-s800">Speaking Club</div>
                 <div className="text-[10px] text-s400 mb-2">Thu 08 • 11:00 PM</div>
                 <div className="flex -space-x-2">
                   {['bg-red-500','bg-cyan-500'].map((c,i)=>(
                     <div key={i} className={`w-5 h-5 rounded-full border border-white ${c} text-[8px] text-white flex items-center justify-center`}>LT</div>
                   ))}
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>

    </div>
  );
}
