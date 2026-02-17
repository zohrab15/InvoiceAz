import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const PricingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const currentPlan = user?.membership || 'free';

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[200px] -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Geri</span>
                </button>

                <div className="text-center mb-16">
                    <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mb-4 block">Planlar və Qiymətlər</span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                        Biznesiniz üçün <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ən uyğun planı</span> seçin
                    </h2>
                    <p className="text-lg text-white/40 font-medium max-w-2xl mx-auto">
                        Hazırkı planınız: <span className="text-white uppercase font-bold">{currentPlan}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`bg-white/[0.03] border ${currentPlan === 'free' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-white/[0.06]'} rounded-3xl p-8 flex flex-col relative`}
                    >
                        {currentPlan === 'free' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                Hazırkı Plan
                            </div>
                        )}
                        <div className="mb-6">
                            <h4 className="text-xl font-black mb-1">Başlanğıc</h4>
                            <p className="text-sm text-white/30 font-medium">Kiçik işlər üçün idealdır.</p>
                        </div>
                        <div className="text-4xl font-black mb-8">Pulsuz</div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Ayda 5 faktura', '3 aylıq tarixçə', 'Sadə hesabatlar', '1 biznes profili'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/50 font-semibold">
                                    <CheckCircle2 size={18} className="text-emerald-500/50" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={currentPlan === 'free'}
                            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${currentPlan === 'free'
                                ? 'bg-white/5 text-white/20 cursor-default'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                        >
                            {currentPlan === 'free' ? 'İstifadə olunur' : 'Seçin'}
                        </button>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`relative bg-gradient-to-br from-blue-600/10 to-violet-600/10 border ${currentPlan === 'pro' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-500/30'} rounded-3xl p-8 flex flex-col`}
                    >
                        {currentPlan === 'pro' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                Hazırkı Plan
                            </div>
                        )}
                        <div className="absolute -top-3 right-8 bg-gradient-to-r from-blue-500 to-violet-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                            Populyar
                        </div>
                        <div className="mb-6">
                            <h4 className="text-xl font-black mb-1">Professional</h4>
                            <p className="text-sm text-white/40 font-medium">Sürətli inkişaf edən bizneslər.</p>
                        </div>
                        <div className="text-4xl font-black mb-8">19.99 ₼ <span className="text-lg text-white/30">/ay</span></div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Ayda 100 faktura', 'Tam analitika + AI', 'Limitsiz bildirişlər', 'PDF eksport', '3 biznes profili'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/70 font-bold">
                                    <Zap size={18} className="text-blue-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={currentPlan === 'pro'}
                            className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all ${currentPlan === 'pro'
                                ? 'bg-blue-500/20 text-blue-300 cursor-default border border-blue-500/20'
                                : 'bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:shadow-blue-500/25 shadow-blue-500/10'
                                }`}
                        >
                            {currentPlan === 'pro' ? 'İstifadə olunur' : 'Pro-ya Keçin'}
                        </button>
                    </motion.div>

                    {/* Premium Plan - COMING SOON */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 flex flex-col relative overflow-hidden opacity-75`}
                    >
                        <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[10px] px-8 py-1 rotate-45 translate-x-8 translate-y-4 shadow-lg">
                            TEZLİKLƏ
                        </div>

                        <div className="mb-6">
                            <h4 className="text-xl font-black mb-1">Premium</h4>
                            <p className="text-sm text-white/30 font-medium">Limitsiz imkanlar.</p>
                        </div>
                        <div className="text-4xl font-black mb-8">49.99 ₼ <span className="text-lg text-white/30">/ay</span></div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Limitsiz faktura', 'VIP Dəstək', 'API inteqrasiyası', 'Komanda (Qrup) üzvləri', 'Fərdiləşdirilə bilən Faktura Temaları', 'Limitsiz biznes profili', 'Tam ağ etiket (White-label)'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/50 font-semibold">
                                    <CheckCircle2 size={18} className="text-amber-500/50" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={true}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all bg-white/5 text-white/40 cursor-not-allowed"
                        >
                            Tezliklə
                        </button>
                    </motion.div>
                </div>

                <p className="text-center text-white/20 text-xs mt-12 font-medium">Valid until cancelled. Prices include VAT.</p>
            </div>
        </div>
    );
};

export default PricingPage;
