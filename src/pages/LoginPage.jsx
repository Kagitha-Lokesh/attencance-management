import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Check, AlertCircle, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.displayName });
        
        // Initial user document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: formData.email,
          displayName: formData.displayName,
          createdAt: new Date(),
          setupCompleted: false
        }, { merge: true });

        navigate('/onboarding');
      } else {
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        const userRef = doc(db, 'users', userCredential.user.uid);
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
      }
    } catch (err) {
      console.error("AUTH ERROR:", err.code);
      let message = "An error occurred during authentication.";
      if (err.code === 'auth/user-not-found') message = "Account not found. Please register.";
      if (err.code === 'auth/wrong-password') message = "Incorrect password.";
      if (err.code === 'auth/email-already-in-use') message = "Email already registered.";
      if (err.code === 'auth/invalid-email') message = "Invalid email address.";
      if (err.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col items-center p-6 pt-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center shadow-xl shadow-teal-600/20 mb-6">
          <Check size={40} className="text-white" strokeWidth={4} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">ClockTrack</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Attendance Simplified</p>

        <form onSubmit={handleAuth} className="w-full space-y-4">
          <AnimatePresence mode="wait">
            {isRegister && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative"
              >
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              placeholder="Work Email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 flex items-start gap-3 rounded-2xl"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] font-bold leading-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>

          <div className="h-px w-24 bg-slate-100" />
          
          <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Enterprise Grade Security
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;

