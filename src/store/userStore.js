import { create } from 'zustand';

export const useUserStore = create((set) => ({
  profile: null,
  settings: null,
  setupCompleted: false,
  loading: true, // New loading state for data fetching
  setProfile: (profile) => set({ profile, loading: false }),
  setSettings: (data) => set({ 
    settings: data, 
    profile: data?.profile || null,
    setupCompleted: data?.setupCompleted || false,
    loading: false
  }),
  setLoading: (loading) => set({ loading }),
  clearUser: () => set({ profile: null, settings: null, setupCompleted: false, loading: false }),
}));
