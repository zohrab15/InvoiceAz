import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clientApi from '../api/client';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { Mail, Lock, ArrowRight, Zap, Eye, EyeOff } from 'lucide-react';

import { API_URL } from '../config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();
    const showToast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await clientApi.post('/auth/login/', { email, password });
            const { access, access_token, user } = response.data;
            const token = access || access_token;

            if (token) {
                setAuth(user || { email }, token);
                showToast('Xoş gəldiniz!');
                navigate('/');
            } else {
                showToast('Token tapılmadı', 'error');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.detail ||
                error.response?.data?.email?.[0] ||
                'E-poçt və ya şifrə yanlışdır';
            showToast(errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0a0a0f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/20 rounded-full blur-[120px]" />

                <div className="relative z-10 px-16 max-w-lg">
                    <div className="flex items-center gap-2.5 mb-12 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Zap size={22} />
                        </div>
                        <span className="text-2xl font-black tracking-tight">InvoiceAZ</span>
                    </div>

                    <h2 className="text-4xl font-black leading-tight mb-6">
                        Maliyyənizi{' '}
                        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                            nəzarətdə
                        </span>{' '}
                        saxlayın
                    </h2>
                    <p className="text-white/40 text-lg font-medium leading-relaxed mb-12">
                        Faktura yaradın, xərcləri izləyin, analitikanı real-vaxtda görün. Bütün bunlar bir platformada.
                    </p>

                    {/* Mini features */}
                    <div className="space-y-5">
                        {[
                            { emoji: '⚡', text: '30 saniyədə faktura yaradın' },
                            { emoji: '📊', text: 'Real-vaxt maliyyə analitikası' },
                            { emoji: '🔒', text: 'Bank səviyyəsində təhlükəsizlik' }
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-lg">{f.emoji}</span>
                                <span className="text-sm text-white/50 font-semibold">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-10 lg:hidden cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Zap size={18} />
                        </div>
                        <span className="text-xl font-black tracking-tight">InvoiceAZ</span>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-3xl font-black tracking-tight mb-2">Daxil olun</h1>
                        <p className="text-white/40 font-medium">Hesabınıza giriş edərək davam edin</p>
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={() => window.location.href = `${API_URL}/accounts/google/login/`}
                        className="w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Google ilə davam et</span>
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest">və ya e-poçt ilə</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">E-poçt</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input
                                    type="email"
                                    required
                                    onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                    onInput={(e) => e.target.setCustomValidity('')}
                                    placeholder="ad@domain.com"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 pl-12 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Şifrə</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                    onInput={(e) => e.target.setCustomValidity('')}
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 pl-12 pr-12 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-1">
                            <Link to="/forgot-password" className="text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors">Şifrəni unutmusunuz?</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 text-sm mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Giriş et</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/[0.06] text-center">
                        <p className="text-sm text-white/30 font-medium">
                            Hələ hesabınız yoxdur?{' '}
                            <Link to="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                                Pulsuz qeydiyyat
                            </Link>
                        </p>
                    </div>


                </motion.div>
            </div>
        </div>
    );
};

export default Login;
