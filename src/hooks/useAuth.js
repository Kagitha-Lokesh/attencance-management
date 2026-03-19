import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const setUser = useAuthStore(s => s.setUser);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user); // null = logged out, object = logged in
    });
    return unsub; // cleanup on unmount
  }, [setUser]);
}
