import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { Loader } from 'lucide-react';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const showToast = useToast();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const access = searchParams.get('access');
        const refresh = searchParams.get('refresh');

        if (access && refresh) {
            // Decode token to get user info if needed, or just set tokens
            // For now, we'll likely need to fetch user profile or decode token
            // But to keep it simple and consistent with login, let's just use the tokens
            // and maybe fetch user data later or rely on the stored token

            // We need a user object for the store. 
            // Since we don't have it here, we consistently fetch it or decode it.
            // For MVP, passing a placeholder or decoding is fine, 
            // but ideally we should fetch /auth/user/ with the new token.

            // However, useAuthStore expects (user, token).
            // Let's set a temporary user state and let the App fetch details if needed
            // OR simpler: just redirect and let ProtectedRoute handle it? 
            // No, ProtectedRoute needs token in store.

            // Set token and null user to trigger profile fetch in App.jsx
            setAuth(null, access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.removeItem('active_business'); // Clear stale business data on login

            showToast('Uğurla giriş edildi!');
            navigate('/dashboard', { replace: true });
        } else {
            showToast('Giriş zamanı xəta baş verdi', 'error');
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate, setAuth, showToast]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Giriş təsdiqlənir...</p>
        </div>
    );
};

export default AuthCallback;
