import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null,
  isAuthenticated: !!localStorage.getItem('userInfo'),
  login: (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('userInfo');
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
