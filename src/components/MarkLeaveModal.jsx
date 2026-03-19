import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, FileText, CheckCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { saveSettings, saveAttendanceLog } from '../services/firestoreService';

function MarkLeaveModal({ isOpen, onClose, onFinish }) {
  const { user } = useAuthStore();
  const { settings, setSettings } = useUserStore();
  const [leaveDate, setLeaveDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!reason) {
      alert("Please provide a reason for the leave.");
      return;
    }
    setLoading(true);
    try {
      const dateStr = leaveDate.toISOString().split('T')[0];
      
      // 1. Update users/{uid} leaves array
      const newLeaves = [...(settings.leaves || []), { date: dateStr, reason }];
      await saveSettings(user.uid, 'leaves', newLeaves);
      
      // 2. Create attendance/{uid}/logs/{date} with status: 'leave'
      await saveAttendanceLog(user.uid, dateStr, {
        date: dateStr,
        status: 'leave',
        reason: reason,
        timestamp: new Date().toISOString()
      });

      // Update local store
      setSettings({ ...settings, leaves: newLeaves });
      
      if (onFinish) onFinish();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-orange-500 p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <CalendarIcon size={24} />
              <h2 className="text-xl font-bold">Mark Leave</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Select Date</label>
              <div className="relative">
                <DatePicker
                  selected={leaveDate}
                  onChange={(date) => setLeaveDate(date)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700"
                  dateFormat="MMMM d, yyyy"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Reason</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-300" size={18} />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px] text-slate-700"
                  placeholder="e.g. Family Emergency, Sick Leave..."
                />
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
            >
              {loading ? 'Processing...' : <><CheckCircle size={20} /> Confirm Leave</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default MarkLeaveModal;
