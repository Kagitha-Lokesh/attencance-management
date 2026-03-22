import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Clock, Globe, Calendar, FileText, ChevronRight, 
  ChevronLeft, Plus, Trash2, Upload, CheckCircle, Info 
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx';

import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { saveSettings } from '../services/firestoreService';
import { auth } from '../firebase';
import GmailConnectModal from '../components/GmailConnectModal';

function SetupPage() {

  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setSettings } = useUserStore();

  const [formData, setFormData] = useState({
    loginEmail: { recipients: '', subject: 'Attendance Login - {{date}}', body: 'Hi Team,\n\n{{name}} has logged in at {{time}} on {{day}}, {{date}}.' },
    logoutEmail: { recipients: '', subject: 'Attendance Logout - {{date}}', body: 'Hi Team,\n\n{{name}} has logged out at {{time}} on {{day}}, {{date}}.' },
    timeConfig: { loginTime: '09:00', logoutTime: '18:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    googleForm: { url: '', nameEntry: '', dateEntry: '', timeEntry: '' },
    workWeek: [1, 2, 3, 4, 5], // Mon-Fri
    holidays: [],
    leaves: []
  });

  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Helper to update deeply nested state
  const updateSection = (section, data) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], ...data } }));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // Save each section
      const sections = ['loginEmail', 'logoutEmail', 'timeConfig', 'googleForm', 'workWeek', 'holidays', 'leaves'];
      for (const section of sections) {
        await saveSettings(user.uid, section, formData[section]);
      }
      setSettings({ ...formData, setupCompleted: true });
      setShowConnectModal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const renderStep = () => {
    switch (step) {
      case 1: return <StepEmail section="loginEmail" title="Login Email" data={formData.loginEmail} update={(d) => updateSection('loginEmail', d)} />;
      case 2: return <StepEmail section="logoutEmail" title="Logout Email" data={formData.logoutEmail} update={(d) => updateSection('logoutEmail', d)} />;
      case 3: return <StepTime data={formData.timeConfig} update={(d) => updateSection('timeConfig', d)} />;
      case 4: return <StepGoogleForm data={formData.googleForm} update={(d) => updateSection('googleForm', d)} />;
      case 5: return <StepWorkWeek data={formData} update={setFormData} />;
      case 6: return <StepLeaves data={formData.leaves} update={(l) => setFormData(p => ({ ...p, leaves: l }))} />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 relative">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between text-sm font-semibold text-slate-500 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              className="h-full bg-teal-600"
            />
          </div>
        </div>

        {/* Card Content */}
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl shadow-xl p-8 min-h-[500px] flex flex-col"
        >
          <div className="flex-1">
            {renderStep()}
          </div>

          <div className="mt-12 flex justify-between gap-4">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={20} /> Back
            </button>
            
            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="btn-teal px-8 py-2.5 rounded-xl font-bold flex items-center gap-2"
              >
                Next <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-600/30 transition-all active:scale-95"
              >
                {loading ? 'Saving...' : <><CheckCircle size={20} /> Finish Setup</>}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Gmail Connection Modal */}
      <GmailConnectModal 
        isOpen={showConnectModal}
        onClose={() => navigate('/home')}
        onConnect={handleConnectGmail}
        loading={loading}
      />
    </div>
  );
}


// --- Sub-components for steps ---

const StepEmail = ({ section, title, data, update }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 text-teal-600 mb-2">
      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
        <Mail size={24} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Recipients</label>
      <textarea
        value={data.recipients}
        onChange={(e) => update({ recipients: e.target.value })}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none h-24"
        placeholder="manager@company.com, hr@company.com"
      />
      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Info size={12} /> Comma-separated email addresses</p>
    </div>

    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject Template</label>
      <input
        type="text"
        value={data.subject}
        onChange={(e) => update({ subject: e.target.value })}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Body Template</label>
      <textarea
        value={data.body}
        onChange={(e) => update({ body: e.target.value })}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none h-40 font-mono text-sm"
      />
      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span>Variables:</span>
        <span className="text-teal-600">{"{{name}}"}</span>
        <span className="text-teal-600">{"{{date}}"}</span>
        <span className="text-teal-600">{"{{time}}"}</span>
        <span className="text-teal-600">{"{{day}}"}</span>
      </div>
    </div>
  </div>
);

const StepTime = ({ data, update }) => (
  <div className="space-y-8">
    <div className="flex items-center gap-3 text-teal-600 mb-2">
      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
        <Clock size={24} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Time Configuration</h2>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Official Login Time</label>
        <input
          type="time"
          value={data.loginTime}
          onChange={(e) => update({ loginTime: e.target.value })}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-lg font-semibold"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Official Logout Time</label>
        <input
          type="time"
          value={data.logoutTime}
          onChange={(e) => update({ logoutTime: e.target.value })}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-lg font-semibold"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><Globe size={16} /> Timezone</label>
      <div className="px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
        {data.timezone}
      </div>
      <p className="text-xs text-slate-400 mt-2 italic">Auto-detected from your device</p>
    </div>
  </div>
);

const StepGoogleForm = ({ data, update }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 text-teal-600 mb-2">
      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
        <FileText size={24} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Google Form Integration</h2>
    </div>

    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Form URL</label>
      <input
        type="url"
        value={data.url}
        onChange={(e) => update({ url: e.target.value })}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
        placeholder="https://docs.google.com/forms/d/e/.../viewform"
      />
    </div>

    <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 mb-4">
      <h3 className="text-sm font-bold text-teal-800 mb-2">Field Entry IDs</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-semibold text-teal-700 mb-1">Name Field ID</label>
          <input
            type="text"
            value={data.nameEntry}
            onChange={(e) => update({ nameEntry: e.target.value })}
            placeholder="entry.123456789"
            className="w-full px-3 py-2 bg-white border border-teal-200 rounded-lg outline-none text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-teal-700 mb-1">Date Field ID</label>
            <input
              type="text"
              value={data.dateEntry}
              onChange={(e) => update({ dateEntry: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-teal-200 rounded-lg outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-teal-700 mb-1">Time Field ID</label>
            <input
              type="text"
              value={data.timeEntry}
              onChange={(e) => update({ timeEntry: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-teal-200 rounded-lg outline-none text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StepWorkWeek = ({ data, update }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const toggleDay = (idx) => {
    const isWorking = data.workWeek.includes(idx);
    const newWeek = isWorking ? data.workWeek.filter(d => d !== idx) : [...data.workWeek, idx];
    update(p => ({ ...p, workWeek: newWeek.sort() }));
  };

  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState(null);

  const addHoliday = () => {
    if (!holidayName || !holidayDate) return;
    update(p => ({
      ...p,
      holidays: [...p.holidays, { name: holidayName, date: holidayDate.toISOString().split('T')[0] }]
    }));
    setHolidayName('');
    setHolidayDate(null);
  };

  const removeHoliday = (idx) => {
    update(p => ({ ...p, holidays: p.holidays.filter((_, i) => i !== idx) }));
  };

  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      // Expected columns: date (YYYY-MM-DD), name
      const holidays = data.map(r => ({ date: r.date, name: r.name }));
      update(p => ({
        ...p,
        holidays: [...p.holidays, ...holidays]
      }));
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-teal-600 mb-2">
        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
          <Calendar size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Work Week & Holidays</h2>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">Operating Days</label>
        <div className="flex justify-between gap-2">
          {days.map((day, i) => (
            <button
              key={day}
              onClick={() => toggleDay(i)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${
                data.workWeek.includes(i) ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-white border-slate-100 text-slate-400 hover:border-teal-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-semibold text-slate-700">Holidays List</label>
          <label className="text-teal-600 text-xs font-bold cursor-pointer flex items-center gap-1 hover:underline">
            <Upload size={14} /> Import from Excel
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleExcelImport} />
          </label>
        </div>

        <div className="flex gap-2 mb-4">
          <DatePicker
            selected={holidayDate}
            onChange={date => setHolidayDate(date)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            placeholderText="Select Date"
          />
          <input
            type="text"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
            placeholder="Holiday Name"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
          />
          <button onClick={addHoliday} className="bg-teal-600 text-white p-2.5 rounded-xl hover:bg-teal-700"><Plus size={20} /></button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {data.holidays.map((h, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <span className="text-sm font-bold text-slate-700">{h.name}</span>
                <span className="text-xs text-slate-400 ml-2">{h.date}</span>
              </div>
              <button onClick={() => removeHoliday(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StepLeaves = ({ data, update }) => {
  const [leaveDate, setLeaveDate] = useState(null);
  const [reason, setReason] = useState('');

  const addLeave = () => {
    if (!leaveDate || !reason) return;
    update([...data, { date: leaveDate.toISOString().split('T')[0], reason }]);
    setLeaveDate(null);
    setReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-teal-600 mb-2">
        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
          <Calendar size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Leaves</h2>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Schedule a Leave</h3>
        <div className="grid grid-cols-1 gap-4">
          <DatePicker
            selected={leaveDate}
            onChange={date => setLeaveDate(date)}
            inline
            calendarClassName="shadow-sm border-none"
          />
          <div className="flex-1">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for leave"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none min-h-[100px]"
            />
            <button
              onClick={addLeave}
              className="w-full mt-3 bg-teal-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Add Leave
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scheduled Leaves</h4>
        {data.map((l, i) => (
          <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center text-xs font-bold">L</div>
              <div>
                <p className="text-sm font-bold text-slate-700">{l.date}</p>
                <p className="text-xs text-slate-400">{l.reason}</p>
              </div>
            </div>
            <button onClick={() => update(data.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupPage;
