import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CreditCard,
    Zap,
    Clock,
    ChevronRight,
    ShieldCheck,
    ArrowLeft,
    AlertCircle,
    Calendar,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import CancellationModal from '../components/CancellationModal';
import useAuthStore from '../store/useAuthStore';

const SubscriptionSettings = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const { user } = useAuthStore();
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: planStatus, isLoading } = useQuery({
        queryKey: ['planStatus'],
        queryFn: async () => {
            const res = await clientApi.get('/users/plan/status/');
            return res.data;
        }
    });

    const handleCancelSubscription = async (reason, feedback) => {
        setIsSubmitting(true);
        try {
            await clientApi.post('/users/plan/cancel/', { reason, feedback });
            showToast("Abunəliyiniz ləğv edildi.", "success");
            queryClient.invalidateQueries(['planStatus']);
            setIsCancelModalOpen(false);
        } catch (error) {
            showToast(error.response?.data?.error || "Xəta baş verdi", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8 animate-pulse text-white/20 font-black tracking-widest uppercase text-center mt-20">Yüklənir...</div>;

    const currentPlan = planStatus?.plan || 'free';
    const planLabel = planStatus?.label || (currentPlan === 'pro' ? 'Pro' : (currentPlan === 'premium' ? 'Premium' : 'Pulsuz'));
    const isCancelled = planStatus?.subscription?.cancel_at_period_end;
    const expiryDate = planStatus?.subscription?.expiry;
    const interval = planStatus?.subscription?.interval;

    const intervalLabel = {
        'monthly': 'Aylıq',
        'yearly': 'İllik'
    }[interval] || (interval ? interval : '---');

    const featureTranslations = {
        'invoices_per_month': 'Aylıq faktura sayı',
        'clients': 'Müştəri limiti',
        'expenses_per_month': 'Aylıq xərc limiti',
        'businesses': 'Biznes profili sayı',
        'products': 'Məhsul limiti',
        'team_members': 'Komanda üzvləri',
        'warehouses': 'Anbar limiti',
        'purchase_orders_per_month': 'Aylıq satınalma sifarişi',
        'storage_limit_mb': 'Yaddaş limiti (MB)',
        'premium_pdf': 'Premium PDF Dizaynları',
        'custom_themes': 'Özəl Temalar',
        'white_label': 'Ağ Etiket (White-label)',
        'email_sending': 'E-poçtla faktura göndərmə',
        'etag_xml': 'E-qaime XML (e-vergi)',
        'duplicate_invoice': 'Faktura dublikat etmə',
        'public_sharing': 'İctimai faktura linki',
        'overdue_reminders': 'Vaxtkeçmiş xatırlatma',
        'forecast_analytics': 'Proqnoz Analitikası',
        'csv_export': 'CSV / Excel Eksport',
        'payment_analytics': 'Ödəniş Analitikası',
        'tax_reports': 'Vergi Hesabatları',
        'client_ratings': 'Müştəri Reytinqi (A-D)',
        'activity_log': 'Fəaliyyət Jurnalı',
        'team_gps': 'Komanda GPS İzləmə',
        'bulk_operations': 'Toplu Əməliyyatlar',
        'stock_alerts': 'Stok Xəbərdarlıqları',
        'multi_currency': 'Çoxvalyutalı Dəstək',
        'api_access': 'REST API Girişi',
        'vip_support': 'VIP Prioritet Dəstək',
    };

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
            <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl transition-colors" style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'} >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>Abunəlik İdarəetməsi</h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Planınızı və ödənişlərinizi buradan idarə edin</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan Card */}
                <div className="md:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl"
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            borderColor: 'var(--color-card-border)',
                            background: 'linear-gradient(135deg, var(--color-card-bg) 0%, var(--color-bg) 100%)'
                        }}
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 blur-[80px] -translate-y-1/2 translate-x-1/2 transition-colors" style={{ backgroundColor: 'var(--color-brand-shadow)', opacity: 0.1 }} />

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)', borderColor: 'var(--color-brand-shadow)' }}>
                                        <ShieldCheck size={24} className="fill-current/10" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>Cari Plan</p>
                                        <h2 className="text-2xl font-black uppercase" style={{ color: 'var(--color-text-primary)' }}>{planLabel}</h2>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)' }}>
                                        <Clock size={14} className="text-amber-500" />
                                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                                            {isCancelled ? 'Bitmə tarixi: ' : 'Növbəti yenilənmə: '}
                                            <span style={{ color: 'var(--color-text-primary)' }}>{expiryDate || (currentPlan === 'free' ? 'Limitsiz' : 'N/A')}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)' }}>
                                        <Calendar size={14} style={{ color: 'var(--color-brand)' }} />
                                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>İnterval: <span className="uppercase" style={{ color: 'var(--color-text-primary)' }}>{intervalLabel}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => navigate('/pricing')}
                                    className="px-6 py-3 font-black text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 group text-white"
                                    style={{ background: 'var(--color-brand)', boxShadow: '0 10px 20px var(--color-brand-shadow)' }}
                                >
                                    Planı Dəyiş
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                {currentPlan !== 'free' && !isCancelled && (
                                    <button
                                        onClick={() => setIsCancelModalOpen(true)}
                                        className="text-xs font-bold transition-colors p-2"
                                        style={{ color: '#ef4444', opacity: 0.7 }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                                    >
                                        Abunəliyi ləğv et
                                    </button>
                                )}
                            </div>
                        </div>

                        {isCancelled && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-6 rounded-[2rem] flex gap-5 border-l-4 shadow-xl"
                                style={{
                                    backgroundColor: 'var(--color-card-bg)',
                                    borderColor: 'var(--color-card-border)',
                                    borderLeftColor: '#f59e0b',
                                    boxShadow: '0 10px 30px rgba(245, 158, 11, 0.05)'
                                }}
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: '#f59e0b' }}>Ləğv edilmə gözlənilir</p>
                                    <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                        Abunəliyiniz ləğv edilib və <b style={{ color: 'var(--color-text-primary)' }}>{expiryDate}</b> tarixində <b style={{ color: 'var(--color-brand)' }}>Pulsuz Plana</b> keçid ediləcək. Bu tarixə qədər bütün imkanlardan yararlana bilərsiniz.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Features highlight */}
                    <div className="border rounded-[2rem] p-8 space-y-6" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>Sizin İmkurlarınız</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {planStatus?.limits && Object.entries(planStatus.limits).map(([key, limit]) => (
                                <div key={key} className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                                        <Zap size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-tighter" style={{ color: 'var(--color-text-muted)' }}>{featureTranslations[key] || key.replace(/_/g, ' ')}</p>
                                        <p className="text-sm font-black" style={{ color: 'var(--color-text-primary)' }}>{limit === true ? 'Var' : limit === false ? 'Yoxdur' : limit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    <div className="rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group" style={{ background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)', boxShadow: '0 20px 40px var(--color-brand-shadow)' }}>
                        <Star className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative space-y-4">
                            <h4 className="font-black text-lg">
                                {currentPlan === 'free' ? 'Hər hansı bir probleminiz var?' : 'Prioritet Dəstək Xətti'}
                            </h4>
                            <p className="text-sm text-white/80 font-medium">
                                {currentPlan === 'free'
                                    ? 'Texniki dəstək komandamız hər zaman yanınızdadır.'
                                    : 'Sizin üçün özəl prioritet dəstək xidməti aktivdir.'}
                            </p>
                            <button
                                onClick={() => window.open('https://wa.me/994517640324', '_blank')}
                                className="w-full py-3 bg-white text-blue-700 font-black text-xs rounded-xl hover:bg-blue-50 transition-colors uppercase tracking-widest shadow-lg"
                            >
                                {currentPlan === 'free' ? 'Dəstək ilə əlaqə' : 'WhatsApp ilə əlaqə'}
                            </button>
                        </div>
                    </div>

                    <div className="border rounded-[2rem] p-6 flex flex-col items-center text-center space-y-3" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                        <CreditCard size={32} style={{ color: 'var(--color-text-muted)', opacity: 0.2 }} />
                        <h4 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>Ödəniş Metodları</h4>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Tezliklə kart əlavə etmə və ödəniş tarixçəsi funksiyaları aktiv olacaq.</p>
                    </div>
                </div>
            </div>

            <CancellationModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleCancelSubscription}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default SubscriptionSettings;
