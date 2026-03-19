import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('google_access_token'),
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setAccessToken: (accessToken) => {
    if (accessToken) {
      localStorage.setItem('google_access_token', accessToken);
    } else {
      localStorage.removeItem('google_access_token');
    }
    set({ accessToken });
  },
  setLoading: (loading) => set({ loading }),
}));
