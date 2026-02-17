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
                // Clear existing session manually without reloading
                localStorage.removeItem('invoice_token');
                localStorage.removeItem('active_business');

                // Use fresh axios call to bypass any interceptors
                const response = await axios.post(`${API_URL}/api/auth/login/`, {
                    email: 'demo@invoice.az',
                    username: 'demo@invoice.az', // Added for better compatibility
                    password: 'demo1234'
                });

                console.log('Demo Login Success Response:', response.data);

                const { access, access_token, user, key } = response.data;
                const token = access || access_token || key;

                if (token) {
                    setAuth(user || { email: 'demo@invoice.az' }, token);
                    showToast('Demo hesaba daxil olundu. Xoş gəlmisiniz!', 'success');
                    navigate('/dashboard');
                } else {
                    console.error('No token in demo response:', response.data);
                    throw new Error('Token tapılmadı');
                }
            } catch (err) {
                console.error('--- DEMO LOGIN ERROR ---', err);
                const status = err.response?.status;
                const errorData = err.response?.data;
                const errorMessage = errorData?.detail || errorData?.non_field_errors?.[0] || err.message;

                showToast(`Demo giriş xətası (${status || 'Network Error'}): ${errorMessage}`, 'error');
                console.error('Response Status:', status);
                console.error('Response Data:', errorData);

                // Don't navigate away immediately so the user can see the error
                setTimeout(() => navigate('/'), 3000);
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
