import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/Toast';

const DemoLogin = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const showToast = useToast();

    useEffect(() => {
        const loginDemo = async () => {
            try {
                // We use the standard login endpoint but with demo credentials
                const response = await axios.post(`${API_URL}/api/auth/login/`, {
                    email: 'demo@invoice.az',
                    password: 'demo1234'
                });

                const { key, user } = response.data;
                setAuth(user, key);
                showToast('Demo hesaba daxil olundu. Xoş gəlmisiniz!', 'success');
                navigate('/dashboard');
            } catch (err) {
                console.error('Demo login failed:', err);
                showToast('Demo giriş xətası. Zəhmət olmasa bir az sonra yenidən cəhd edin.', 'error');
                navigate('/');
            }
        };

        loginDemo();
    }, [navigate, setAuth, showToast]);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Demo Hazırlanır</h2>
                    <p className="text-slate-500 font-medium">Sizin üçün real data yüklənir, zəhmət olmasa gözləyin...</p>
                </div>
            </div>
        </div>
    );
};

export default DemoLogin;
