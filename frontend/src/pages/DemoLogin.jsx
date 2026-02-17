import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clientApi from '../api/client';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/Toast';

const DemoLogin = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const showToast = useToast();

    useEffect(() => {
        const loginDemo = async () => {
            try {
                // Clear existing session manually without reloading
                localStorage.removeItem('invoice_token');
                localStorage.removeItem('active_business');

                // We use the centralized clientApi for consistency
                const response = await clientApi.post('/auth/login/', {
                    email: 'demo@invoice.az',
                    password: 'demo1234'
                });

                const { access, access_token, user } = response.data;
                const token = access || access_token || response.data.key; // Added .key for dj-rest-auth default

                if (token) {
                    setAuth(user || { email: 'demo@invoice.az' }, token);
                    showToast('Demo hesaba daxil olundu. Xoş gəlmisiniz!', 'success');
                    navigate('/dashboard');
                } else {
                    console.error('No token in response:', response.data);
                    throw new Error('Token tapılmadı');
                }
            } catch (err) {
                console.error('Demo login failed:', err.response?.data || err.message);
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
