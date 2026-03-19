import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, LogOut, Calendar, ClipboardCheck, 
  Clock, MoreHorizontal, User, Bell, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { saveAttendanceLog, getAttendanceLogs, deleteAttendanceLog } from '../services/firestoreService';
import { sendAttendanceEmail } from '../services/emailService';
import GoogleFormModal from '../components/GoogleFormModal';
import MarkLeaveModal from '../components/MarkLeaveModal';

function HomePage() {
  const { user, accessToken } = useAuthStore();
  const { profile, settings } = useUserStore();
  const [todayLog, setTodayLog] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const timerRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  // Format Date for Header
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  useEffect(() => {
    // Fetch today's log
    const fetchLog = async () => {
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const logs = await getAttendanceLogs(user.uid, year, month);
      const log = logs.find(l => l.date === today);
      if (log) setTodayLog(log);
    };
    fetchLog();
  }, [user.uid, today]);

  function startTimer(loginTime) {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Calculate elapsed from start of day if using the user's snippet logic
    // but the user's snippet uses 1970-01-01T... so let's stick to their math
    const loginMs = new Date(`1970-01-01T${loginTime}:00`).getTime();
    
    timerRef.current = setInterval(() => {
      const now = new Date();
      const nowMs = now.getHours()*3600000 + now.getMinutes()*60000 + now.getSeconds()*1000;
      setElapsedSeconds(Math.floor((nowMs - loginMs) / 1000));
    }, 1000);
  }

  function formatTime(secs) {
    if (secs < 0) return "00:00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // Timer Logic
  useEffect(() => {
    if (todayLog?.loginTime && !todayLog?.logoutTime) {
      startTimer(todayLog.loginTime);
    } else {
      clearInterval(timerRef.current);
      if (todayLog?.hoursWorked) {
        // Convert decimal hours string to seconds if needed, or just display
        // The user's formatTime expects seconds.
        setElapsedSeconds(Math.floor(parseFloat(todayLog.hoursWorked) * 3600));
      } else {
        setElapsedSeconds(0);
      }
    }
    return () => clearInterval(timerRef.current);
  }, [todayLog, today]);

  const handleLogin = async () => {
    const loginTime = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const logData = {
      date: today,
      loginTime,
      status: 'worked',
      loginEmailSent: true,
      timestamp: new Date().toISOString()
    };
    await saveAttendanceLog(user.uid, today, logData);
    setTodayLog(logData);
    await sendAttendanceEmail(settings, 'login', profile.fullName, accessToken);
  };

  const handleLogout = async () => {
    const logoutTime = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const loginT = new Date(`${today}T${todayLog.loginTime}`);
    const logoutT = new Date(`${today}T${logoutTime}`);
    const hours = ((logoutT - loginT) / 3600000).toFixed(2);
    
    const logData = {
      ...todayLog,
      logoutTime,
      hoursWorked: hours,
      logoutEmailSent: true
    };
    await saveAttendanceLog(user.uid, today, logData);
    setTodayLog(logData);
    await sendAttendanceEmail(settings, 'logout', profile.fullName, accessToken);
  };

  // Determine Today's Status
  const isHoliday = settings?.holidays?.some(h => h.date === today);
  const isLeave = settings?.leaves?.some(l => l.date === today);
  const statusLabel = isLeave ? 'Leave' : isHoliday ? 'Holiday' : 'Working Day';

  return (
    <div className="flex flex-col min-h-full bg-white pb-20">
      {/* 1. Header */}
      <header className="px-4 pt-6 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter">Hi, {profile?.fullName?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{dayName}, {dateStr}</p>
        </div>
        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 font-bold border-2 border-teal-100 shadow-sm overflow-hidden p-0.5">
          {profile?.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" /> : <User size={24} />}
        </div>
      </header>

      <main className="px-4 mt-4 space-y-6">
        {/* 2. Status Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-teal-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-teal-600/30 relative overflow-hidden"
        >
          <div className="relative z-10 flex justify-between items-center mb-8">
            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
              {statusLabel}
            </span>
            <div className="flex items-center gap-2 text-teal-100">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase tracking-widest italic">Live Tracking</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center mb-8">
            <p className="text-5xl font-black tracking-tighter tabular-nums mb-1">{formatTime(elapsedSeconds)}</p>
            <p className="text-teal-100/60 text-[10px] font-bold uppercase tracking-widest">Total Working Hours Today</p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-3xl p-4 backdrop-blur-md border border-white/10">
              <p className="text-teal-100/60 text-[9px] font-bold uppercase tracking-widest mb-1">Login Time</p>
              <p className="text-lg font-black">{todayLog?.loginTime || '--:--'}</p>
            </div>
            <div className="bg-white/10 rounded-3xl p-4 backdrop-blur-md border border-white/10">
              <p className="text-teal-100/60 text-[9px] font-bold uppercase tracking-widest mb-1">Logout Time</p>
              <p className="text-lg font-black">{todayLog?.logoutTime || '--:--'}</p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full" />
        </motion.div>

        {/* 3. Actions */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleLogin}
              disabled={todayLog?.loginTime || isHoliday || isLeave}
              className={`h-24 rounded-3xl flex flex-col items-center justify-center gap-2 font-black text-sm transition-all duration-300 shadow-md ${
                todayLog?.loginTime ? 'bg-slate-50 text-slate-300 border border-slate-100 shadow-none' : 'bg-teal-600 text-white active:scale-95'
              }`}
            >
              <LogIn size={24} />
              <span>Login Now</span>
            </button>

            <button 
              onClick={handleLogout}
              disabled={!todayLog?.loginTime || todayLog?.logoutTime}
              className={`h-24 rounded-3xl flex flex-col items-center justify-center gap-2 font-black text-sm transition-all duration-300 shadow-md ${
                !todayLog?.loginTime || todayLog?.logoutTime ? 'bg-slate-50 text-slate-300 border border-slate-100 shadow-none' : 'bg-slate-800 text-white active:scale-95'
              }`}
            >
              <LogOut size={24} />
              <span>Logout Now</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsLeaveModalOpen(true)}
              className="py-4 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Calendar size={18} /> Mark Leave
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="py-4 rounded-2xl bg-teal-50 text-teal-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all border border-teal-100 shadow-sm"
            >
              <ClipboardCheck size={18} /> Daily Report
            </button>
          </div>
        </div>

        {/* 4. Today's Log */}
        <section className="pb-8">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Today's Activity</h3>
            <button 
              onClick={async () => {
                if (window.confirm("Testing: Reset today's log?")) {
                  await deleteAttendanceLog(user.uid, today);
                  setTodayLog(null);
                  setElapsedSeconds(0);
                }
              }}
              className="text-[10px] font-bold text-teal-600 uppercase tracking-widest hover:underline"
            >
              Reset
            </button>
          </div>

          <div className="space-y-3">
            {!todayLog ? (
              <div className="bg-slate-50 rounded-3xl py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                <Clock className="text-slate-300 mb-2" size={32} strokeWidth={1.5} />
                <p className="text-sm font-bold text-slate-400">No activity recorded yet</p>
              </div>
            ) : (
              <>
                {todayLog.loginTime && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-[2rem] shadow-sm border border-slate-100"
                  >
                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-inner"><LogIn size={20} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Clock In</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regular Shift</p>
                    </div>
                    <p className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{todayLog.loginTime}</p>
                  </motion.div>
                )}
                {todayLog.logoutTime && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-[2rem] shadow-sm border border-slate-100"
                  >
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shadow-inner"><LogOut size={20} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-tight">Clock Out</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Ended</p>
                    </div>
                    <p className="text-sm font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{todayLog.logoutTime}</p>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Nav Placeholder - BottomNav will go here */}

      {/* Google Form Modal */}
      {/* Google Form Modal */}
      <GoogleFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userProfile={profile}
        config={settings.googleForm}
      />

      {/* Mark Leave Modal */}
      <MarkLeaveModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)}
        onFinish={() => {
          // Re-fetch today's log to update UI
          const fetchLog = async () => {
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const logs = await getAttendanceLogs(user.uid, year, month);
            const log = logs.find(l => l.date === today);
            if (log) setTodayLog(log);
          };
          fetchLog();
        }}
      />
    </div>
  );
}

export default HomePage;
