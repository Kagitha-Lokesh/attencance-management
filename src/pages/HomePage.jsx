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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 tracking-widest">{dayName}, {dateStr}</p>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">Hi, {profile?.fullName?.split(' ')[0] || 'User'} 👋</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              if (window.confirm("Testing: Reset today's log?")) {
                await deleteAttendanceLog(user.uid, today);
                setTodayLog(null);
                setElapsedSeconds(0);
              }
            }}
            className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 transition-all uppercase tracking-wider"
          >
            Reset Test
          </button>
          <div className="relative">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold border-2 border-white shadow-sm overflow-hidden">
              {profile?.avatar ? <img src={profile.avatar} alt="Avatar" /> : <User size={20} />}
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <Bell size={8} className="text-white" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* Today's Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-600 rounded-[2rem] p-6 text-white shadow-xl shadow-teal-600/20 relative overflow-hidden"
        >
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div>
              <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Today's Status</p>
              <h2 className="text-xl font-bold">{statusLabel}</h2>
            </div>
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Calendar size={20} />
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
              <p className="text-teal-100 text-[10px] font-bold uppercase mb-1">Login</p>
              <p className="text-xl font-bold">{todayLog?.loginTime || '--:--'}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
              <p className="text-teal-100 text-[10px] font-bold uppercase mb-1">Logout</p>
              <p className="text-xl font-bold">{todayLog?.logoutTime || '--:--'}</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <p className="text-teal-100 text-[10px] font-bold uppercase mb-1">Hours Counter</p>
            <p className="text-5xl font-black tracking-tighter tabular-nums">{formatTime(elapsedSeconds)}</p>
          </div>

          {/* Decorative Circles */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -left-5 -top-5 w-24 h-24 bg-white/5 rounded-full" />
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleLogin}
            disabled={todayLog?.loginTime || isHoliday || isLeave}
            className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
              todayLog?.loginTime ? 'bg-slate-100 border-slate-100 text-slate-400' : 'bg-white border-slate-200 text-teal-600 active:scale-95 shadow-sm'
            }`}
          >
            <div className={`p-3 rounded-2xl ${todayLog?.loginTime ? 'bg-slate-200' : 'bg-teal-50'}`}>
              <LogIn size={24} />
            </div>
            <span className="font-bold text-sm">Login Now</span>
          </button>

          <button 
            onClick={handleLogout}
            disabled={!todayLog?.loginTime || todayLog?.logoutTime}
            className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
              !todayLog?.loginTime || todayLog?.logoutTime ? 'bg-slate-100 border-slate-100 text-slate-400' : 'bg-white border-slate-200 text-slate-600 active:scale-95 shadow-sm'
            }`}
          >
            <div className={`p-3 rounded-2xl ${!todayLog?.loginTime || todayLog?.logoutTime ? 'bg-slate-200' : 'bg-slate-100'}`}>
              <LogOut size={24} />
            </div>
            <span className="font-bold text-sm">Logout Now</span>
          </button>
        </div>

        {/* Full Width Actions */}
        <div className="space-y-3">
          <button 
            onClick={() => setIsLeaveModalOpen(true)}
            className="w-full py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-98 transition-all"
          >
            <Calendar size={18} /> Mark Leave
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-4 rounded-2xl border-2 border-teal-600 text-teal-600 font-bold flex items-center justify-center gap-2 hover:bg-teal-50 active:scale-98 transition-all"
          >
            <ClipboardCheck size={18} /> Get Google Form
          </button>
        </div>

        {/* Today's Log */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Today's Log</h3>
            <button className="text-teal-600 text-xs font-bold tracking-widest uppercase">View All</button>
          </div>
          <div className="space-y-3">
            {!todayLog ? (
              <div className="text-center py-8 text-slate-400 text-sm italic">No entries for today yet.</div>
            ) : (
              <>
                {todayLog.loginTime && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center"><LogIn size={20} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">Logged In</p>
                      <p className="text-xs text-slate-400">Regular Check-in</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{todayLog.loginTime}</p>
                  </div>
                )}
                {todayLog.logoutTime && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><LogOut size={20} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">Logged Out</p>
                      <p className="text-xs text-slate-400">Day Completed</p>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{todayLog.logoutTime}</p>
                  </div>
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
