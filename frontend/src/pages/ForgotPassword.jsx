import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { KeyRound, Mail, ArrowLeft, Send, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const showToast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await clientApi.post('/auth/password/reset/', { email });
            setIsSent(true);
            showToast('Sıfırlama linki e-poçt ünvanınıza göndərildi');
        } catch (error) {
            showToast('Xəta baş verdi. E-poçt ünvanını yoxlayın', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0a0a0f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/15 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[120px]" />

                <div className="relative z-10 px-16 max-w-lg">
                    <div className="flex items-center gap-2.5 mb-12 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Zap size={22} />
                        </div>
                        <span className="text-2xl font-black tracking-tight">InvoiceAZ</span>
                    </div>

                    <h2 className="text-4xl font-black leading-tight mb-6">
                        Şifrənizi{' '}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            bərpa edin
                        </span>
                    </h2>
                    <p className="text-white/40 text-lg font-medium leading-relaxed mb-12">
                        E-poçt ünvanınızı daxil edin və biz sizə şifrə sıfırlama linki göndərəcəyik. Prosess sadə və təhlükəsizdir.
                    </p>

                    <div className="space-y-5">
                        {[
                            { emoji: '📧', text: 'E-poçtunuzu daxil edin' },
                            { emoji: '🔗', text: 'Sıfırlama linkini alın' },
                            { emoji: '🔐', text: 'Yeni şifrə təyin edin' }
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.15 }}
                                className="flex items-center gap-3"
                            >
                                <span className="text-lg">{f.emoji}</span>
                                <span className="text-sm text-white/50 font-semibold">{f.text}</span>
                            </motion.div>
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

                    {!isSent ? (
                        <>
                            <div className="mb-8">
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                                    <KeyRound size={28} />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">Şifrəni unutmusunuz?</h1>
                                <p className="text-white/40 font-medium">E-poçtunuzu yazın, biz sizə bərpa linki göndərək.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">E-poçt ünvanı</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                        <input
                                            type="email"
                                            required
                                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            placeholder="ad@domain.com"
                                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 pl-12 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black py-4 rounded-xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:shadow-amber-500/30 active:scale-[0.98] disabled:opacity-50 text-sm"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Sıfırlama linki göndər</span>
                                            <Send size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-black mb-3">Link göndərildi!</h2>
                            <p className="text-white/40 font-medium text-sm mb-2">
                                Sıfırlama təlimatları aşağıdakı ünvana göndərildi:
                            </p>
                            <p className="text-white/70 font-bold text-sm mb-8 bg-white/[0.04] px-4 py-2.5 rounded-lg inline-block border border-white/[0.06]">
                                {email}
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setIsSent(false)}
                                    className="w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
                                >
                                    <RefreshCw size={16} />
                                    <span>Yenidən göndər</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    <div className="mt-8 pt-8 border-t border-white/[0.06] text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors text-sm font-bold">
                            <ArrowLeft size={16} />
                            <span>Giriş səhifəsinə qayıt</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
