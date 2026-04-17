import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  Users, UserCheck, BookOpen, Clock, 
  Settings, Bell, Search, Menu, PenTool,
  LayoutDashboard, School
} from 'lucide-react';

import { DashboardView } from './views/DashboardView';
import { TeachersView } from './views/TeachersView';
import { AnalyticsView } from './views/AnalyticsView';
import { ParentsView } from './views/ParentsView';
import { TimetableView } from './views/TimetableView';
import { CoursesView } from './views/CoursesView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';

function PageLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-white md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden md:rounded-2xl border border-s200 shadow-2xl relative w-full bg-s50">
        
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* SIDEBAR */}
        <div className={`
          absolute z-50 md:relative md:translate-x-0 top-0 left-0 h-full w-[210px] 
          bg-navy flex flex-col transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center gap-3 py-5 px-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFAA6E] to-accent flex items-center justify-center shrink-0">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-headline text-lg tracking-widest text-white leading-none">NOTIVO</div>
              <div className="font-mono text-[8px] text-[#FFAA6E] tracking-[0.2em] mt-1">PRO ARCH</div>
            </div>
          </div>
          
          <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
            <SidebarLink to="/" icon={<LayoutDashboard size={16}/>} label="Dashboard" />
            <SidebarLink to="/parents" icon={<UserCheck size={16}/>} label="Parents" />
            <SidebarLink to="/teachers" icon={<BookOpen size={16}/>} label="Teachers" />
            <SidebarLink to="/timetable" icon={<Clock size={16}/>} label="Timetable" />
            <SidebarLink to="/courses" icon={<BookOpen size={16}/>} label="Courses" />
            <SidebarLink to="/notifications" icon={<Bell size={16}/>} label="Alerts" badge="5" />
            <SidebarLink to="/settings" icon={<Settings size={16}/>} label="Settings" />
            <div className="h-px bg-white/10 my-2 mx-2" />
            <SidebarLink to="/analytics" icon={<PenTool size={16}/>} label="Pen Analytics" badge="NEW" activeBadge />
          </nav>

          <div className="border-t border-white/10 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-bold shrink-0">SA</div>
            <div>
              <div className="text-xs font-semibold text-s100">Super Admin</div>
              <div className="text-[10px] text-s500">CTO Dashboard</div>
            </div>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 flex flex-col min-w-0 bg-s50 z-0 h-full">
          <header className="bg-white border-b border-s200 p-3 lg:px-5 flex items-center gap-3 shrink-0 z-10 sticky top-0">
            <button className="w-[34px] h-[34px] rounded-lg bg-s50 border border-s200 flex items-center justify-center md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="relative flex-1 max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-s400" />
              <input type="text" placeholder="Search school records..." className="w-full py-2 pr-3 pl-8 bg-s50 border border-s200 rounded-lg text-xs outline-none focus:border-accent" />
            </div>
            <div className="ml-auto flex items-center gap-4">
               <div className="text-[10px] font-mono text-s400 uppercase tracking-widest hidden lg:block">Notivo &copy; 2026</div>
               <div className="w-8 h-8 rounded-full bg-s100 border border-s200 flex items-center justify-center text-s700"><Settings size={14}/></div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, label, badge, activeBadge }: any) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
        ${isActive ? 'bg-accent text-white shadow-[0_4px_14px_rgba(244,123,32,0.35)]' : 'text-s400 hover:bg-white/5 hover:text-s200'}
      `}
    >
      <div className="shrink-0">{icon}</div>
      <span>{label}</span>
      {badge && (
        <span className={`ml-auto text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1
          ${activeBadge ? 'bg-accent text-white' : 'bg-red-500 text-white'}
        `}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PageLayout>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/parents" element={<ParentsView />} />
          <Route path="/teachers" element={<TeachersView />} />
          <Route path="/timetable" element={<TimetableView />} />
          <Route path="/courses" element={<CoursesView />} />
          <Route path="/notifications" element={<NotificationsView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageLayout>
    </BrowserRouter>
  );
}
