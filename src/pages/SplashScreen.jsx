import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

function SplashScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate('/home');
      } else {
        navigate('/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white">
      {/* Animated Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30"
        >
          <Check size={48} className="text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* App Name */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-4xl font-black tracking-tighter text-center px-4"
      >
        ClockTrack
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-2 text-teal-100/60 font-bold uppercase tracking-widest text-[10px]"
      >
        Smart Attendance Companion
      </motion.p>
    </div>
  );
}

export default SplashScreen;
