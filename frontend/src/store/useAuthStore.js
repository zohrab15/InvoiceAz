import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('invoice_token'),
    setAuth: (user, token) => {
        localStorage.setItem('invoice_token', token);
        set({ user, token });
    },
    logout: () => {
        localStorage.removeItem('invoice_token');
        localStorage.removeItem('active_business');
        set({ user: null, token: null });
        window.location.href = '/';
    },
}));

export default useAuthStore;
