import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Zap, Crown, Check, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import clientApi from '../api/client';
import useAuthStore from '../store/useAuthStore';
import { useToast } from '../components/Toast';

const PricingPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const { user } = useAuthStore();
    const currentPlan = user?.membership || 'free';
    const [billingInterval, setBillingInterval] = React.useState('monthly');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubscribe = async (planName) => {
        if (planName === currentPlan) return;
        setIsSubmitting(true);
        try {
            navigate(`/payment/checkout?plan=${planName}&interval=${billingInterval}`);
        } catch (error) {
            showToast(error.response?.data?.error || "Abunəlik yenilənərkən xəta baş verdi.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (currentPlan === 'free') return;
        const confirmed = window.confirm("Abunəliyinizi ləğv etmək istədiyinizə əminsiniz?");
        if (!confirmed) return;
        setIsSubmitting(true);
        try {
            await clientApi.post('/users/plan/cancel/');
            showToast("Abunəliyiniz ləğv edildi.", "success");
            queryClient.invalidateQueries(['planStatus']);
        } catch (error) {
            showToast(error.response?.data?.error || "Xəta baş verdi.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const PlanBadge = ({ plan }) => {
        if (currentPlan !== plan) return null;
        return (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg" style={{ backgroundColor: 'var(--color-brand)' }}>
                Hazirkl Plan
            </div>
        );
    };

    const comparisonData = [
        { section: 'Kemiyyet Limitlari' },
        { f: 'Aylik faktura', free: '5', pro: '100', premium: 'Limitsiz' },
        { f: 'Musteri', free: '10', pro: 'Limitsiz', premium: 'Limitsiz' },
        { f: 'Aylik xerc', free: '15', pro: 'Limitsiz', premium: 'Limitsiz' },
        { f: 'Biznes profili', free: '1', pro: '3', premium: 'Limitsiz' },
        { f: 'Mehsul', free: '20', pro: '500', premium: 'Limitsiz' },
        { f: 'Komanda uzvu', free: '0', pro: '5', premium: 'Limitsiz' },
        { f: 'Anbar', free: '1', pro: '3', premium: 'Limitsiz' },
        { f: 'Satinalma sifarisi / ay', free: '5', pro: '50', premium: 'Limitsiz' },
        { f: 'Yaddas', free: '50 MB', pro: '500 MB', premium: 'Limitsiz' },
        { section: 'Faktura Xususiyyetleri' },
        { f: 'Premium PDF dizaynlari', free: false, pro: true, premium: true },
        { f: 'Ozel faktura temalari', free: false, pro: true, premium: true },
        { f: 'E-pocla faktura gonderm\u0259', free: false, pro: true, premium: true },
        { f: 'E-qaime XML (e-vergi)', free: false, pro: true, premium: true },
        { f: 'Faktura dublikat etme', free: true, pro: true, premium: true },
        { f: 'Ictimai faktura linki', free: true, pro: true, premium: true },
        { f: 'Vaxtke\u00e7mis xatirlatma', free: false, pro: true, premium: true },
        { f: 'White-label PDF', free: false, pro: false, premium: true },
        { section: 'Analitika & Hesabatlar' },
        { f: 'Dashboard & esas statistika', free: true, pro: true, premium: true },
        { f: 'Proqnoz analitikasi (AI)', free: false, pro: true, premium: true },
        { f: 'Odenis analitikasi', free: false, pro: true, premium: true },
        { f: 'Vergi hesabatlari', free: false, pro: true, premium: true },
        { f: 'CSV / Excel eksport', free: false, pro: true, premium: true },
        { f: 'Musteri reytinqi (A-D)', free: false, pro: true, premium: true },
        { f: 'Fealiyyet jurnali', free: false, pro: true, premium: true },
        { section: 'Komanda & Inventar' },
        { f: 'Komanda GPS izleme', free: false, pro: false, premium: true },
        { f: 'Toplu emeliyyatlar', free: false, pro: true, premium: true },
        { f: 'Stok xeberdarligi', free: false, pro: true, premium: true },
        { f: '\u00c7oxvalyutali destek', free: false, pro: true, premium: true },
        { section: 'Elave' },
        { f: 'REST API girisi', free: false, pro: false, premium: true },
        { f: 'VIP prioritet destek', free: false, pro: false, premium: true },
    ];

    const renderCell = (val) => {
        if (val === true) return <Check size={18} className="mx-auto" style={{ color: '#22c55e' }} />;
        if (val === false) return <X size={16} className="mx-auto" style={{ color: 'var(--color-text-muted)', opacity: 0.25 }} />;
        return <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{val}</span>;
    };

    return (
        <div className="min-h-screen p-6 relative overflow-hidden font-roboto" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[200px] -translate-y-1/3 pointer-events-none" style={{ backgroundColor: 'var(--color-brand-shadow)', opacity: 0.1 }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 transition-colors mb-8 group"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Geri</span>
                </button>

                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-xs font-black uppercase tracking-[0.3em] mb-4 block" style={{ color: 'var(--color-brand)' }}>Planlar ve Qiymetler</span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6" style={{ color: 'var(--color-text-primary)' }}>
                        Biznesiniz ucun{' '}
                        <span style={{ background: 'linear-gradient(to right, var(--color-brand), #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            en uygun plani
                        </span>{' '}secin
                    </h2>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className="text-sm font-bold transition-colors" style={{ color: billingInterval === 'monthly' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                            Ayliq
                        </span>
                        <button
                            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-14 h-7 rounded-full relative p-1 transition-colors border"
                            style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)' }}
                        >
                            <motion.div animate={{ x: billingInterval === 'monthly' ? 0 : 28 }} className="w-5 h-5 rounded-full bg-blue-500 shadow-lg" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold transition-colors" style={{ color: billingInterval === 'yearly' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                                Illik
                            </span>
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 15px rgba(16,185,129,0.4)", "0 0 0px rgba(16,185,129,0)"] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-400/50 uppercase tracking-tighter shadow-xl"
                            >
                                2 AY PULSUZ
                            </motion.div>
                        </div>
                    </div>

                    <p className="text-lg font-medium max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
                        Hazirki planiniz: <span className="uppercase font-bold" style={{ color: 'var(--color-text-primary)' }}>{currentPlan}</span>
                    </p>
                </div>

                {/* ── Plan Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">

                    {/* FREE */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="rounded-3xl p-8 flex flex-col relative border"
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            borderColor: currentPlan === 'free' ? 'var(--color-brand)' : 'var(--color-card-border)',
                            boxShadow: currentPlan === 'free' ? '0 0 20px var(--color-brand-shadow)' : 'none'
                        }}
                    >
                        <PlanBadge plan="free" />
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border" style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)' }}>
                            <Zap size={22} style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <h4 className="text-xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>Pulsuz</h4>
                        <p className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-muted)' }}>Ferdi sahibkarlar ucun.</p>
                        <div className="text-4xl font-black mb-8" style={{ color: 'var(--color-text-primary)' }}>0 &#8380;</div>
                        <ul className="space-y-3.5 mb-10 flex-1">
                            {[
                                'Ayda 5 faktura',
                                '10 musteri',
                                '15 xerc / ay',
                                '1 biznes profili',
                                '20 mehsul, 1 anbar',
                                'Esas dashboard',
                                'Faktura dublikat etme',
                                'Ictimai faktura linki',
                                'QR kod odenis',
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[13px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                    <CheckCircle2 size={16} style={{ color: 'var(--color-brand)', opacity: 0.4 }} className="shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleSubscribe('free')}
                            disabled={currentPlan === 'free' || isSubmitting}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all border"
                            style={{
                                backgroundColor: currentPlan === 'free' ? 'var(--color-hover-bg)' : 'transparent',
                                borderColor: 'var(--color-card-border)',
                                color: currentPlan === 'free' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                            }}
                        >
                            {currentPlan === 'free' ? 'Istifade olunur' : 'Secin'}
                        </button>
                    </motion.div>

                    {/* PRO */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="relative rounded-3xl p-8 flex flex-col border"
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            borderColor: currentPlan === 'pro' ? 'var(--color-brand)' : 'var(--color-brand-shadow)',
                            boxShadow: '0 20px 40px var(--color-brand-shadow)'
                        }}
                    >
                        <PlanBadge plan="pro" />
                        <div className="absolute -top-3 right-8 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg" style={{ background: 'linear-gradient(to right, var(--color-brand), #8b5cf6)' }}>
                            Populyar
                        </div>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border" style={{ backgroundColor: 'var(--color-brand-light)', borderColor: 'var(--color-brand-shadow)' }}>
                            <Zap size={22} style={{ color: 'var(--color-brand)' }} />
                        </div>
                        <h4 className="text-xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>Pro</h4>
                        <p className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-muted)' }}>Boyuyen bizneslerin tam paketi.</p>
                        <div className="mb-8">
                            <div className="text-4xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                                {billingInterval === 'monthly' ? '19.99 \u20BC' : '199.99 \u20BC'}
                                <span className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                    {billingInterval === 'monthly' ? ' /ay' : ' /il'}
                                </span>
                            </div>
                            {billingInterval === 'yearly' && <p className="text-xs font-bold text-emerald-400 mt-1">~16.66 &#8380; / ay</p>}
                        </div>
                        <ul className="space-y-3.5 mb-10 flex-1">
                            {[
                                { t: 'Ayda 100 faktura', h: true },
                                { t: 'Limitsiz musteri & xerc', h: true },
                                { t: '3 biznes, 500 mehsul, 3 anbar', h: false },
                                { t: '5 komanda uzvu', h: true },
                                { t: 'Premium PDF dizaynlari', h: true },
                                { t: 'E-pocla faktura gonderm\u0259', h: true },
                                { t: 'E-qaime XML (e-vergi)', h: true },
                                { t: 'Proqnoz analitikasi + AI', h: true },
                                { t: 'CSV / Excel eksport', h: true },
                                { t: 'Odenis & vergi hesabatlari', h: true },
                                { t: 'Musteri reytinqi (A-D)', h: false },
                                { t: 'Stok xeberdarligi', h: false },
                                { t: '\u00c7oxvalyutali destek', h: true },
                                { t: 'Fealiyyet jurnali', h: false },
                            ].map(({ t, h }, i) => (
                                <li key={i} className={`flex items-center gap-3 text-[13px] ${h ? 'font-bold' : 'font-semibold'}`} style={{ color: h ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                    <Zap size={16} style={{ color: 'var(--color-brand)' }} className="shrink-0" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => currentPlan === 'pro' ? handleCancel() : handleSubscribe('pro')}
                            disabled={isSubmitting}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all text-white"
                            style={{
                                background: currentPlan === 'pro' ? 'var(--color-hover-bg)' : 'linear-gradient(to right, var(--color-brand), var(--color-brand-dark))',
                                color: currentPlan === 'pro' ? 'var(--color-text-muted)' : 'white',
                                boxShadow: currentPlan === 'pro' ? 'none' : '0 10px 20px var(--color-brand-shadow)',
                            }}
                        >
                            {isSubmitting ? 'Gozleyin...' : (currentPlan === 'pro' ? 'Abunelivi legv et' : 'Pro-ya Kecin')}
                        </button>
                    </motion.div>

                    {/* PREMIUM */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="rounded-3xl p-8 flex flex-col relative border"
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            borderColor: currentPlan === 'premium' ? '#f59e0b' : 'rgba(245,158,11,0.2)',
                            boxShadow: currentPlan === 'premium' ? '0 0 30px rgba(245,158,11,0.15)' : '0 10px 30px rgba(245,158,11,0.05)',
                            background: 'linear-gradient(135deg, var(--color-card-bg) 0%, rgba(245,158,11,0.03) 100%)',
                        }}
                    >
                        <PlanBadge plan="premium" />
                        <div className="absolute -top-3 right-8 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Muessise
                        </div>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border" style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}>
                            <Crown size={22} className="text-amber-400" />
                        </div>
                        <h4 className="text-xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>Premium</h4>
                        <p className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-muted)' }}>Limitsiz guc. Muessise seviyyesi.</p>
                        <div className="mb-8">
                            <div className="text-4xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                                {billingInterval === 'monthly' ? '49.99 \u20BC' : '499.99 \u20BC'}
                                <span className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                    {billingInterval === 'monthly' ? ' /ay' : ' /il'}
                                </span>
                            </div>
                            {billingInterval === 'yearly' && <p className="text-xs font-bold text-emerald-400 mt-1">~41.66 &#8380; / ay</p>}
                        </div>
                        <ul className="space-y-3.5 mb-10 flex-1">
                            {[
                                { t: 'Limitsiz faktura', h: true },
                                { t: 'Limitsiz musteri & xerc', h: true },
                                { t: 'Limitsiz biznes profili', h: true },
                                { t: 'Limitsiz mehsul & anbar', h: true },
                                { t: 'Limitsiz komanda uzvu', h: true },
                                { t: 'Pro-daki butun xususiyyetler', h: false },
                                { t: 'GPS ile komanda izleme', h: true },
                                { t: 'REST API inteqrasiyasi', h: true },
                                { t: 'White-label (brendsiz PDF)', h: true },
                                { t: 'VIP prioritet destek', h: true },
                                { t: 'Limitsiz yaddas', h: false },
                            ].map(({ t, h }, i) => (
                                <li key={i} className={`flex items-center gap-3 text-[13px] ${h ? 'font-bold' : 'font-semibold'}`} style={{ color: h ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                    <Crown size={16} className="text-amber-400 shrink-0" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => currentPlan === 'premium' ? handleCancel() : handleSubscribe('premium')}
                            disabled={isSubmitting}
                            className="w-full py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all"
                            style={{
                                background: currentPlan === 'premium' ? 'var(--color-hover-bg)' : 'linear-gradient(to right, #f59e0b, #ea580c)',
                                color: currentPlan === 'premium' ? 'var(--color-text-muted)' : '#000',
                                boxShadow: currentPlan === 'premium' ? 'none' : '0 10px 20px rgba(245,158,11,0.2)',
                            }}
                        >
                            {isSubmitting ? 'Gozleyin...' : (currentPlan === 'premium' ? 'Abunelivi legv et' : 'Premium-a Kecin')}
                        </button>
                    </motion.div>
                </div>

                {/* ── Feature Comparison Table ── */}
                <div className="max-w-6xl mx-auto mb-16 rounded-3xl border overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                    <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--color-card-border)' }}>
                        <div className="flex items-center gap-3">
                            <Sparkles size={20} style={{ color: 'var(--color-brand)' }} />
                            <div>
                                <h3 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>Tam Muqayise Cedveli</h3>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Butun xususiyyetler bir baxisda</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                                    <th className="text-left px-8 py-4 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Xususiyyet</th>
                                    <th className="text-center px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Pulsuz</th>
                                    <th className="text-center px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-brand)' }}>Pro</th>
                                    <th className="text-center px-6 py-4 text-xs font-black uppercase tracking-wider text-amber-400">Premium</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.map((row, i) => {
                                    if (row.section) {
                                        return (
                                            <tr key={i} style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                                                <td colSpan={4} className="px-8 py-3 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{row.section}</td>
                                            </tr>
                                        );
                                    }
                                    return (
                                        <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid var(--color-card-border)' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-hover-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td className="px-8 py-3.5 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{row.f}</td>
                                            <td className="text-center px-6 py-3.5">{renderCell(row.free)}</td>
                                            <td className="text-center px-6 py-3.5">{renderCell(row.pro)}</td>
                                            <td className="text-center px-6 py-3.5">{renderCell(row.premium)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-center text-xs font-medium mb-8" style={{ color: 'var(--color-text-muted)' }}>
                    Qiymetlere eDV daxildir. Istediviniz zaman legv edin.
                </p>
            </div>
        </div>
    );
};

export default PricingPage;
