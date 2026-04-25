import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function KpiItem({ title, value, trend, icon, mtc, isDown, onClick }: any) {
  const themes: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    orange: "bg-orange-50 border-orange-200 text-accent",
    pink: "bg-rose-50 border-rose-200 text-rose-600",
    red: "bg-red-50 border-red-200 text-red-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
  };
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className="glass-card p-4 hover:shadow-xl transition-all group cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-2xl mb-4 flex items-center justify-center ${themes[mtc] || themes.blue}`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className="text-2xl font-headline tracking-tighter text-s900">{value}</div>
      <div className="text-[10px] font-mono text-s500 uppercase tracking-widest mt-1">{title}</div>
      <div className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${isDown ? 'text-red-500' : 'text-green-500'}`}>
        {isDown ? <TrendingDown size={10}/> : <TrendingUp size={10}/>}
        {trend}
      </div>
    </div>
  );
}
