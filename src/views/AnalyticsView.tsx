import { useEffect, useState } from 'react';
import { api } from '../api';
import { Sparkles, AlertTriangle, AlertCircle, BarChart as BarChartIcon, MonitorPlay } from 'lucide-react';
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

export function AnalyticsView() {
  const [concepts, setConcepts] = useState<any[]>([]);

  const allStudents = [...hmStudents, ...hmStudents.slice(0, 8)];

  useEffect(() => {
    api.getWeakConcepts().then(setConcepts).catch(console.error);
  }, []);

  const teachersPerf = [
    { name: 'Dr. Amara Singh', issues: 12, total: 35, avgScore: 68 },
    { name: 'Mr. Leon Carter', issues: 8, total: 32, avgScore: 74 },
    { name: 'Ms. Priya Mehta', issues: 5, total: 30, avgScore: 79 },
    { name: 'Mr. James Okafor', issues: 3, total: 28, avgScore: 82 },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Pen Analytics</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">School-wide smart pen intelligence • Sample data</p>
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

      {/* Analytics KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiItem title="AT-RISK STUDENTS" mtc="red" value="12" trend="Need immediate attention" icon={<AlertTriangle/>} isDown />
        <KpiItem title="NEEDING ATTENTION" mtc="amber" value="42" trend="Hesitation above baseline" icon={<AlertCircle/>} isDown />
        <KpiItem title="AVG CLASS SCORE" mtc="blue" value="71%" trend="Across all tracked classes" icon={<BarChartIcon/>} />
        <KpiItem title="ACTIVE SESSIONS" mtc="green" value="5" trend="Classes using smart pens today" icon={<MonitorPlay/>} />
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Teacher Class Performance */}
        <div className="lg:col-span-3 bg-white border border-s200 rounded-2xl p-6 shadow-sm">
           <div className="mb-6">
             <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Teacher Class Performance</h3>
             <p className="text-xs text-s500 mt-1">Ranked by at-risk student count • Today</p>
           </div>
           
           <div className="flex flex-col gap-4">
             {teachersPerf.map((t, i) => (
               <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-s100 bg-s50 gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {t.name.split(' ').map(n=>n[0]).join('').replace('.','')}
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
           
           <div className="flex flex-col gap-3 flex-1">
             {concepts.slice(0,4).map((c, i) => (
               <div key={i}>
                 <div className="flex justify-between text-xs font-bold text-s700 mb-1">
                   <span>{c.topic}</span>
                   <span className="text-orange-600">{c.score}% Error Rate</span>
                 </div>
                 <div className="w-full bg-orange-50 h-2 rounded-full overflow-hidden">
                   <div className="bg-orange-500 h-full rounded-full" style={{ width: `${c.score}%` }} />
                 </div>
               </div>
             ))}
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

      {/* School Wide Student Heatmap */}
      <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-s100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">School-wide Student Heatmap</h3>
              <p className="text-xs text-s500 mt-1">All tracked students • Sample data</p>
            </div>
            
            <div className="flex gap-4 text-[10px] font-mono text-s500 flex-wrap">
               <span className="flex items-center"><div className="w-2.5 h-2.5 bg-green-100 border border-green-200 rounded-sm mr-1.5"/>On Track</span>
               <span className="flex items-center"><div className="w-2.5 h-2.5 bg-yellow-100 border border-yellow-200 rounded-sm mr-1.5"/>Watch</span>
               <span className="flex items-center"><div className="w-2.5 h-2.5 bg-orange-100 border border-orange-200 rounded-sm mr-1.5"/>Needs Help</span>
               <span className="flex items-center"><div className="w-2.5 h-2.5 bg-red-100 border border-red-200 rounded-sm mr-1.5"/>At Risk</span>
               <span className="flex items-center"><div className="w-2.5 h-2.5 bg-red-500 border border-red-600 rounded-sm mr-1.5"/>Critical</span>
            </div>
         </div>

         <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
           {allStudents.map((s, i) => {
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

      </div>

    </div>
  );
}
