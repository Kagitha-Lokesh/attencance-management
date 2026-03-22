import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Clock, FileText, Calendar, 
  ChevronDown, ChevronUp, Save, LogOut, Trash2, Plus,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { saveSettings, saveUserProfile, getUserSettings } from '../services/firestoreService';
import DatePicker from 'react-datepicker';

function SettingsPage() {
  const { user, setAccessToken } = useAuthStore();
  const { profile, settings, setSettings, setProfile } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [expanded, setExpanded] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localProfile, setLocalProfile] = useState(profile);

  // Handle OAuth Callback (Secure version)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const connected = params.get('connected');

    if (connected === 'true' && user) {
      // Re-fetch settings from Firestore because the backend 
      // just updated the refreshToken there.
      getUserSettings(user.uid).then((newSettings) => {
        if (newSettings) {
          setSettings(newSettings);
          setLocalSettings(newSettings);
          // Clean URL
          navigate('/settings', { replace: true });
          alert('Gmail connected successfully!');
        }
      });
    }
  }, [location, user, navigate, setSettings, setLocalSettings]);

  const toggle = (id) => setExpanded(expanded === id ? null : id);


  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Save Profile
      await saveUserProfile(user.uid, localProfile);
      setProfile(localProfile);

      // Save Sections
      const sections = ['loginEmail', 'logoutEmail', 'timeConfig', 'googleForm', 'workWeek', 'holidays', 'leaves', 'refreshToken'];
      for (const section of sections) {
        if (localSettings[section] !== undefined) {
          await saveSettings(user.uid, section, localSettings[section]);
        }
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
    setAccessToken(null);
    navigate('/login');
  };

  const updateSection = (section, data) => {
    setLocalSettings(prev => ({ ...prev, [section]: { ...prev[section], ...data } }));
  };

  const handleConnectGmail = async () => {
    try {
      setLoading(true);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication required");

      const res = await fetch("http://localhost:3001/auth/google", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get auth URL");
      }
      
      const { url } = await res.json();

      window.open(url, "_self");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect your Gmail account? Automated emails will stop.")) return;
    
    try {
      setLoading(true);
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("http://localhost:3001/disconnect-gmail", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });

      if (res.ok) {
        setSettings({ ...settings, refreshToken: null });
        setLocalSettings({ ...localSettings, refreshToken: null });
        alert("Gmail disconnected successfully.");
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };



  const isGmailConnected = !!localSettings?.refreshToken;

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

        {/* Gmail Connection Section */}
        <AccordionSection 
          id="gmail" 
          title="Gmail Connection" 
          icon={<Mail size={18} />} 
          expanded={expanded === 'gmail'} 
          onToggle={() => toggle('gmail')}
        >
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isGmailConnected ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100'}`}>
              {isGmailConnected ? (
                <CheckCircle2 size={24} className="text-teal-600" />
              ) : (
                <AlertCircle size={24} className="text-red-600" />
              )}
              <div>
                <p className={`text-sm font-bold ${isGmailConnected ? 'text-teal-800' : 'text-red-800'}`}>
                  {isGmailConnected ? 'Gmail Connected' : 'Gmail Not Connected'}
                </p>
                <p className={`text-[10px] ${isGmailConnected ? 'text-teal-600' : 'text-red-600'}`}>
                  {isGmailConnected 
                    ? 'Your account is ready to send automated emails.' 
                    : 'Connect your Google account to enable automated attendance emails.'
                  }
                </p>
              </div>
            </div>
            
            {isGmailConnected ? (
              <button 
                onClick={handleDisconnectGmail}
                className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 bg-red-50 text-red-600 border border-red-100"
              >
                <Trash2 size={16} />
                Disconnect Gmail
              </button>
            ) : (
              <button 
                onClick={handleConnectGmail}
                className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 bg-slate-900 text-white shadow-lg shadow-slate-900/10"
              >
                <Mail size={16} />
                Connect Gmail Account
              </button>
            )}
            
            {isGmailConnected && (
              <p className="text-[9px] text-center text-slate-400">
                Note: Refresh token is stored securely with encryption.
                <br />
                <button onClick={handleConnectGmail} className="underline">Reconnect</button> if emails are failing.
              </p>
            )}

          </div>
        </AccordionSection>

        {/* Email Sections */}
        <AccordionSection id="loginEmail" title="Login Email Template" icon={<Mail size={18} />} expanded={expanded === 'loginEmail'} onToggle={() => toggle('loginEmail')}>
          <EmailConfig data={localSettings.loginEmail} update={d => updateSection('loginEmail', d)} />
        </AccordionSection>
        
        <AccordionSection id="logoutEmail" title="Logout Email Template" icon={<Mail size={18} />} expanded={expanded === 'logoutEmail'} onToggle={() => toggle('logoutEmail')}>
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

