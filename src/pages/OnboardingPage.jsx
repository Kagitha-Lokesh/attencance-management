import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Briefcase, Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { saveUserProfile } from '../services/firestoreService';

function OnboardingPage() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setProfile } = useUserStore();

  useEffect(() => {
    if (user?.displayName && !fullName) {
      setFullName(user.displayName);
    }
  }, [user, fullName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName) return;
    setLoading(true);
    try {
      const profileData = {
        fullName,
        employeeId,
        email: user.email,
        onboardedAt: new Date().toISOString()
      };
      await saveUserProfile(user.uid, profileData);
      setProfile(profileData);
      navigate('/setup');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
            <User size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Complete Your Profile</h1>
          <p className="text-slate-500 mt-2">Just a few more details to get you started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                <User size={16} className="text-teal-600" /> Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                <Briefcase size={16} className="text-teal-600" /> Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="EMP-123"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-teal py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 mt-4"
          >
            {loading ? 'Saving...' : <><Send size={20} /> Continue to Setup</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default OnboardingPage;

