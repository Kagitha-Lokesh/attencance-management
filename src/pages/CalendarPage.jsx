import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { getAttendanceLogs } from '../services/firestoreService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, getDay } from 'date-fns';

function CalendarPage() {
  const { user } = useAuthStore();
  const { settings } = useUserStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await getAttendanceLogs(user.uid, year, month);
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [user.uid, currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  // Legend Data
  const legend = [
    { color: 'bg-teal-500', label: 'Worked' },
    { color: 'bg-orange-400', label: 'Leave' },
    { color: 'bg-blue-400', label: 'Holiday' },
    { color: 'bg-slate-300', label: 'Weekend' },
    { color: 'bg-red-400', label: 'Missed' }
  ];

  const getDayStatus = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const log = logs.find(l => l.date === dayStr);
    
    if (log?.status === 'worked') return 'worked';
    
    const isHoliday = settings?.holidays?.some(h => h.date === dayStr);
    if (isHoliday) return 'holiday';
    
    const isLeave = settings?.leaves?.some(l => l.date === dayStr);
    if (isLeave) return 'leave';
    
    const dayOfWeek = getDay(day);
    const isWeekend = !settings?.workWeek?.includes(dayOfWeek);
    if (isWeekend) return 'weekend';
    
    if (day < new Date() && !isToday(day)) return 'missed';
    return 'none';
  };

  const statusColors = {
    worked: 'bg-teal-500',
    holiday: 'bg-blue-400',
    leave: 'bg-orange-400',
    weekend: 'bg-slate-300',
    missed: 'bg-red-400',
    none: 'bg-slate-100'
  };

  // Summary Counts
  const summary = {
    worked: logs.filter(l => l.status === 'worked').length,
    leave: settings?.leaves?.filter(l => isSameMonth(new Date(l.date), currentDate)).length || 0,
    missed: daysInMonth.filter(d => getDayStatus(d) === 'missed').length
  };

  return (
    <div className="flex flex-col min-h-full bg-white pb-20">
      <header className="px-4 pt-6 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter">Attendance</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Monthly Log</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 border border-slate-200 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 active:text-teal-600"><ChevronLeft size={20} /></button>
          <span className="px-2 font-black text-slate-700 text-xs uppercase tracking-tighter min-w-[100px] text-center">{format(currentDate, 'MMM yyyy')}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 active:text-teal-600"><ChevronRight size={20} /></button>
        </div>
      </header>

      <main className="px-4 mt-4 space-y-6">
        {/* Calendar Grid */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-100 border border-slate-100">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-black text-slate-300 tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {/* Pad start of month */}
            {Array.from({ length: getDay(daysInMonth[0]) }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {daysInMonth.map((day, i) => {
              const status = getDayStatus(day);
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 relative">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${isToday(day) ? 'ring-2 ring-teal-600 ring-offset-2' : ''}
                    ${status === 'none' ? 'text-slate-400' : 'text-slate-700'}
                  `}>
                    {format(day, 'd')}
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 px-4">
          {legend.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Month Summary */}
        <section className="pt-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info size={14} /> Month Summary
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-teal-50 rounded-3xl p-4 border border-teal-100 shadow-sm">
              <p className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-1">Worked</p>
              <p className="text-2xl font-black text-teal-800 tabular-nums">{summary.worked}</p>
            </div>
            <div className="bg-orange-50 rounded-3xl p-4 border border-orange-100 shadow-sm">
              <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mb-1">Leave</p>
              <p className="text-2xl font-black text-orange-800 tabular-nums">{summary.leave}</p>
            </div>
            <div className="bg-red-50 rounded-3xl p-4 border border-red-100 shadow-sm">
              <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-1">Missed</p>
              <p className="text-2xl font-black text-red-800 tabular-nums">{summary.missed}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CalendarPage;
