import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Check, AlertCircle } from 'lucide-react';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      console.log("ACCESS TOKEN:", accessToken);

      // Store the token
      useAuthStore.getState().setAccessToken(accessToken);

      const userRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        if (snap.data().setupCompleted) {
          navigate('/home');
        } else {
          navigate('/setup');
        }
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col items-center p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-teal-600 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-teal-600/20 mb-8">
          <Check size={48} className="text-white" strokeWidth={4} />
        </div>
        
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">ClockTrack</h1>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-12">Attendance Simplified</p>

        <div className="w-full space-y-6">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8">
            <p className="text-slate-600 text-sm font-medium leading-relaxed text-center">
              Sign in with your company Google account to start tracking your work hours.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 flex items-start gap-3 rounded-2xl mb-4"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-bold leading-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-16 flex items-center justify-center gap-4 bg-slate-900 text-white rounded-[2rem] shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                <span className="font-black text-sm uppercase tracking-widest">Continue with Google</span>
              </>
            )}
          </button>

          <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-8">
            Secure Enterprise Login
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
