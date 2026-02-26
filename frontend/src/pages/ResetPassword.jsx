import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { Lock, Eye, EyeOff, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

const ResetPassword = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const showToast = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('Şifrələr eyni deyil', 'error');
            return;
        }

        if (password.length < 8) {
            showToast('Şifrə ən azı 8 simvol olmalıdır', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await clientApi.post('/auth/password/reset/confirm/', {
                uid,
                token,
                new_password: password,
                re_new_password: confirmPassword,
            });
            setIsSuccess(true);
            showToast('Şifrəniz uğurla yeniləndi');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.non_field_errors?.[0] || 'Link köhnəlmiş və ya yanlış ola bilər';
            showToast(errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0a0a0f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[120px]" />

                <div className="relative z-10 px-16 max-w-lg">
                    <div className="flex items-center gap-2.5 mb-12 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Zap size={22} />
                        </div>
                        <span className="text-2xl font-black tracking-tight">InvoiceAZ</span>
                    </div>

                    <h2 className="text-4xl font-black leading-tight mb-6">
                        Yeni şifrə{' '}
                        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                            təyin edin
                        </span>
                    </h2>
                    <p className="text-white/40 text-lg font-medium leading-relaxed mb-12">
                        Hesabınızın təhlükəsizliyini təmin etmək üçün güclü bir şifrə seçin. Ən azı 8 simvol, böyük hərf və rəqəm istifadə etməniz tövsiyə olunur.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <Motion.div
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

                    {!isSuccess ? (
                        <>
                            <div className="mb-8">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 text-white">
                                    <ShieldCheck size={28} />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">Şifrəni bərpa et</h1>
                                <p className="text-white/40 font-medium text-sm">Zəhmət olmasa aşağıda yeni şifrənizi daxil edin.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Yeni Şifrə</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 pl-12 pr-12 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">Şifrəni Təkrarla</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 pl-12 pr-12 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 text-sm"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Şifrəni Yenilə</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <Motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-black mb-3">Təbriklər!</h2>
                            <p className="text-white/40 font-medium text-sm mb-8">
                                Şifrəniz uğurla bərpa edildi. Giriş səhifəsinə yönləndirilirsiniz...
                            </p>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-white text-[#0a0a0f] font-black py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all hover:bg-white/90 text-sm"
                            >
                                İndi Giriş Et
                            </button>
                        </Motion.div>
                    )}

                    <div className="mt-8 pt-8 border-t border-white/[0.06] text-center">
                        <Link to="/login" className="text-white/30 hover:text-white/50 transition-colors text-sm font-bold">
                            Giriş səhifəsinə qayıt
                        </Link>
                    </div>
                </Motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;
