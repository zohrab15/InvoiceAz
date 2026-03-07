import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CreditCard, ShieldCheck, ArrowLeft, CheckCircle2,
    Loader2, Lock, Globe, Crown, Zap,
    Clock, Sparkles, BadgeCheck
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
        pro: {
            name: 'Pro',
            monthly: 19.99,
            yearly: 199.99,
            color: 'var(--color-brand)',
            gradient: 'linear-gradient(135deg, var(--color-brand), #8b5cf6)',
            icon: <Zap size={28} />,
            features: [
                'Ayda 100 faktura',
                'Limitsiz müştəri & xərc',
                '5 komanda üzvü',
                'Premium PDF dizaynları',
                'E-poçtla faktura göndərmə',
                'E-qaimə XML (e-vergi)',
                'Proqnoz analitikası + AI',
                'CSV / Excel eksport',
                'Ödəniş & vergi hesabatları',
                'Çoxvalyutalı dəstək',
            ]
        },
        premium: {
            name: 'Premium',
            monthly: 49.99,
            yearly: 499.99,
            color: '#f59e0b',
            gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            icon: <Crown size={28} />,
            features: [
                'Limitsiz hər şey',
                'Limitsiz komanda üzvü',
                'Pro-dakı bütün xüsusiyyətlər',
                'GPS ilə komanda izləmə',
                'REST API inteqrasiyası',
                'White-label (brendsiz PDF)',
                'VIP prioritet dəstək',
                'Limitsiz yaddaş',
            ]
        }
    };

    const selectedPlan = plans[planName] || plans.pro;
    const price = interval === 'monthly' ? selectedPlan.monthly : selectedPlan.yearly;
    const monthlyEquivalent = interval === 'yearly' ? (selectedPlan.yearly / 12).toFixed(2) : null;

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : value;
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\D/g, '');
        if (v.length >= 2) return v.substring(0, 2) + ' / ' + v.substring(2, 4);
        return v;
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setTimeout(async () => {
            try {
                await clientApi.post('/users/plan/update/', { plan: planName, interval });
                setSuccess(true);
                queryClient.invalidateQueries(['planStatus']);
                if (user) setAuth({ ...user, membership: planName }, token);
                setTimeout(() => navigate('/dashboard'), 3000);
            } catch (error) {
                showToast(error.response?.data?.error || 'Ödəniş zamanı xəta baş verdi.', 'error');
                setProcessing(false);
            }
        }, 2000);
    };

    const getCardBrand = (number) => {
        const clean = number.replace(/\s/g, '');
        if (clean.startsWith('4')) return 'visa';
        if (/^5[1-5]/.test(clean)) return 'mastercard';
        return 'generic';
    };

    // ── Success Screen ──
    if (success) return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-page-bg)' }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="max-w-lg w-full text-center relative overflow-hidden rounded-3xl border p-16"
                style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
                    style={{ backgroundColor: 'rgba(16,185,129,0.1)', boxShadow: '0 0 60px rgba(16,185,129,0.15)' }}
                >
                    <CheckCircle2 size={48} className="text-emerald-500" />
                </motion.div>

                <h2 className="text-3xl font-black mb-3 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                    Ödəniş Uğurludur!
                </h2>
                <p className="text-sm font-medium mb-8" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{selectedPlan.name}</span> planına uğurla keçid etdiniz.
                    <br />Dashboard-a yönləndirilirsiniz...
                </p>

                <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl mx-auto w-fit" style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                    <BadgeCheck size={18} className="text-emerald-500" />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                        {selectedPlan.name} plan aktivdir
                    </span>
                </div>

                <Loader2 className="animate-spin mx-auto mt-8" size={24} style={{ color: 'var(--color-brand)' }} />
            </motion.div>
        </div>
    );

    // ── Main Checkout ──
    return (
        <div className="min-h-screen py-10 px-4 md:px-8 relative overflow-hidden" style={{ backgroundColor: 'var(--color-page-bg)' }}>
            {/* Background Effects */}
            <div className="absolute -top-[30%] -right-[15%] w-[50%] h-[50%] rounded-full blur-[200px] pointer-events-none" style={{ backgroundColor: selectedPlan.color, opacity: 0.04 }} />
            <div className="absolute -bottom-[30%] -left-[15%] w-[40%] h-[40%] rounded-full blur-[200px] pointer-events-none" style={{ backgroundColor: 'rgba(59,130,246,0.04)' }} />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all hover:gap-3 group"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Geri qayıt
                    </button>
                    <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
                        <Lock size={12} />
                        <span>SSL ilə qorunur</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 items-start">
                    {/* ── LEFT: Payment Form (3 cols) ── */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Title */}
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                                Ödəniş məlumatları
                            </h1>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                Kart məlumatlarınızı daxil edin. Bütün əməliyyatlar şifrələnir.
                            </p>
                        </div>

                        {/* Card Preview + Form */}
                        <div className="rounded-3xl border p-8 md:p-10 space-y-10" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>

                            {/* Interactive 3D Card */}
                            <div className="max-w-sm mx-auto perspective-1000">
                                <motion.div
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    className="relative w-full aspect-[1.586/1] preserve-3d cursor-pointer rounded-2xl"
                                    style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))' }}
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    {/* Front */}
                                    <div className="absolute inset-0 backface-hidden rounded-2xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden border border-white/10"
                                        style={{ background: planName === 'premium'
                                            ? 'linear-gradient(135deg, #1a1520 0%, #2d1810 50%, #1a1520 100%)'
                                            : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
                                        }}
                                    >
                                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="w-12 h-9 bg-gradient-to-br from-amber-300 to-amber-600 rounded-md shadow-lg" style={{ boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }} />
                                            <div className="flex items-center gap-2">
                                                {getCardBrand(cardData.number) === 'visa' && (
                                                    <span className="text-white/80 text-lg font-black italic tracking-tighter">VISA</span>
                                                )}
                                                {getCardBrand(cardData.number) === 'mastercard' && (
                                                    <div className="flex -space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-red-500/80" />
                                                        <div className="w-6 h-6 rounded-full bg-amber-500/80" />
                                                    </div>
                                                )}
                                                {getCardBrand(cardData.number) === 'generic' && (
                                                    <CreditCard size={22} className="text-white/30" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-4 relative z-10">
                                            <div className="text-lg sm:text-xl font-bold tracking-[0.15em] text-white/90 font-mono min-h-[1.5em]">
                                                {cardData.number || '•••• •••• •••• ••••'}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[7px] font-bold uppercase tracking-widest text-white/30 mb-0.5">KART SAHİBİ</p>
                                                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider truncate max-w-[140px]">
                                                        {cardData.name || 'AD SOYAD'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[7px] font-bold uppercase tracking-widest text-white/30 mb-0.5">MÜDDƏT</p>
                                                    <p className="text-xs font-bold text-white/80 tracking-wider font-mono">
                                                        {cardData.expiry || 'MM / YY'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Back */}
                                    <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border border-white/10"
                                        style={{ transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
                                    >
                                        <div className="w-full h-11 bg-black/80 mt-8" />
                                        <div className="px-6 mt-5">
                                            <div className="bg-white/10 backdrop-blur h-9 rounded flex items-center justify-end px-4">
                                                <span className="text-white font-bold text-sm tracking-widest font-mono">{cardData.cvc || '•••'}</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-5 right-6">
                                            <Globe className="text-white/10" size={32} />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handlePayment} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--color-text-muted)' }}>Kart sahibinin adı</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ad Soyad"
                                        className="w-full h-13 rounded-xl px-4 text-sm font-semibold border transition-all outline-none focus:ring-2 focus:ring-offset-1 uppercase"
                                        style={{
                                            backgroundColor: 'var(--color-hover-bg)',
                                            borderColor: 'var(--color-card-border)',
                                            color: 'var(--color-text-primary)',
                                            '--tw-ring-color': selectedPlan.color,
                                        }}
                                        value={cardData.name}
                                        onChange={e => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                        onFocus={() => setIsFlipped(false)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--color-text-muted)' }}>Kart nömrəsi</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            maxLength="19"
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full h-13 rounded-xl px-4 pr-14 text-sm font-semibold border transition-all outline-none focus:ring-2 focus:ring-offset-1 font-mono tracking-wider"
                                            style={{
                                                backgroundColor: 'var(--color-hover-bg)',
                                                borderColor: 'var(--color-card-border)',
                                                color: 'var(--color-text-primary)',
                                                '--tw-ring-color': selectedPlan.color,
                                            }}
                                            value={cardData.number}
                                            onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                                            onFocus={() => setIsFlipped(false)}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {getCardBrand(cardData.number) === 'visa' && (
                                                <span className="text-xs font-black italic tracking-tighter" style={{ color: 'var(--color-text-muted)' }}>VISA</span>
                                            )}
                                            {getCardBrand(cardData.number) === 'mastercard' && (
                                                <div className="flex -space-x-1.5">
                                                    <div className="w-4 h-4 rounded-full bg-red-500/60" />
                                                    <div className="w-4 h-4 rounded-full bg-amber-500/60" />
                                                </div>
                                            )}
                                            {getCardBrand(cardData.number) === 'generic' && (
                                                <CreditCard size={16} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--color-text-muted)' }}>Son istifadə tarixi</label>
                                        <input
                                            required
                                            type="text"
                                            maxLength="7"
                                            placeholder="MM / YY"
                                            className="w-full h-13 rounded-xl px-4 text-sm font-semibold border transition-all outline-none focus:ring-2 focus:ring-offset-1 text-center font-mono tracking-wider"
                                            style={{
                                                backgroundColor: 'var(--color-hover-bg)',
                                                borderColor: 'var(--color-card-border)',
                                                color: 'var(--color-text-primary)',
                                                '--tw-ring-color': selectedPlan.color,
                                            }}
                                            value={cardData.expiry}
                                            onChange={e => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                                            onFocus={() => setIsFlipped(false)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--color-text-muted)' }}>CVC / CVV</label>
                                        <input
                                            required
                                            type="password"
                                            maxLength="4"
                                            placeholder="•••"
                                            className="w-full h-13 rounded-xl px-4 text-sm font-semibold border transition-all outline-none focus:ring-2 focus:ring-offset-1 text-center font-mono tracking-widest"
                                            style={{
                                                backgroundColor: 'var(--color-hover-bg)',
                                                borderColor: 'var(--color-card-border)',
                                                color: 'var(--color-text-primary)',
                                                '--tw-ring-color': selectedPlan.color,
                                            }}
                                            value={cardData.cvc}
                                            onChange={e => setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, '') })}
                                            onFocus={() => setIsFlipped(true)}
                                            onBlur={() => setIsFlipped(false)}
                                        />
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <motion.button
                                    whileHover={{ scale: processing ? 1 : 1.01 }}
                                    whileTap={{ scale: processing ? 1 : 0.98 }}
                                    disabled={processing}
                                    type="submit"
                                    className="w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 mt-4 text-white disabled:opacity-60"
                                    style={{
                                        background: processing ? 'var(--color-hover-bg)' : selectedPlan.gradient,
                                        color: processing ? 'var(--color-text-muted)' : (planName === 'premium' ? '#000' : '#fff'),
                                        boxShadow: processing ? 'none' : `0 8px 30px ${planName === 'premium' ? 'rgba(245,158,11,0.25)' : 'var(--color-brand-shadow)'}`,
                                    }}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>Təsdiqlənir...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={16} />
                                            <span>Ödənişi tamamla — {price.toFixed(2)} &#8380;</span>
                                        </>
                                    )}
                                </motion.button>

                                {/* Trust Badges */}
                                <div className="flex items-center justify-center gap-6 pt-2">
                                    {[
                                        { icon: <ShieldCheck size={14} />, text: 'SSL-256' },
                                        { icon: <Lock size={14} />, text: 'PCI DSS' },
                                        { icon: <Globe size={14} />, text: '3D Secure' },
                                    ].map((badge, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>
                                            {badge.icon}
                                            {badge.text}
                                        </div>
                                    ))}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── RIGHT: Order Summary (2 cols) ── */}
                    <div className="xl:col-span-2">
                        <div className="rounded-3xl border overflow-hidden sticky top-10" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>

                            {/* Plan Header */}
                            <div className="p-6 relative overflow-hidden" style={{ background: selectedPlan.gradient }}>
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, white 0%, transparent 50%)' }} />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
                                        {selectedPlan.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight">{selectedPlan.name}</h3>
                                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                                            {interval === 'monthly' ? 'Aylıq' : 'İllik'} abunəlik
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Price */}
                                <div className="text-center py-4">
                                    <div className="text-4xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                                        {price.toFixed(2)} <span className="text-lg">&#8380;</span>
                                    </div>
                                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                        {interval === 'monthly' ? 'aylıq ödəniş' : 'illik ödəniş'}
                                    </p>
                                    {monthlyEquivalent && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500"
                                        >
                                            <Sparkles size={12} />
                                            ~{monthlyEquivalent} &#8380; / ay (2 ay pulsuz)
                                        </motion.div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t" style={{ borderColor: 'var(--color-card-border)' }} />

                                {/* Features */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                        Plana daxildir
                                    </p>
                                    <div className="space-y-2.5">
                                        {selectedPlan.features.map((f, i) => (
                                            <motion.div
                                                initial={{ x: -8, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 + i * 0.05 }}
                                                key={i}
                                                className="flex items-center gap-2.5"
                                            >
                                                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{f}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t" style={{ borderColor: 'var(--color-card-border)' }} />

                                {/* Totals */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Alt cəm</span>
                                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{price.toFixed(2)} &#8380;</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Vergi (ƏDV 0%)</span>
                                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>0.00 &#8380;</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between items-center" style={{ borderColor: 'var(--color-card-border)' }}>
                                        <span className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>Yekun</span>
                                        <span className="text-2xl font-black" style={{ color: selectedPlan.color }}>{price.toFixed(2)} &#8380;</span>
                                    </div>
                                </div>

                                {/* Security Note */}
                                <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                                    <ShieldCheck size={18} className="shrink-0 mt-0.5" style={{ color: selectedPlan.color }} />
                                    <div>
                                        <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Təhlükəsiz ödəniş</p>
                                        <p className="text-[10px] font-medium leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                            Məlumatlarınız 256-bit SSL şifrələmə ilə qorunur. Kart məlumatları serverimizdə saxlanılmır.
                                        </p>
                                    </div>
                                </div>

                                {/* Cancel Info */}
                                <div className="flex items-center gap-2 justify-center pt-1">
                                    <Clock size={12} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
                                    <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
                                        İstənilən vaxt ləğv edə bilərsiniz
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for 3D card */}
            <style jsx="true">{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .h-13 { height: 3.25rem; }
            `}</style>
        </div>
    );
};

export default SubscriptionCheckout;
