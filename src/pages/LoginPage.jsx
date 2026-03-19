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
    <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-teal-600 p-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 mb-6">
            <Check size={40} className="text-white" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to WorkTrack</h1>
          <p className="text-teal-100 text-sm opacity-90">Please sign in with your company Google account to manage your attendance and logs.</p>
        </div>

        <div className="p-8 space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="py-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-4 border-2 border-slate-100 rounded-xl hover:bg-slate-50 hover:border-teal-100 transition-all text-slate-700 font-bold text-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                  Continue with Google
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400">
            Secure authentication powered by Google OAuth
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
