import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Clock, FileText, Calendar, 
  ChevronDown, ChevronUp, Save, LogOut, Trash2, Plus 
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { saveSettings, saveUserProfile, deleteAttendanceLog, deleteAttendanceRange } from '../services/firestoreService';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import DatePicker from 'react-datepicker';

function SettingsPage() {
  const { user } = useAuthStore();
  const { profile, settings, setSettings, setProfile } = useUserStore();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localProfile, setLocalProfile] = useState(profile);

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Save Profile
      await saveUserProfile(user.uid, localProfile);
      setProfile(localProfile);

      // Save Sections
      const sections = ['loginEmail', 'logoutEmail', 'timeConfig', 'googleForm', 'workWeek', 'holidays', 'leaves'];
      for (const section of sections) {
        await saveSettings(user.uid, section, localSettings[section]);
      }
      setSettings(localSettings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    useAuthStore.getState().setAccessToken(null);
    navigate('/login');
  };

  const updateSection = (section, data) => {
    setLocalSettings(prev => ({ ...prev, [section]: { ...prev[section], ...data } }));
  };

  return (
    <div className="flex flex-col min-h-full bg-white pb-20">
      <header className="px-4 pt-6 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter">Settings</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Preferences</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={loading}
          className="h-12 bg-teal-600 text-white px-6 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
        >
          {loading ? 'Saving...' : <><Save size={18} /> Save</>}
        </button>
      </header>

      <main className="px-4 mt-4 space-y-4">
        {/* Profile Section */}
        <AccordionSection 
          id="profile" 
          title="Profile Information" 
          icon={<User size={18} />} 
          expanded={expanded === 'profile'} 
          onToggle={() => toggle('profile')}
        >
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                value={localProfile.fullName} 
                onChange={e => setLocalProfile({...localProfile, fullName: e.target.value})}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</label>
              <input 
                type="text" 
                value={localProfile.employeeId} 
                onChange={e => setLocalProfile({...localProfile, employeeId: e.target.value})}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
              <input 
                type="text" 
                value={localProfile.department} 
                onChange={e => setLocalProfile({...localProfile, department: e.target.value})}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" 
              />
            </div>
          </div>
        </AccordionSection>

        {/* Email Sections */}
        <AccordionSection id="loginEmail" title="Login Email" icon={<Mail size={18} />} expanded={expanded === 'loginEmail'} onToggle={() => toggle('loginEmail')}>
          <EmailConfig data={localSettings.loginEmail} update={d => updateSection('loginEmail', d)} />
        </AccordionSection>
        
        <AccordionSection id="logoutEmail" title="Logout Email" icon={<Mail size={18} />} expanded={expanded === 'logoutEmail'} onToggle={() => toggle('logoutEmail')}>
          <EmailConfig data={localSettings.logoutEmail} update={d => updateSection('logoutEmail', d)} />
        </AccordionSection>

        {/* Time Config */}
        <AccordionSection id="time" title="Time Configuration" icon={<Clock size={18} />} expanded={expanded === 'time'} onToggle={() => toggle('time')}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login Time</label>
              <input type="time" value={localSettings.timeConfig.loginTime} onChange={e => updateSection('timeConfig', {loginTime: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logout Time</label>
              <input type="time" value={localSettings.timeConfig.logoutTime} onChange={e => updateSection('timeConfig', {logoutTime: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" />
            </div>
          </div>
        </AccordionSection>

        {/* Google Form */}
        <AccordionSection id="form" title="Google Form" icon={<FileText size={18} />} expanded={expanded === 'form'} onToggle={() => toggle('form')}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Form URL</label>
              <input type="url" value={localSettings.googleForm.url} onChange={e => updateSection('googleForm', {url: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-2">
               <div>
                  <label className="text-[8px] font-bold text-slate-400 uppercase">Name ID</label>
                  <input type="text" value={localSettings.googleForm.nameEntry} onChange={e => updateSection('googleForm', {nameEntry: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" />
               </div>
               <div>
                  <label className="text-[8px] font-bold text-slate-400 uppercase">Date ID</label>
                  <input type="text" value={localSettings.googleForm.dateEntry} onChange={e => updateSection('googleForm', {dateEntry: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" />
               </div>
               <div>
                  <label className="text-[8px] font-bold text-slate-400 uppercase">Time ID</label>
                  <input type="text" value={localSettings.googleForm.timeEntry} onChange={e => updateSection('googleForm', {timeEntry: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" />
               </div>
            </div>
          </div>
        </AccordionSection>

        {/* Holidays & Leaves */}
        <AccordionSection id="calendar" title="Operating Info" icon={<Calendar size={18} />} expanded={expanded === 'calendar'} onToggle={() => toggle('calendar')}>
           <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Work Week (0-6)</label>
                <div className="flex gap-1.5 justify-between">
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        const newW = localSettings.workWeek.includes(i) ? localSettings.workWeek.filter(x => x !== i) : [...localSettings.workWeek, i];
                        setLocalSettings({...localSettings, workWeek: newW.sort()});
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${localSettings.workWeek.includes(i) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                    >{d}</button>
                  ))}
                </div>
              </div>
           </div>
        </AccordionSection>

        {/* Debug & Testing Section */}
        <AccordionSection 
          id="debug" 
          title="Debug & Testing" 
          icon={<Trash2 size={18} />} 
          expanded={expanded === 'debug'} 
          onToggle={() => toggle('debug')}
        >
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-4">Danger Zone (Testing Only)</p>
            
            <button 
              onClick={async () => {
                if (window.confirm("Reset today's log?")) {
                  const today = new Date().toISOString().split('T')[0];
                  await deleteAttendanceLog(user.uid, today);
                  alert("Today's log cleared.");
                }
              }}
              className="w-full h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest active:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              Reset Today's Log
            </button>

            <button 
              onClick={async () => {
                if (window.confirm("ARE YOU SURE? This will clear ALL attendance history permanently!")) {
                  await deleteAttendanceRange(user.uid, '1970-01-01', '2100-12-31');
                  alert("All history cleared.");
                }
              }}
              className="w-full h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest active:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              Clear All Logs
            </button>

            <button 
              onClick={async () => {
                if (window.confirm("Restart onboarding? You will be redirected to setup.")) {
                  const ref = doc(db, 'users', user.uid);
                  await setDoc(ref, { setupCompleted: false }, { merge: true });
                  window.location.reload();
                }
              }}
              className="w-full h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-black uppercase tracking-widest active:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              Reset Onboarding Flow
            </button>
          </div>
        </AccordionSection>
      </main>

      <div className="p-4 mt-8">
        <button 
          onClick={handleSignOut}
          className="h-16 w-full flex items-center justify-center gap-3 rounded-[2rem] bg-red-50 text-red-600 font-black text-sm uppercase tracking-widest active:scale-95 transition-all border border-red-100 shadow-sm"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );
}

const AccordionSection = ({ id, title, icon, expanded, onToggle, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <button 
      onClick={onToggle}
      className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${expanded ? 'bg-slate-50' : 'bg-white'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${expanded ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
          {icon}
        </div>
        <span className={`font-bold text-sm ${expanded ? 'text-slate-800' : 'text-slate-600'}`}>{title}</span>
      </div>
      {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="p-6 pt-2 border-t border-slate-50">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const EmailConfig = ({ data, update }) => (
  <div className="space-y-4">
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipients</label>
      <input type="text" value={data.recipients} onChange={e => update({recipients: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm" />
    </div>
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
      <input type="text" value={data.subject} onChange={e => update({subject: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm" />
    </div>
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Body</label>
      <textarea value={data.body} onChange={e => update({body: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs h-24 font-mono" />
    </div>
  </div>
);

export default SettingsPage;
