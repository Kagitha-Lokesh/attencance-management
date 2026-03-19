import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

function GoogleFormModal({ isOpen, onClose, userProfile, config }) {
  if (!isOpen) return null;

  // Function to build pre-populated URL
  const buildUrl = () => {
    if (!config?.url) return '';
    try {
      const baseUrl = config.url.replace('/viewform', '/formResponse'); // Change to formResponse for embedding or just use viewform
      const url = new URL(config.url);
      const params = new URLSearchParams();
      
      if (config.nameEntry) params.append(config.nameEntry, userProfile?.fullName || '');
      if (config.dateEntry) params.append(config.dateEntry, new Date().toISOString().split('T')[0]);
      if (config.timeEntry) params.append(config.timeEntry, new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }));
      
      return `${config.url}?${params.toString()}`;
    } catch (e) {
      return config.url;
    }
  };

  const formUrl = buildUrl();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-2xl bg-white rounded-t-[2.5rem] shadow-2xl relative h-[90vh] pointer-events-auto flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                <ExternalLink size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Submit Attendance Form</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Google Forms Integration</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Iframe Content */}
          <div className="flex-1 bg-slate-50 overflow-hidden relative">
            {!config?.url ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><X size={32} /></div>
                <p className="font-bold">No Google Form URL found.</p>
                <p className="text-sm">Please set it up in Settings or Setup Wizard.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={`${formUrl.includes('?') ? formUrl + '&' : formUrl + '?'}embedded=true`}
                  className="w-full flex-1 border-none"
                  title="Google Form"
                />
                {/* Fallback Footer */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-center">
                  <a 
                    href={formUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                  >
                    <ExternalLink size={18} />
                    <span>Can't see the form? Open in new tab</span>
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {/* Handle for dragging feel */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default GoogleFormModal;
