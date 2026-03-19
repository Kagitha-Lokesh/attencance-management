import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  ChevronLeft, ChevronRight, TrendingUp, 
  Calendar, Clock, UserCheck, Activity 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getAttendanceLogs } from '../services/firestoreService';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, 
  addWeeks, subWeeks, addMonths, subMonths, 
  startOfMonth, endOfMonth, isSameDay 
} from 'date-fns';

function HoursPage() {
  const { user } = useAuthStore();
  const [view, setView] = useState('weekly'); // 'weekly' | 'monthly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-fetch when date or view changes
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

  // Date Range Logic
  const range = view === 'weekly' 
    ? { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) }
    : { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };

  const daysInRange = eachDayOfInterval(range);

  const prevRange = () => setCurrentDate(view === 'weekly' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  const nextRange = () => setCurrentDate(view === 'weekly' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));

  // Process Data for Chart
  const chartData = daysInRange.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const log = logs.find(l => l.date === dayStr);
    return {
      name: format(day, 'EEE'),
      fullDate: format(day, 'MMM dd'),
      hours: log?.hoursWorked ? parseFloat(log.hoursWorked) : 0,
      status: log?.status || 'none'
    };
  });

  // Summary Logic
  const totalHours = chartData.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1);
  const daysWorked = chartData.filter(d => d.hours > 0).length;
  const avgHours = daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics</h1>
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button 
            onClick={() => setView('weekly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'weekly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >WEEKLY</button>
          <button 
            onClick={() => setView('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'monthly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >MONTHLY</button>
        </div>
      </header>

      <main className="space-y-6">
        {/* Date Navigator */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={prevRange} className="p-2 hover:bg-slate-50 text-slate-400"><ChevronLeft size={20} /></button>
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Calendar size={16} className="text-teal-600" />
            <span className="text-sm">
              {view === 'weekly' 
                ? `${format(range.start, 'MMM dd')} - ${format(range.end, 'MMM dd')}`
                : format(currentDate, 'MMMM yyyy')
              }
            </span>
          </div>
          <button onClick={nextRange} className="p-2 hover:bg-slate-50 text-slate-400"><ChevronRight size={20} /></button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <Clock size={16} className="text-teal-600 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-xl font-black text-slate-800">{totalHours}h</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <UserCheck size={16} className="text-teal-600 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Worked</p>
            <p className="text-xl font-black text-slate-800">{daysWorked}d</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <TrendingUp size={16} className="text-teal-600 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg</p>
            <p className="text-xl font-black text-slate-800">{avgHours}h</p>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-teal-600" /> Activity Chart
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full">Hours/Day</span>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs font-bold shadow-xl border border-white/10">
                          <p>{payload[0].payload.fullDate}</p>
                          <p className="text-teal-400 mt-1">{payload[0].value} Hours</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 6, 6]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.hours > 0 ? '#0d9488' : '#e2e8f0'} 
                      stroke={entry.hours > 0 ? '#0d9488' : '#cbd5e1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Breakdown List */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Daily Breakdown</h3>
            <button className="text-teal-600 text-[10px] font-black tracking-tighter hover:underline">EXPORT DATA</button>
          </div>
          <div className="space-y-3">
            {chartData.slice().reverse().filter(d => d.hours > 0 || view === 'weekly').map((day, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${day.hours > 0 ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-300'}`}>
                    {day.name.substring(0, 1)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{day.fullDate}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min((day.hours / 9) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800">{day.hours > 0 ? `${day.hours}h` : '--'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{day.status === 'worked' ? 'Verified' : 'Unlogged'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default HoursPage;
