import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  UserCheck, BookOpen, Clock, 
  Settings, Bell, Menu,
  LayoutDashboard, School, Users, GraduationCap, ShieldCheck
} from 'lucide-react';

import { TeachersView } from './views/TeachersView';
import { AdminView } from './views/AdminView';
import { ParentsView } from './views/ParentsView';
import { TimetableView } from './views/TimetableView';
import { CoursesView } from './views/CoursesView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { AuthContext } from './context/AuthContext';
import { firebaseAuth } from './firebase';
import { firestore } from './firebase';
import { setApiConfig, api } from './api';
import type { UserRole, AuthUser } from './types';

// ── Role-based navigation config ──
interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  activeBadge?: boolean;
}

function getNavItems(role: UserRole, alertCount: number): NavItem[] {
  const alertBadge = alertCount > 0 ? (alertCount > 99 ? '99+' : String(alertCount)) : undefined;
  const common: NavItem[] = [
    { to: '/notifications', icon: <Bell size={16}/>, label: 'Alerts', badge: alertBadge },
    { to: '/settings', icon: <Settings size={16}/>, label: 'Settings' },
  ];

  switch (role) {
    case 'admin':
      return [
        { to: '/', icon: <ShieldCheck size={16}/>, label: 'Admin', badge: 'NEW', activeBadge: true },
        { to: '/parents', icon: <UserCheck size={16}/>, label: 'Parents' },
        { to: '/teachers', icon: <BookOpen size={16}/>, label: 'Teachers' },
        { to: '/timetable', icon: <Clock size={16}/>, label: 'Timetable' },
        { to: '/courses', icon: <BookOpen size={16}/>, label: 'Courses' },
        ...common,
      ];
    case 'teacher':
      return [
        { to: '/', icon: <LayoutDashboard size={16}/>, label: 'My Classes' },
        { to: '/students', icon: <Users size={16}/>, label: 'Students' },
        { to: '/timetable', icon: <Clock size={16}/>, label: 'Timetable' },
        ...common,
      ];
    case 'parent':
      return [
        { to: '/', icon: <GraduationCap size={16}/>, label: 'My Children' },
        ...common,
      ];
  }
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Super Admin',
  teacher: 'Teacher',
  parent: 'Parent',
};

const ROLE_INITIALS: Record<UserRole, string> = {
  admin: 'SA',
  teacher: 'TC',
  parent: 'PA',
};

function PageLayout({ children, onLogout, role }: { children: React.ReactNode, onLogout: () => void, role: UserRole }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.getAlerts()
      .then((alerts) => { if (!cancelled) setAlertCount(alerts.length); })
      .catch(() => { /* badge stays at 0 on error */ });
    return () => { cancelled = true; };
  }, []);

  const navItems = getNavItems(role, alertCount);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden md:rounded-[32px] glass-panel relative w-full">
        
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* SIDEBAR */}
        <div
          className={`
          absolute z-50 md:relative md:translate-x-0 top-0 left-0 h-full w-[210px]
          backdrop-blur-2xl flex flex-col transition-transform duration-300 ease-in-out border-r border-white/10
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
          style={{
            // Deep midnight base with a warm Notivo-orange glow bleeding from
            // top-left and bottom-right — keeps text legible while shaking off
            // the flat-black SaaS feel.
            backgroundImage: [
              'radial-gradient(120% 60% at 0% 0%, rgba(244,123,32,0.22), transparent 60%)',
              'radial-gradient(90% 50% at 100% 100%, rgba(244,123,32,0.16), transparent 65%)',
              'linear-gradient(180deg, #1f1208 0%, #18120e 45%, #120a05 100%)',
            ].join(', '),
          }}
        >
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
            {navItems.map((item) => (
              <React.Fragment key={item.to + item.label}>
                <SidebarLink {...item} />
              </React.Fragment>
            ))}
          </nav>

          <div 
            className="border-t border-white/10 p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={onLogout}
            title="Click to Logout"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-lg shadow-accent/20">{ROLE_INITIALS[role]}</div>
            <div>
              <div className="text-xs font-semibold text-s100">{ROLE_LABELS[role]}</div>
              <div className="text-[10px] text-s500 uppercase tracking-widest font-mono">Sign Out</div>
            </div>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent z-0 h-full">
          <header className="bg-white/40 backdrop-blur-md border-b border-white/40 p-3 lg:px-5 flex items-center gap-3 shrink-0 z-10 sticky top-0">
            <button className="w-[34px] h-[34px] rounded-lg bg-s50 border border-s200 flex items-center justify-center md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="ml-auto flex items-center gap-4">
               <div className="text-[10px] font-mono text-s400 uppercase tracking-widest hidden lg:block">Notivo &copy; {new Date().getFullYear()}</div>
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

function SidebarLink({ to, icon, label, badge, activeBadge }: NavItem) {
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

// ── Role-based route configs ──
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminView />} />
      <Route path="/parents" element={<ParentsView />} />
      <Route path="/teachers" element={<TeachersView />} />
      <Route path="/timetable" element={<TimetableView />} />
      <Route path="/courses" element={<CoursesView />} />
      <Route path="/notifications" element={<NotificationsView />} />
      <Route path="/settings" element={<SettingsView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function TeacherRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TeachersView />} />
      <Route path="/students" element={<TeachersView />} />
      <Route path="/timetable" element={<TimetableView />} />
      <Route path="/notifications" element={<NotificationsView />} />
      <Route path="/settings" element={<SettingsView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ParentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ParentsView />} />
      <Route path="/notifications" element={<NotificationsView />} />
      <Route path="/settings" element={<SettingsView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RoleRoutes({ role }: { role: UserRole }) {
  switch (role) {
    case 'admin': return <AdminRoutes />;
    case 'teacher': return <TeacherRoutes />;
    case 'parent': return <ParentRoutes />;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [role, setRole] = useState<UserRole>('teacher');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole('teacher');
        setIsAuthenticated(false);
        return;
      }

      // Resolve role from Firestore users/{uid} doc. Default to 'teacher' if missing.
      let resolvedRole: UserRole = 'teacher';
      let resolvedName = firebaseUser.displayName || firebaseUser.email || '';
      try {
        const snap = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data() as { role?: UserRole; fullName?: string; displayName?: string; name?: string; email?: string; instituteId?: string };
          const firestoreRole = data.role;
          if (firestoreRole === 'admin' || firestoreRole === 'teacher' || firestoreRole === 'parent') {
            resolvedRole = firestoreRole;
          } else {
            // Temporary path: no role field yet — check VITE_ADMIN_EMAILS env var.
            const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
              .split(',')
              .map((e: string) => e.trim().toLowerCase())
              .filter(Boolean);
            const userEmail = (data.email || firebaseUser.email || '').toLowerCase();
            if (userEmail && adminEmails.includes(userEmail)) {
              resolvedRole = 'admin';
            }
          }
          // Set institute scope for all API calls
          if (data.instituteId) setApiConfig({ instituteId: data.instituteId });
          // Resolve display name: fullName > displayName > name
          resolvedName = data.fullName || data.displayName || data.name || resolvedName;
        }
      } catch (err) {
        console.warn('Failed to load user role from Firestore, defaulting to teacher.', err);
      }

      setRole(resolvedRole);
      setUser({
        uid: firebaseUser.uid,
        name: resolvedName || ROLE_LABELS[resolvedRole],
        role: resolvedRole,
      });
      setIsAuthenticated(true);
    });

    return unsubscribe;
  }, []);

  const handleLogin = (_loginRole: UserRole) => {
    // Role is now authoritative from Firestore; no-op kept for AuthContext compatibility.
  };

  const handleLogout = async () => {
    await signOut(firebaseAuth);
  };

  const authValue = useMemo(() => ({
    user,
    role,
    login: handleLogin,
    logout: handleLogout,
  }), [user, role]);

  if (isAuthenticated === null) return null;

  return (
    <AuthContext.Provider value={authValue}>
      <HashRouter>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginView />
            } 
          />
          
          <Route 
            path="/*" 
            element={
              isAuthenticated ? (
                <PageLayout onLogout={handleLogout} role={role}>
                  <RoleRoutes role={role} />
                </PageLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}
