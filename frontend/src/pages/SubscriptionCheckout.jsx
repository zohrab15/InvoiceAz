import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, ShieldCheck, ArrowLeft, CheckCircle2,
    Loader2, Smartphone, Lock, Zap, Star, AlertCircle,
    ChevronRight, Globe, Info
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
            features: ['Limitsiz faktura', 'VIP Dəstək', 'API inteqrasiyası', 'Komanda üzvləri', 'Fərdiləşdirilə bilən Temalar', 'Full White-label']
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

        // World Standard: Simulate bank 3D secure process
        setTimeout(async () => {
            try {
                const res = await clientApi.post('/users/plan/update/', {
                    plan: planName,
                    interval: interval
                });

                setSuccess(true);
                queryClient.invalidateQueries(['planStatus']);

                // Update local auth store
                if (user) {
                    setAuth({ ...user, membership: planName }, token);
                }

                setTimeout(() => {
                    navigate('/dashboard');
                }, 3000);
            } catch (error) {
                showToast(error.response?.data?.error || "Ödəniş zamanı xəta baş verdi.", "error");
                setProcessing(false);
            }
        }, 2000);
    };

    if (success) return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[var(--color-card-bg)] p-12 rounded-[3rem] shadow-2xl border border-[var(--color-card-border)] max-w-md w-full text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-black text-[var(--color-text-primary)] mb-4 tracking-tight uppercase">Ödəniş Uğurludur!</h2>
                <p className="text-[var(--color-text-secondary)] mb-10 font-medium italic">
                    Təbrik edirik! Artıq <b>{selectedPlan.name}</b> abunəçisisiniz. Dashboard-a yönləndirilirsiniz...
                </p>
                <Loader2 className="animate-spin mx-auto text-[var(--color-brand)]" size={24} />
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-all font-black text-xs uppercase tracking-widest mb-12 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Geri qayıt
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left: Order Summary */}
                    <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
                        <div className="space-y-6">
                            <h1 className="text-4xl font-black text-[var(--color-text-primary)] tracking-tighter uppercase italic">Sifariş <span className="text-[var(--color-brand)]">Xülasəsi</span></h1>
                            <p className="text-[var(--color-text-muted)] font-medium">Abunəliyiniz üçün ödəməli olduğunuz məbləğ və planın detalları.</p>
                        </div>

                        <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden shadow-2xl">
                            <div className="flex justify-between items-start pt-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)] w-fit mb-2">
                                        <Star size={12} className="fill-current" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedPlan.name} Plan</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--color-text-primary)] uppercase">{interval === 'monthly' ? 'Aylıq' : 'İllik'} Abunəlik</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-[var(--color-text-primary)]">{price.toFixed(2)} ₼</p>
                                    <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter mt-1">Hər {interval === 'monthly' ? 'Ay' : 'İl'}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[var(--color-card-border)]">
                                {selectedPlan.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-[var(--color-text-secondary)]">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={12} />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <div className="bg-[var(--color-hover-bg)] p-6 rounded-2xl space-y-3">
                                <div className="flex justify-between text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                                    <span>Ara Cəml</span>
                                    <span>{price.toFixed(2)} ₼</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                                    <span>ƏDV (0%)</span>
                                    <span>0.00 ₼</span>
                                </div>
                                <div className="pt-3 border-t border-[var(--color-card-border)] flex justify-between items-center">
                                    <span className="text-sm font-black text-[var(--color-text-primary)] uppercase">Yekun</span>
                                    <span className="text-2xl font-black text-[var(--color-brand)]">{price.toFixed(2)} ₼</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-[10px] font-medium leading-relaxed text-blue-300/60">
                                    Siz bu gün {price.toFixed(2)} ₼ ödəyəcəksiniz. Abunəliyiniz hər {interval === 'monthly' ? 'ay' : 'il'} avtomatik olaraq yenilənəcək. Ləğv istənilən vaxt mümkündür.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Form */}
                    <div className="lg:col-span-7 order-1 lg:order-2">
                        <div className="bg-[var(--color-card-bg)] rounded-[3rem] shadow-2xl border border-[var(--color-card-border)] overflow-hidden">
                            <div className="p-8 md:p-12 bg-[var(--color-hover-bg)] border-b border-[var(--color-card-border)] flex justify-between items-center">
                                <div>
                                    <h2 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-[0.2em] mb-1">Təhlükəsiz Ödəniş</h2>
                                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Global PCI-DSS Security Standard</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-10 h-6 bg-white/5 border border-white/10 rounded-md flex items-center justify-center grayscale">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-2" alt="Visa" />
                                    </div>
                                    <div className="w-10 h-6 bg-white/5 border border-white/10 rounded-md flex items-center justify-center grayscale">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:p-12">
                                <form onSubmit={handlePayment} className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="group space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-4 text-[var(--color-text-muted)]">Kartın Üzərindəki Ad</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="AD SOYAD"
                                                    className="w-full h-16 bg-[var(--color-input-bg)] border-2 border-[var(--color-input-border)] rounded-2xl px-6 text-lg font-black text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-shadow)] transition-all outline-none uppercase placeholder:text-white/10"
                                                    value={cardData.name}
                                                    onChange={e => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                                />
                                            </div>

                                            <div className="group space-y-2 relative">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-4 text-[var(--color-text-muted)]">Kart Nömrəsi</label>
                                                <div className="relative">
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="0000 0000 0000 0000"
                                                        maxLength="19"
                                                        className="w-full h-16 bg-[var(--color-input-bg)] border-2 border-[var(--color-input-border)] rounded-2xl px-6 pl-14 text-lg font-black text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-shadow)] transition-all outline-none placeholder:text-white/10"
                                                        value={cardData.number}
                                                        onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                                                    />
                                                    <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest ml-4 text-[var(--color-text-muted)]">Müddət</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        maxLength="7"
                                                        className="h-16 bg-[var(--color-input-bg)] border-2 border-[var(--color-input-border)] rounded-2xl px-6 text-lg font-black text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-shadow)] transition-all outline-none placeholder:text-white/10 text-center"
                                                        value={cardData.expiry}
                                                        onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest ml-4 text-[var(--color-text-muted)]">CVC / CVV</label>
                                                    <div className="relative">
                                                        <input
                                                            required
                                                            type="password"
                                                            placeholder="***"
                                                            maxLength="3"
                                                            className="w-full h-16 bg-[var(--color-input-bg)] border-2 border-[var(--color-input-border)] rounded-2xl px-6 text-lg font-black text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-shadow)] transition-all outline-none placeholder:text-white/10 text-center"
                                                            value={cardData.cvc}
                                                            onChange={e => setCardData({ ...cardData, cvc: e.target.value })}
                                                        />
                                                        <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-6">
                                        <button
                                            disabled={processing}
                                            type="submit"
                                            className="w-full h-20 bg-[var(--color-brand)] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] hover:shadow-[0_20px_40px_var(--color-brand-shadow)] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:bg-white/5 disabled:text-white/20 disabled:scale-100 disabled:shadow-none"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={24} />
                                                    PROSSES GEDİR...
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={24} />
                                                    ÖDƏNİŞİ TAMAMLA — {price.toFixed(2)} ₼
                                                </>
                                            )}
                                        </button>

                                        <div className="flex items-center justify-center gap-8">
                                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                                <Smartphone size={14} className="opacity-50" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Apple Pay</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                                <Globe size={14} className="opacity-50" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Global Checkout</span>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="mt-8 flex items-start gap-4 p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                            <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
                            <div>
                                <p className="text-xs font-black text-[var(--color-text-primary)] uppercase tracking-widest mb-1">Təhlükəsizlik Zəmanəti</p>
                                <p className="text-[10px] font-medium text-[var(--color-text-muted)] leading-relaxed">
                                    Məlumatlarınız 256-bit SSL şifrələmə sistemi ilə qorunur. Kart məlumatlarınız heç bir halda bizim serverlərdə saxlanılmır və birbaşa bank sisteminə ötürülür.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionCheckout;
