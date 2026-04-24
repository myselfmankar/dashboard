import { useEffect, useState } from 'react';
import { Check, AlertCircle, Info, Megaphone, Calendar } from 'lucide-react';
import { api } from '../api';
import type { Alert } from '../types';

export function NotificationsView() {
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    api.getAlerts().then(setRecentAlerts).catch(console.error);
  }, []);

  const notices = [
    { title: 'New Transport Routes', date: 'Oct 24, 2026', author: 'Transport Dept' },
    { title: 'Annual Day Practice Schedule', date: 'Oct 22, 2026', author: 'Cultural Cmte' },
    { title: 'Revised Library Timings', date: 'Oct 20, 2026', author: 'Librarian' },
  ];

  const events = [
    { event: 'Inter-school Science Fair', date: 'Oct 28', type: 'Academic' },
    { event: 'Parent-Teacher Meeting', date: 'Nov 02', type: 'Admin' },
    { event: 'Diwali Holidays Begin', date: 'Nov 05', type: 'Holiday' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Notifications</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">{recentAlerts.length} active alerts</p>
        </div>
        <button className="flex items-center gap-2 bg-s100 text-s700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-s200 transition-colors shadow-sm">
          <Check size={16} /> Mark All Read
        </button>
      </div>

      <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm overflow-hidden">
         <div className="mb-6 border-b border-s100 pb-4">
           <h3 className="font-serif text-lg font-bold text-s800 tracking-tight">Recent Alerts</h3>
           <p className="text-xs text-s500">Live pen-session intelligence from Notivo</p>
         </div>
         
         <div className="flex flex-col gap-3">
           {recentAlerts.length === 0 ? (
             <div className="text-center py-8 text-s400 font-mono text-xs">No alerts at this time</div>
           ) : recentAlerts.map((a) => (
             <div key={a.id} className={`flex items-start gap-4 p-4 rounded-xl border-l-4 bg-red-50 border-red-500 border-t-0 border-r-0 border-b-0`}>
               <div className="mt-0.5"><AlertCircle className="text-red-500"/></div>
               <div className="flex-1">
                 <div className="flex justify-between items-center mb-1">
                   <h4 className="text-xs font-bold text-s900">{a.studentName}</h4>
                   <span className="text-[10px] font-mono text-s400 uppercase">
                     {a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''}
                   </span>
                 </div>
                 <p className="text-[11px] text-s600">{a.issue}</p>
                 <p className="text-[10px] font-mono text-s400 mt-1 uppercase tracking-widest">{a.context}</p>
               </div>
             </div>
           ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Notice Board */}
         <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-s100 pb-4">
              <Megaphone className="text-accent" size={20} />
              <div>
                <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Notice Board</h3>
                <p className="text-xs text-s500 mt-1">School-wide announcements</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
               {notices.map((n, i) => (
                 <div key={i} className="flex flex-col border-b border-s100 border-dashed pb-3 last:border-0 last:pb-0">
                    <h4 className="text-xs font-bold text-s800 mb-1">{n.title}</h4>
                    <div className="flex justify-between items-center text-[10px] text-s500 uppercase tracking-widest font-mono">
                      <span>{n.date}</span>
                      <span>By {n.author}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Upcoming Events */}
         <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <div className="flex items-center gap-2 mb-6 border-b border-s100 pb-4">
              <Calendar className="text-accent" size={20} />
              <div>
                <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Upcoming Events</h3>
                <p className="text-xs text-s500 mt-1">Next 7 days</p>
              </div>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-s200">
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest pl-2">Event</th>
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Date</th>
                  <th className="font-mono text-[10px] text-s400 uppercase pb-2 font-normal tracking-widest">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-s100 text-xs">
                {events.map((e, i) => (
                  <tr key={i} className="hover:bg-s50 transition-colors">
                    <td className="py-2.5 pl-2 font-bold text-s800">{e.event}</td>
                    <td className="py-2.5 text-s600 font-mono text-[10px] uppercase">{e.date}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border
                        ${e.type === 'Academic' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                          e.type === 'Admin' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          'bg-green-50 text-green-600 border-green-200'}
                      `}>{e.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
