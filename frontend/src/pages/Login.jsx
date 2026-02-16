import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clientApi from '../api/client';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { LogIn, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();
    const showToast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await clientApi.post('/auth/login/', { email, password });
            console.log('Login response:', response.data);
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
            console.error('Login error details:', error.response?.data);
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
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-inter">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass-dark text-white rounded-3xl shadow-2xl z-10 mx-4"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-4 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30"
                    >
                        <ShieldCheck size={32} />
                    </motion.div>
                    <h1 className="text-4xl font-black font-outfit tracking-tighter">InvoiceAZ</h1>
                    <p className="text-slate-400 mt-2">Davam etmək üçün giriş edin</p>
                </div>

                <div className="space-y-4 mb-8">
                    <button
                        onClick={() => window.location.href = 'http://localhost:8000/accounts/google/login/'}
                        className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] border border-slate-200"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Google ilə davam et</span>
                    </button>

                    <div className="flex items-center space-x-4 py-2">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest whitespace-nowrap">və ya e-poçt ilə</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="email"
                                required
                                placeholder="E-poçt ünvanı"
                                className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                placeholder="Şifrə"
                                className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" size="sm" className="text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors">Şifrəni unutmusunuz?</Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Giriş et</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Hələ hesabınız yoxdur? <br />
                        <Link to="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors inline-flex items-center gap-1 group">
                            İndi qeydiyyatdan keçin
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </p>
                    <div className="mt-6 p-4 bg-slate-800/20 rounded-2xl border border-slate-700/30">
                        <p className="text-[10px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">Demo hesab</p>
                        <p className="text-xs text-slate-500 font-medium">admin@invoice.az · <span className="text-slate-400">admin123</span></p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
