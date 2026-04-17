import React, { useState } from 'react';
import { Settings, Shield, GraduationCap, Link2 } from 'lucide-react';

export function SettingsView() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    emailNotif: true,
    smsAlerts: false,
    autoAttendance: true,
    feeReminders: true,
    twoFactor: true,
    auditLogs: true,
    ipWhitelist: false,
    examVisible: true,
    resultPublish: false
  });

  const handleToggle = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-xl font-normal text-s900 tracking-widest font-headline uppercase">Settings</h1>
        <p className="text-[11px] text-s400 mt-1 font-mono uppercase tracking-widest">Manage platform preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* General */}
         <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-s100 pb-4">
              <Settings className="text-accent" size={20} />
              <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">General</h3>
            </div>
            
            <div className="flex flex-col gap-5">
               <SettingRow label="Email Notifications" desc="Receive alerts via email">
                 <Toggle isOn={toggles.emailNotif} onClick={() => handleToggle('emailNotif')} />
               </SettingRow>
               <SettingRow label="SMS Alerts" desc="Send SMS to parents">
                 <Toggle isOn={toggles.smsAlerts} onClick={() => handleToggle('smsAlerts')} />
               </SettingRow>
               <SettingRow label="Auto Attendance" desc="Mark from biometric data">
                 <Toggle isOn={toggles.autoAttendance} onClick={() => handleToggle('autoAttendance')} />
               </SettingRow>
               <SettingRow label="Fee Reminders" desc="Auto-remind on due dates">
                 <Toggle isOn={toggles.feeReminders} onClick={() => handleToggle('feeReminders')} />
               </SettingRow>
            </div>
         </div>

         {/* Security */}
         <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-s100 pb-4">
              <Shield className="text-accent" size={20} />
              <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Security</h3>
            </div>
            
            <div className="flex flex-col gap-5">
               <SettingRow label="Two-Factor Auth" desc="Extra login verification">
                 <Toggle isOn={toggles.twoFactor} onClick={() => handleToggle('twoFactor')} />
               </SettingRow>
               <SettingRow label="Session Timeout" desc="Auto-logout after idle">
                 <span className="text-xs font-bold text-s800 font-mono">30 min</span>
               </SettingRow>
               <SettingRow label="Audit Logs" desc="Track all admin actions">
                 <Toggle isOn={toggles.auditLogs} onClick={() => handleToggle('auditLogs')} />
               </SettingRow>
               <SettingRow label="IP Whitelisting" desc="Restrict admin access">
                 <Toggle isOn={toggles.ipWhitelist} onClick={() => handleToggle('ipWhitelist')} />
               </SettingRow>
            </div>
         </div>

         {/* Academic */}
         <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-s100 pb-4">
              <GraduationCap className="text-accent" size={20} />
              <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Academic</h3>
            </div>
            
            <div className="flex flex-col gap-5">
               <SettingRow label="Current Academic Year" desc="Active session">
                 <span className="text-xs font-bold text-accent font-mono uppercase tracking-widest bg-orange-50 px-2 py-1 rounded">2024-25</span>
               </SettingRow>
               <SettingRow label="Grading System" desc="Marks evaluation method">
                 <span className="text-xs font-bold text-s800 font-mono">CGPA (10-pt)</span>
               </SettingRow>
               <SettingRow label="Exam Schedule Visible" desc="Show to parents & students">
                 <Toggle isOn={toggles.examVisible} onClick={() => handleToggle('examVisible')} />
               </SettingRow>
               <SettingRow label="Result Publishing" desc="Auto-publish after review">
                 <Toggle isOn={toggles.resultPublish} onClick={() => handleToggle('resultPublish')} />
               </SettingRow>
            </div>
         </div>

         {/* Integrations */}
         <div className="bg-white border border-s200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-s100 pb-4">
              <Link2 className="text-accent" size={20} />
              <h3 className="font-serif text-lg font-bold text-s800 tracking-tight leading-none">Integrations</h3>
            </div>
            
            <div className="flex flex-col gap-5">
               <SettingRow label="Google Workspace" desc="Sync accounts & calendar">
                 <StatusBadge status="Connected" type="success" />
               </SettingRow>
               <SettingRow label="Zoom / Meet" desc="Virtual class integration">
                 <StatusBadge status="Connected" type="success" />
               </SettingRow>
               <SettingRow label="Payment Gateway" desc="Razorpay fee collection">
                 <StatusBadge status="Active" type="success" />
               </SettingRow>
               <SettingRow label="Biometric Sync" desc="Attendance hardware">
                 <StatusBadge status="Pending" type="warning" />
               </SettingRow>
            </div>
         </div>

      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string, desc: string, children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center group">
      <div>
        <div className="text-xs font-bold text-s900 transition-colors group-hover:text-accent">{label}</div>
        <div className="text-[10px] text-s500 mt-0.5">{desc}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ isOn, onClick }: { isOn: boolean, onClick: () => void }) {
  return (
    <div 
      className={`w-10 h-5 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${isOn ? 'bg-accent' : 'bg-s200'}`}
      onClick={onClick}
    >
      <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isOn ? 'transform translate-x-4.5' : ''}`} />
    </div>
  );
}

function StatusBadge({ status, type }: { status: string, type: 'success' | 'warning' }) {
  const isSuccess = type === 'success';
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border
      ${isSuccess ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-green-500' : 'bg-orange-500'}`} />
      {status}
    </span>
  );
}
