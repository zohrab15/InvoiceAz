import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck, Database, Rocket, LayoutDashboard } from 'lucide-react';

const DemoLogin = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const showToast = useToast();

    const [loadingStep, setLoadingStep] = useState(0);
    const [progress, setProgress] = useState(0);

    const steps = [
        { icon: <Database size={24} />, text: "Məlumat bazası ilə əlaqə qurulur..." },
        { icon: <ShieldCheck size={24} />, text: "Təhlükəsizlik protokolları yoxlanılır..." },
        { icon: <Zap size={24} />, text: "Demo hesab konfiqurasiya edilir..." },
        { icon: <LayoutDashboard size={24} />, text: "İdarəetmə paneli hazırlanır..." },
        { icon: <Rocket size={24} />, text: "Sizə giriş icazəsi verilir..." }
    ];

    useEffect(() => {
        let isMounted = true;
        const startTime = Date.now();

        const loginDemo = async () => {
            try {
                // Clear existing session
                localStorage.removeItem('invoice_token');
                localStorage.removeItem('active_business');

                const response = await axios.post(`${API_URL}/api/auth/login/`, {
                    email: 'demo_user@invoice.az',
                    password: 'demopassword123'
                });

                const { access, access_token, user, key } = response.data;
                const token = access || access_token || key;

                if (token) {
                    // Calculate how much time is left to reach 10 seconds total
                    const elapsedTime = Date.now() - startTime;
                    const remainingTime = Math.max(10500 - elapsedTime, 0);

                    setTimeout(() => {
                        if (isMounted) {
                            setAuth(user || { email: 'demo@invoice.az' }, token);
                            navigate('/dashboard');
                            showToast('Xoş gəlmisiniz! Demo rejimində limitsiz istifadə edə bilərsiniz.', 'success');
                        }
                    }, remainingTime);
                }
            } catch (err) {
                console.error('Demo Login Error:', err);
                showToast('Demo giriş xətası baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.', 'error');
                setTimeout(() => navigate('/'), 2000);
            }
        };

        loginDemo();

        // Increment loading steps and progress bar
        const stepInterval = setInterval(() => {
            setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 2050);

        const progressInterval = setInterval(() => {
            setProgress(prev => (prev < 100 ? prev + 1 : 100));
        }, 100);

        return () => {
            isMounted = false;
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, [navigate, setAuth, showToast]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0f] text-white font-inter overflow-hidden relative">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />

            <div className="relative z-10 w-full max-w-sm px-6">
                <div className="flex flex-col items-center text-center">
                    {/* Brand Logo */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center gap-3 mb-12"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                            <Zap size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight">InvoiceAZ</span>
                    </motion.div>

                    {/* Step Icon Animation */}
                    <div className="h-20 flex items-center justify-center mb-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={loadingStep}
                                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
                                className="text-blue-500 bg-blue-500/10 p-5 rounded-3xl border border-blue-500/20"
                            >
                                {steps[loadingStep].icon}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <h2 className="text-xl font-black mb-3">Professional Demo</h2>
                    <div className="h-6 flex items-center justify-center overflow-hidden mb-10">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={loadingStep}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="text-white/40 font-medium text-sm tracking-wide"
                            >
                                {steps[loadingStep].text}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-white/[0.03] border border-white/[0.06] h-2.5 rounded-full overflow-hidden mb-2">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-violet-600"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                    <div className="flex justify-between w-full text-[10px] font-bold text-white/10 uppercase tracking-widest">
                        <span>Sistem Hazırlanır</span>
                        <span>{progress}%</span>
                    </div>
                </div>
            </div>

            {/* Bottom Tagline */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-white/5 text-[10px] font-bold uppercase tracking-[0.4em]">
                    Premium Invoicing Experience
                </p>
            </div>
        </div>
    );
};

export default DemoLogin;
