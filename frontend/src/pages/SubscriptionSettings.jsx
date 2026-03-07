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
    const isCancelled = planStatus?.subscription?.cancel_at_period_end;
    const expiryDate = planStatus?.subscription?.expiry;

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-8 max-w-5xl mx-auto font-roboto">
            <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white">Abunəlik İdarəetməsi</h1>
                        <p className="text-sm text-white/40">Planınızı və ödənişlərinizi buradan idarə edin</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan Card */}
                <div className="md:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-[#1e1e24] to-[#16161a] border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/15 transition-colors" />

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                                        <ShieldCheck size={24} className="fill-current/10" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-white/30">Cari Plan</p>
                                        <h2 className="text-2xl font-black text-white uppercase">{currentPlan}</h2>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                                        <Clock size={14} className="text-amber-500" />
                                        <span className="text-xs font-bold text-white/60">
                                            {isCancelled ? 'Bitmə tarixi: ' : 'Növbəti yenilənmə: '}
                                            <span className="text-white">{expiryDate || 'N/A'}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                                        <Calendar size={14} className="text-blue-500" />
                                        <span className="text-xs font-bold text-white/60">İnterval: <span className="text-white uppercase">{planStatus?.subscription?.interval || '---'}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => navigate('/pricing')}
                                    className="px-6 py-3 bg-blue-500 text-white font-black text-sm rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group"
                                >
                                    Planı Dəyiş
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                {currentPlan !== 'free' && !isCancelled && (
                                    <button
                                        onClick={() => setIsCancelModalOpen(true)}
                                        className="text-xs font-bold text-red-400/60 hover:text-red-400 transition-colors p-2"
                                    >
                                        Abunəliyi ləğv et
                                    </button>
                                )}
                            </div>
                        </div>

                        {isCancelled && (
                            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">Ləğv edilmə gözlənilir</p>
                                    <p className="text-xs text-amber-200/60 leading-relaxed font-semibold">
                                        Abunəliyiniz ləğv edilib və <b>{expiryDate}</b> tarixində <b>Pulsuz Plana</b> keçid ediləcək. Bu tarixə qədər bütün imkanlardan yararlana bilərsiniz.
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Features highlight */}
                    <div className="bg-[#16161a] border border-white/5 rounded-[2rem] p-8 space-y-6">
                        <h3 className="text-sm font-black text-white/30 uppercase tracking-[0.2em]">Sizin İmalatlarınız</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {planStatus?.limits && Object.entries(planStatus.limits).map(([key, limit]) => (
                                <div key={key} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Zap size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</p>
                                        <p className="text-sm font-black text-white">{limit === true ? 'Limitsiz' : limit === false ? 'Yoxdur' : limit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                        <Star className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative space-y-4">
                            <h4 className="font-black text-lg">Hər hansı bir probleminiz var?</h4>
                            <p className="text-sm text-white/80 font-medium">Texniki dəstək komandamız hər zaman yanınızdadır.</p>
                            <button className="w-full py-3 bg-white text-blue-700 font-black text-xs rounded-xl hover:bg-blue-50 transition-colors uppercase tracking-widest">
                                Dəstək ilə əlaqə
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#16161a] border border-white/10 rounded-[2rem] p-6 flex flex-col items-center text-center space-y-3">
                        <CreditCard size={32} className="text-white/20" />
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Ödəniş Metodları</h4>
                        <p className="text-xs text-white/40 font-medium">Tezliklə kart əlavə etmə və ödəniş tarixçəsi funksiyaları aktiv olacaq.</p>
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
