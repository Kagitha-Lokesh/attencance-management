import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { useUserStore } from './store/userStore';
import { getUserSettings } from './services/firestoreService';

import BottomNav from './components/BottomNav';

// Pages
import SplashScreen from './pages/SplashScreen';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import SetupPage from './pages/SetupPage';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import HoursPage from './pages/HoursPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  useAuth();
  const { user, loading: authLoading } = useAuthStore();
  const { setupCompleted, profile, setSettings, loading: userLoading, setLoading } = useUserStore();

  useEffect(() => {
    if (user) {
      setLoading(true);
      getUserSettings(user.uid).then((settings) => {
        if (settings) {
          setSettings(settings);
        } else {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }, [user, setSettings, setLoading]);

  if (authLoading || (user && userLoading)) return <SplashScreen />;

  const showNav = user && profile && setupCompleted;

  return (
    <div className="mobile-container">
      <div className="page-content">
        <Routes>
          {/* Public Routes */}
          {!user ? (
            <>
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/splash" />} />
            </>
          ) : (
            /* Private Routes */
            <>
              {!profile ? (
                <Route path="*" element={<OnboardingPage />} />
              ) : !setupCompleted ? (
                <Route path="*" element={<SetupPage />} />
              ) : (
                <>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/hours" element={<HoursPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/home" />} />
                </>
              )}
            </>
          )}
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
