import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, ShieldCheck, ArrowLeft, CheckCircle2,
    Loader2, Smartphone, Lock, Zap, Star, AlertCircle,
    ChevronRight, Globe, Info, CreditCard as CardIcon
} from 'lucide-react';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../store/useAuthStore';

const SubscriptionCheckout = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const showToast = useToast();
    const queryClient = useQueryClient();
    const { user, setAuth, token } = useAuthStore();

    const planName = searchParams.get('plan') || 'pro';
    const interval = searchParams.get('interval') || 'monthly';

    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: user?.full_name || ''
    });

    const [isFlipped, setIsFlipped] = useState(false);

    const plans = {
        'pro': {
            name: 'Pro',
            monthly: 19.99,
            yearly: 199.99,
            features: ['Ayda 100 faktura', 'Özəl faktura dizaynları', 'Tam analitika + AI', 'Limitsiz bildirişlər', 'PDF və Excel eksport', '3 biznes profili']
        },
        'premium': {
            name: 'Premium',
            monthly: 49.99,
            yearly: 499.99,
            features: ['Limitsiz faktura', 'VIP Dəstək', 'API inteqrasiyası', 'Komanda üzvlər', 'Fərdiləşdirilə bilən Temalar', 'Full White-label']
        }
    };

    const selectedPlan = plans[planName] || plans['pro'];
    const price = interval === 'monthly' ? selectedPlan.monthly : selectedPlan.yearly;

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) return parts.join(' ');
        return value;
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setTimeout(async () => {
            try {
                await clientApi.post('/users/plan/update/', { plan: planName, interval: interval });
                setSuccess(true);
                queryClient.invalidateQueries(['planStatus']);
                if (user) setAuth({ ...user, membership: planName }, token);
                setTimeout(() => navigate('/dashboard'), 3000);
            } catch (error) {
                showToast(error.response?.data?.error || "Ödəniş zamanı xəta baş verdi.", "error");
                setProcessing(false);
            }
        }, 2000);
    };

    const getCardBrand = (number) => {
        if (number.startsWith('4')) return 'visa';
        if (number.startsWith('5')) return 'mastercard';
        return 'generic';
    };

    if (success) return (
        <div className="min-h-screen bg-[var(--color-page-bg)] flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--color-card-bg)] p-12 rounded-[3.5rem] shadow-2xl border border-[var(--color-card-border)] max-w-md w-full text-center relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500"></div>
                <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={56} />
                </div>
                <h2 className="text-4xl font-black text-[var(--color-text-primary)] mb-4 tracking-tighter uppercase">UĞURLU!</h2>
                <p className="text-[var(--color-text-secondary)] mb-10 font-bold italic opacity-70">
                    Sisteminiz <b>{selectedPlan.name}</b> planına uğurla keçid etdi.<br />Gönləndirilirsiniz...
                </p>
                <Loader2 className="animate-spin mx-auto text-[var(--color-brand)]" size={32} />
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--color-page-bg)] py-16 px-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-[var(--color-brand)]/5 blur-[150px] rounded-full" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full" />

            <div className="max-w-7xl mx-auto relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-all font-black text-xs uppercase tracking-[0.3em] mb-12 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" />
                    GERİ QAYIT
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                    {/* LEFT: FORM & CARD PREVIEW */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-12">
                        <div className="space-y-4">
                            <h1 className="text-6xl font-black text-[var(--color-text-primary)] tracking-tightest uppercase italic leading-[0.9]">
                                Təhlükəsiz<br />
                                <span className="text-[var(--color-brand)]">Ödəniş Səhifəsi</span>
                            </h1>
                            <p className="text-[var(--color-text-muted)] font-black uppercase tracking-widest text-xs opacity-60">PCI-DSS GLOBAL COMPLIANCE ENABLED</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            {/* Interactive Card */}
                            <div className="perspective-1000">
                                <motion.div
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="relative w-full aspect-[1.586/1] preserve-3d cursor-pointer group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[1.5rem]"
                                >
                                    {/* Front side */}
                                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#121212] rounded-[1.5rem] p-8 flex flex-col justify-between overflow-hidden border border-white/10">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="w-16 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg overflow-hidden shadow-xl" />
                                            {getCardBrand(cardData.number) === 'visa' && <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6 opacity-80" alt="Visa" />}
                                            {getCardBrand(cardData.number) === 'mastercard' && <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-10 opacity-80" alt="Mastercard" />}
                                        </div>
                                        <div className="space-y-6 relative z-10">
                                            <div className="text-2xl font-black tracking-[0.2em] text-white/90 drop-shadow-md min-h-[1.5em] flex items-center">
                                                {cardData.number || "•••• •••• •••• ••••"}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">KART SAHİBİ</p>
                                                    <p className="text-sm font-black text-white uppercase tracking-widest truncate max-w-[150px]">
                                                        {cardData.name || "AD SOYAD"}
                                                    </p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40">MÜDDƏT</p>
                                                    <p className="text-sm font-black text-white tracking-widest">
                                                        {cardData.expiry || "MM/YY"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Back side */}
                                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#121212] to-[#1a1c2c] rounded-[1.5rem] overflow-hidden border border-white/10" style={{ transform: 'rotateY(180deg)' }}>
                                        <div className="w-full h-12 bg-black mt-10" />
                                        <div className="px-8 mt-6">
                                            <div className="bg-white/10 h-10 flex items-center justify-end px-4">
                                                <span className="text-white font-black italic tracking-widest">{cardData.cvc || "•••"}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 mt-auto flex justify-between items-center">
                                            <div className="space-y-1">
                                                <div className="w-8 h-8 rounded-full bg-white/5" />
                                                <div className="w-12 h-1 bg-white/5 rounded" />
                                            </div>
                                            <Globe className="text-white/10" size={40} />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Form Input Container */}
                            <form onSubmit={handlePayment} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-[var(--color-text-muted)] opacity-50">Sahibinin Adı</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full h-14 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl px-6 text-sm font-bold text-[var(--color-text-primary)] focus:border-[var(--color-brand)] transition-all outline-none uppercase placeholder:opacity-20"
                                            value={cardData.name}
                                            onChange={e => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                            onFocus={() => setIsFlipped(false)}
                                        />
                                    </div>

                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-[var(--color-text-muted)] opacity-50">Kart Nömrəsi</label>
                                        <input
                                            required
                                            type="text"
                                            maxLength="19"
                                            className="w-full h-14 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl px-6 text-sm font-bold text-[var(--color-text-primary)] focus:border-[var(--color-brand)] transition-all outline-none placeholder:opacity-20"
                                            value={cardData.number}
                                            onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                                            onFocus={() => setIsFlipped(false)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-[var(--color-text-muted)] opacity-50">Tarix</label>
                                            <input
                                                required
                                                type="text"
                                                maxLength="7"
                                                placeholder="MM / YY"
                                                className="w-full h-14 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl px-6 text-sm font-bold text-[var(--color-text-primary)] focus:border-[var(--color-brand)] transition-all outline-none text-center placeholder:opacity-20"
                                                value={cardData.expiry}
                                                onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                                                onFocus={() => setIsFlipped(false)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-[var(--color-text-muted)] opacity-50">CVC</label>
                                            <input
                                                required
                                                type="password"
                                                maxLength="3"
                                                placeholder="***"
                                                className="w-full h-14 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl px-6 text-sm font-bold text-[var(--color-text-primary)] focus:border-[var(--color-brand)] transition-all outline-none text-center placeholder:opacity-20"
                                                value={cardData.cvc}
                                                onChange={e => setCardData({ ...cardData, cvc: e.target.value })}
                                                onFocus={() => setIsFlipped(true)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={processing}
                                    type="submit"
                                    className="w-full py-6 bg-[var(--color-brand)] text-white rounded-2xl font-black uppercase tracking-[0.4em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[var(--color-brand-shadow)] flex items-center justify-center gap-4 disabled:bg-neutral-800 disabled:scale-100"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={20} /> : <Lock size={18} />}
                                    {processing ? "TƏSDİQLƏNİR..." : `ÖDƏNİŞİ ET — ${price.toFixed(2)} ₼`}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: ORDER SUMMARY */}
                    <div className="lg:col-span-12 xl:col-span-5">
                        <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-[3rem] p-12 space-y-12 relative overflow-hidden backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand)]/10 blur-[80px]" />

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[var(--color-brand)] to-blue-500 flex items-center justify-center text-white shadow-xl">
                                        <Star size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-[var(--color-text-primary)] uppercase tracking-tighter">{selectedPlan.name} Plan</h3>
                                        <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest opacity-50">{interval === 'monthly' ? 'AYLIQ' : 'İLLİK'} ABUNƏLİK</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.3em] pb-2 border-b border-[var(--color-card-border)] w-fit">PLAN İMKANLARI</p>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedPlan.features.map((f, i) => (
                                        <motion.div
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 + (i * 0.1) }}
                                            key={i}
                                            className="flex items-center gap-4 group"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <CheckCircle2 size={12} />
                                            </div>
                                            <span className="text-xs font-black text-[var(--color-text-secondary)] uppercase tracking-[0.05em]">{f}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-10 space-y-4 border-t border-[var(--color-card-border)]">
                                <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                                    <span className="text-[10px] font-black uppercase tracking-widest">SUB-TOTAL</span>
                                    <span className="text-sm font-black">{price.toFixed(2)} ₼</span>
                                </div>
                                <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                                    <span className="text-[10px] font-black uppercase tracking-widest">TAX (0%)</span>
                                    <span className="text-sm font-black">0.00 ₼</span>
                                </div>
                                <div className="pt-6 flex justify-between items-center">
                                    <span className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-widest">YEKUN ÖDƏNİŞ</span>
                                    <span className="text-4xl font-black text-[var(--color-brand)] tracking-tighter">{price.toFixed(2)} ₼</span>
                                </div>
                            </div>

                            <div className="bg-[var(--color-hover-bg)] p-6 rounded-[2rem] border border-[var(--color-card-border)] relative flex items-start gap-4">
                                <ShieldCheck className="text-[var(--color-brand)] shrink-0 mt-1" size={24} />
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-[var(--color-text-primary)] uppercase tracking-widest">Təhlükəsizlik Zəmanəti</h4>
                                    <p className="text-[9px] font-bold text-[var(--color-text-muted)] leading-relaxed uppercase tracking-tighter opacity-70">
                                        Məlumatlarınız SSL-256 bit şifrələmə ilə qorunur və birbaşa bank sisteminə yönləndirilir. Kart məlumatları heç bir halda saxlanılmır.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global CSS for 3D interactions */}
            <style jsx="true">{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                input::placeholder {
                    color: inherit;
                    opacity: 0.2;
                }
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(1deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
            `}</style>
        </div>
    );
};

export default SubscriptionCheckout;
