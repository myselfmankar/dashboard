import { useEffect, useMemo, useState } from 'react';
import {
  Settings as SettingsIcon, Shield, GraduationCap, Database,
  Bell, Trash2, Check, LogOut, User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Pref keys ────────────────────────────────────────────────────────────────
const NOTIF_PREFS_KEY = 'notivo.notifPrefs.v1';
const APP_PREFS_KEY = 'notivo.appPrefs.v1';
const AI_CACHE_PREFIX = 'notivo.ai.v1:';

interface NotifPrefs {
  severities: { critical: boolean; warning: boolean; info: boolean };
  sound: boolean;
  desktop: boolean;
  digest: 'instant' | 'hourly' | 'daily';
}

interface AppPrefs {
  density: 'comfortable' | 'compact';
  reduceMotion: boolean;
  numericFormat: 'percent' | 'absolute';
}

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  severities: { critical: true, warning: true, info: true },
  sound: true,
  desktop: false,
  digest: 'instant',
};

const DEFAULT_APP_PREFS: AppPrefs = {
  density: 'comfortable',
  reduceMotion: false,
  numericFormat: 'percent',
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function countAiCacheEntries(): number {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(AI_CACHE_PREFIX)) n++;
  }
  return n;
}

function clearAiCache(): number {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(AI_CACHE_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
  return keys.length;
}

export function SettingsView() {
  const { user, role, logout } = useAuth();
  const [notif, setNotif] = useState<NotifPrefs>(() => loadJSON(NOTIF_PREFS_KEY, DEFAULT_NOTIF_PREFS));
  const [appPrefs, setAppPrefs] = useState<AppPrefs>(() => loadJSON(APP_PREFS_KEY, DEFAULT_APP_PREFS));
  const [cacheCount, setCacheCount] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => { setCacheCount(countAiCacheEntries()); }, []);
  useEffect(() => { saveJSON(NOTIF_PREFS_KEY, notif); }, [notif]);
  useEffect(() => { saveJSON(APP_PREFS_KEY, appPrefs); }, [appPrefs]);

  // Show a transient confirmation toast on save events.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1800);
    return () => clearTimeout(t);
  }, [flash]);

  const initials = useMemo(() => {
    const n = user?.name ?? role;
    return n.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }, [user, role]);

  const handleClearCache = () => {
    const removed = clearAiCache();
    setCacheCount(0);
    setFlash(`Cleared ${removed} cached AI insight${removed === 1 ? '' : 's'}.`);
  };

  const requestDesktopPermission = async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      setNotif({ ...notif, desktop: true });
      return;
    }
    const result = await Notification.requestPermission();
    setNotif({ ...notif, desktop: result === 'granted' });
    if (result === 'granted') setFlash('Desktop notifications enabled.');
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Settings</h1>
          <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">Preferences saved to this device</p>
        </div>
        {flash && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-mono uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
            <Check size={12} /> {flash}
          </div>
        )}
      </div>

      {/* Profile card */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-base font-bold shadow-lg shadow-accent/20">
          {initials || <UserIcon size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-s400">Signed in as</div>
          <div className="font-serif text-lg font-bold text-s900 truncate">{user?.name ?? 'Guest'}</div>
          <div className="text-xs text-s500 capitalize">{role}{user?.uid ? ` \u00b7 ${user.uid.slice(0, 8)}…` : ''}</div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-s700 bg-s50 hover:bg-s100 border border-s200 transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="glass-card p-6">
          <SectionHeader icon={<Bell size={20} className="text-accent" />} title="Notifications" />
          <div className="flex flex-col gap-5">
            <SettingRow label="Critical alerts" desc="At-risk students &amp; system warnings">
              <Toggle
                isOn={notif.severities.critical}
                onClick={() => setNotif({ ...notif, severities: { ...notif.severities, critical: !notif.severities.critical } })}
              />
            </SettingRow>
            <SettingRow label="Warning alerts" desc="Student needing attention">
              <Toggle
                isOn={notif.severities.warning}
                onClick={() => setNotif({ ...notif, severities: { ...notif.severities, warning: !notif.severities.warning } })}
              />
            </SettingRow>
            <SettingRow label="Info alerts" desc="General activity updates">
              <Toggle
                isOn={notif.severities.info}
                onClick={() => setNotif({ ...notif, severities: { ...notif.severities, info: !notif.severities.info } })}
              />
            </SettingRow>
            <SettingRow label="Sound on new alert" desc="Play a chime in-app">
              <Toggle isOn={notif.sound} onClick={() => setNotif({ ...notif, sound: !notif.sound })} />
            </SettingRow>
            <SettingRow label="Desktop notifications" desc={notif.desktop ? 'Enabled in this browser' : 'Browser permission required'}>
              <Toggle
                isOn={notif.desktop}
                onClick={() => (notif.desktop
                  ? setNotif({ ...notif, desktop: false })
                  : void requestDesktopPermission())}
              />
            </SettingRow>
            <SettingRow label="Digest frequency" desc="Group non-critical alerts">
              <SegmentedControl
                value={notif.digest}
                options={[
                  { value: 'instant', label: 'Instant' },
                  { value: 'hourly',  label: 'Hourly' },
                  { value: 'daily',   label: 'Daily' },
                ]}
                onChange={(v) => setNotif({ ...notif, digest: v as NotifPrefs['digest'] })}
              />
            </SettingRow>
          </div>
        </div>

        {/* Appearance & UX */}
        <div className="glass-card p-6">
          <SectionHeader icon={<SettingsIcon size={20} className="text-accent" />} title="Appearance" />
          <div className="flex flex-col gap-5">
            <SettingRow label="Layout density" desc="Spacing for tables &amp; cards">
              <SegmentedControl
                value={appPrefs.density}
                options={[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'compact',     label: 'Compact' },
                ]}
                onChange={(v) => setAppPrefs({ ...appPrefs, density: v as AppPrefs['density'] })}
              />
            </SettingRow>
            <SettingRow label="Reduce motion" desc="Less animation on page changes">
              <Toggle
                isOn={appPrefs.reduceMotion}
                onClick={() => setAppPrefs({ ...appPrefs, reduceMotion: !appPrefs.reduceMotion })}
              />
            </SettingRow>
            <SettingRow label="Score format" desc="How class scores display">
              <SegmentedControl
                value={appPrefs.numericFormat}
                options={[
                  { value: 'percent',  label: 'Percent' },
                  { value: 'absolute', label: 'Score' },
                ]}
                onChange={(v) => setAppPrefs({ ...appPrefs, numericFormat: v as AppPrefs['numericFormat'] })}
              />
            </SettingRow>
          </div>
        </div>

        {/* AI cache */}
        <div className="glass-card p-6">
          <SectionHeader icon={<Database size={20} className="text-accent" />} title="Notivo AI Cache" />
          <p className="text-xs text-s500 mb-5 leading-relaxed">
            Personalised insights are generated once per student and cached locally so subsequent
            views are instant and free.
          </p>
          <div className="flex items-center justify-between p-4 rounded-xl bg-s50 border border-s200 mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-s400 mb-0.5">Cached insights</div>
              <div className="font-serif text-2xl font-bold text-s900 leading-none">{cacheCount}</div>
            </div>
            <button
              onClick={handleClearCache}
              disabled={cacheCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
            >
              <Trash2 size={14} /> Clear cache
            </button>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-s400">
            Storage: localStorage &middot; key prefix <code className="text-s600 normal-case">{AI_CACHE_PREFIX}</code>
          </div>
        </div>

        {/* Academic context (read-only display from auth/api) */}
        <div className="glass-card p-6">
          <SectionHeader icon={<GraduationCap size={20} className="text-accent" />} title="Academic" />
          <div className="flex flex-col gap-5">
            <SettingRow label="Current Academic Year" desc="Active session">
              <span className="text-xs font-bold text-accent font-mono uppercase tracking-widest bg-orange-50 px-2 py-1 rounded">2025-26</span>
            </SettingRow>
            <SettingRow label="Grading System" desc="Marks evaluation">
              <span className="text-xs font-bold text-s800 font-mono">Percentage</span>
            </SettingRow>
            <SettingRow label="Institute ID" desc="Platform identifier">
              <span className="text-xs font-bold text-s800 font-mono">inst_001</span>
            </SettingRow>
            <SettingRow label="Role" desc="Determines what you can view">
              <span className="text-xs font-bold text-s800 font-mono uppercase tracking-widest bg-s100 px-2 py-1 rounded">{role}</span>
            </SettingRow>
          </div>
        </div>

        {/* Security (read-only) */}
        <div className="glass-card p-6 md:col-span-2">
          <SectionHeader icon={<Shield size={20} className="text-accent" />} title="Security" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SettingRow label="Session" desc="Authentication backend">
              <span className="text-xs font-bold text-s800 font-mono">Firebase Auth</span>
            </SettingRow>
            <SettingRow label="Data residency" desc="Where your data lives">
              <span className="text-xs font-bold text-s800 font-mono">asia-south1</span>
            </SettingRow>
            <SettingRow label="Read access" desc="Granted by role + institute">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-green-50 text-green-700 border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
              </span>
            </SettingRow>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Building blocks ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-6 border-b border-s100 pb-4">
      {icon}
      <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">{title}</h3>
    </div>
  );
}

function SettingRow({
  label, desc, children,
}: {
  label: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-4 group">
      <div className="min-w-0">
        <div className="text-xs font-bold text-s900 transition-colors group-hover:text-accent">{label}</div>
        <div className="text-[10px] text-s500 mt-0.5">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ isOn, onClick }: { isOn: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={onClick}
      className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-colors duration-300 ${isOn ? 'bg-accent' : 'bg-s200'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isOn ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function SegmentedControl<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center bg-s100 rounded-lg p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
            value === opt.value
              ? 'bg-white text-s900 shadow-sm'
              : 'text-s500 hover:text-s700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
