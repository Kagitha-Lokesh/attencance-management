import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';

const GmailConnectModal = ({ isOpen, onClose, onConnect, loading }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="absolute top-0 left-0 w-full h-2 bg-teal-500" />
            
            <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center mb-6">
              <Mail size={40} className="text-teal-600" />
            </div>

            <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-3">
              Gmail Connection Required
            </h2>
            
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              To log your attendance and send automated emails, please connect your Gmail account.
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={onConnect}
                disabled={loading}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    Connect Gmail Account
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                disabled={loading}
                className="w-full h-14 bg-transparent text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Maybe Later
              </button>
            </div>

            <div className="mt-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                Secure OAuth2 Connection
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GmailConnectModal;
