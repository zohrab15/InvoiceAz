import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { translateError } from '../api/translateErrors';
import { Mail, Lock, User, ArrowRight, Zap, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password1: '',
        password2: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const showToast = useToast();
    const [searchParams] = useSearchParams();

    // Capture referral code from URL and persist to localStorage
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            localStorage.setItem('referral_code', ref.trim().toUpperCase());
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.first_name.trim()) return showToast('Ad sahəsini doldurun', 'error');
        if (!formData.last_name.trim()) return showToast('Soyad sahəsini doldurun', 'error');
        if (!formData.email.trim()) return showToast('E-poçt ünvanını daxil edin', 'error');
        if (!formData.password1) return showToast('Şifrəni daxil edin', 'error');
        if (formData.password1 !== formData.password2) {
            return showToast('Şifrələr uyğun gəlmir', 'error');
        }

        setIsLoading(true);
        try {
            const payload = { ...formData };
            const savedRef = localStorage.getItem('referral_code');
            if (savedRef) payload.referral_code = savedRef;

            await clientApi.post('/auth/registration/', payload);
            localStorage.removeItem('referral_code');
            navigate('/verify-email-sent');
        } catch (error) {
            console.error('Registration Error Details:', error);
            showToast(translateError(error, 'Qeydiyyat zamanı xəta baş verdi'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrength = () => {
        const p = formData.password1;
        if (!p) return 0;
        let score = 0;
        if (p.length >= 6) score++;
        if (p.length >= 10) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        return Math.min(score, 4);
    };

    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500'];
    const strengthLabels = ['Zəif', 'Orta', 'Yaxşı', 'Güclü'];
    const strength = passwordStrength();

    return (
        <div className="min-h-screen w-full flex bg-[#0a0a0f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
                <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[120px]" />

                <div className="relative z-10 px-16 max-w-lg">
                    <div className="flex items-center gap-2.5 mb-12 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Zap size={22} />
                        </div>
                        <span className="text-2xl font-black tracking-tight">InvoiceAZ</span>
                    </div>

                    <h2 className="text-4xl font-black leading-tight mb-6">
                        Pulsuz hesab yaradın,{' '}
                        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            dərhal başlayın
                        </span>
                    </h2>
                    <p className="text-white/40 text-lg font-medium leading-relaxed mb-12">
                        Bank kartı tələb olunmur. 30 saniyədə qeydiyyatdan keçin və ilk fakturanızı yaradın.
                    </p>

                    {/* Benefits */}
                    <div className="space-y-5">
                        {[
                            'Limitsiz müştəri bazası',
                            'Professional PDF fakturalar',
                            'Xərc və büdcə izləmə',
                            'Tam maliyyə analitikası'
                        ].map((text, i) => (
                            <Motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <CheckCircle2 size={18} className="text-violet-400" />
                                <span className="text-sm text-white/50 font-semibold">{text}</span>
                            </Motion.div>
                        ))}
                    </div>
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

                    <div className="mb-8">
                        <h1 className="text-3xl font-black tracking-tight mb-2">Hesab yaradın</h1>
                        <p className="text-white/40 font-medium">Professional idarəetmə platformanız gözləyir</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Ad</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input
                                        type="text"
                                        name="first_name"
                                        placeholder="Adınız"
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 pl-10 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Soyad</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder="Soyadınız"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">E-poçt</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="ad@domain.com"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 pl-10 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Şifrə</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password1"
                                    placeholder="Minimum 8 simvol"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 pl-10 pr-12 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                    onChange={handleChange}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {/* Password strength */}
                            {formData.password1 && (
                                <div className="mt-2.5 flex items-center gap-2">
                                    <div className="flex gap-1 flex-1">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? strengthColors[strength - 1] : 'bg-white/[0.06]'}`} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-white/30">{strength > 0 ? strengthLabels[strength - 1] : ''}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Şifrə təsdiqi</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password2"
                                    placeholder="Şifrəni təkrar daxil edin"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 pl-10 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-white/15 text-sm font-medium"
                                    onChange={handleChange}
                                />
                                {formData.password2 && formData.password1 === formData.password2 && (
                                    <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-violet-500 to-blue-600 text-white font-black py-4 rounded-xl shadow-xl shadow-violet-500/20 flex items-center justify-center gap-2 transition-all hover:shadow-violet-500/30 active:scale-[0.98] disabled:opacity-50 text-sm mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Pulsuz hesab yarat</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-4 text-[11px] text-white/20 text-center font-medium leading-relaxed">
                        Qeydiyyatdan keçməklə <Link to="/terms" className="text-white/30 underline underline-offset-2 hover:text-blue-400 transition-colors">İstifadə Qaydaları</Link> və <Link to="/privacy" className="text-white/30 underline underline-offset-2 hover:text-blue-400 transition-colors">Məxfilik Siyasəti</Link> ilə razılaşırsınız.
                    </p>

                    <div className="mt-8 pt-8 border-t border-white/[0.06] text-center">
                        <p className="text-sm text-white/30 font-medium">
                            Artıq hesabınız var?{' '}
                            <Link to="/login" className="text-violet-400 font-bold hover:text-violet-300 transition-colors">
                                Giriş edin
                            </Link>
                        </p>
                    </div>
                </Motion.div>
            </div>
        </div>
    );
};

export default Register;
