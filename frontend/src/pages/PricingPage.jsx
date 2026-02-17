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
        <div className="min-h-screen p-6 relative overflow-hidden font-outfit" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[200px] -translate-y-1/3 pointer-events-none" style={{ backgroundColor: 'var(--color-brand-shadow)', opacity: 0.1 }} />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none" style={{ backgroundColor: 'var(--color-brand-shadow)', opacity: 0.05 }} />

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

                <div className="text-center mb-16">
                    <span className="text-xs font-black uppercase tracking-[0.3em] mb-4 block" style={{ color: 'var(--color-brand)' }}>Planlar və Qiymətlər</span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6" style={{ color: 'var(--color-text-primary)' }}>
                        Biznesiniz üçün <span style={{ background: 'linear-gradient(to right, var(--color-brand), #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ən uyğun planı</span> seçin
                    </h2>
                    <p className="text-lg font-medium max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
                        Hazırkı planınız: <span className="uppercase font-bold" style={{ color: 'var(--color-text-primary)' }}>{currentPlan}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-3xl p-8 flex flex-col relative border"
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            borderColor: currentPlan === 'free' ? 'var(--color-brand)' : 'var(--color-card-border)',
                            boxShadow: currentPlan === 'free' ? '0 0 20px var(--color-brand-shadow)' : 'none'
                        }}
                    >
                        {currentPlan === 'free' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg" style={{ backgroundColor: 'var(--color-brand)' }}>
                                Hazırkı Plan
                            </div>
                        )}
                        <div className="mb-6">
                            <h4 className="text-xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>Başlanğıc</h4>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Kiçik işlər üçün idealdır.</p>
                        </div>
                        <div className="text-4xl font-black mb-8" style={{ color: 'var(--color-text-primary)' }}>Pulsuz</div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Ayda 5 faktura', '3 aylıq tarixçə', 'Sadə hesabatlar', '1 biznes profili'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                    <CheckCircle2 size={18} style={{ color: 'var(--color-brand)' }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={currentPlan === 'free'}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
                            style={{
                                backgroundColor: currentPlan === 'free' ? 'var(--color-hover-bg)' : 'var(--color-card-border)',
                                color: currentPlan === 'free' ? 'var(--color-text-muted)' : 'var(--color-text-primary)'
                            }}
                        >
                            {currentPlan === 'free' ? 'İstifadə olunur' : 'Seçin'}
                        </button>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative rounded-3xl p-8 flex flex-col border"
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            borderColor: currentPlan === 'pro' ? 'var(--color-brand)' : 'var(--color-brand-shadow)',
                            boxShadow: '0 20px 40px var(--color-brand-shadow)'
                        }}
                    >
                        {currentPlan === 'pro' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg" style={{ backgroundColor: 'var(--color-brand)' }}>
                                Hazırkı Plan
                            </div>
                        )}
                        <div className="absolute -top-3 right-8 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg" style={{ background: 'linear-gradient(to right, var(--color-brand), #8b5cf6)' }}>
                            Populyar
                        </div>
                        <div className="mb-6">
                            <h4 className="text-xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>Professional</h4>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Sürətli inkişaf edən bizneslər.</p>
                        </div>
                        <div className="text-4xl font-black mb-8" style={{ color: 'var(--color-text-primary)' }}>19.99 ₼ <span className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>/ay</span></div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Ayda 100 faktura', 'Tam analitika + AI', 'Limitsiz bildirişlər', 'PDF eksport', '3 biznes profili'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                                    <Zap size={18} style={{ color: 'var(--color-brand)' }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={currentPlan === 'pro'}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all text-white"
                            style={{
                                background: currentPlan === 'pro' ? 'var(--color-hover-bg)' : 'linear-gradient(to right, var(--color-brand), var(--color-brand-dark))',
                                color: currentPlan === 'pro' ? 'var(--color-text-muted)' : 'white',
                                boxShadow: currentPlan === 'pro' ? 'none' : '0 10px 20px var(--color-brand-shadow)'
                            }}
                        >
                            {currentPlan === 'pro' ? 'İstifadə olunur' : 'Pro-ya Keçin'}
                        </button>
                    </motion.div>

                    {/* Premium Plan - COMING SOON */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-3xl p-8 flex flex-col relative overflow-hidden opacity-75 border"
                        style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}
                    >
                        <div className="absolute top-0 right-0 font-black text-[10px] px-8 py-1 rotate-45 translate-x-8 translate-y-4 shadow-lg" style={{ backgroundColor: 'var(--color-brand-dark)', color: 'white' }}>
                            TEZLİKLƏ
                        </div>

                        <div className="mb-6">
                            <h4 className="text-xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>Premium</h4>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Limitsiz imkanlar.</p>
                        </div>
                        <div className="text-4xl font-black mb-8" style={{ color: 'var(--color-text-primary)' }}>49.99 ₼ <span className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>/ay</span></div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Limitsiz faktura', 'VIP Dəstək', 'API inteqrasiyası', 'Komanda (Qrup) üzvləri', 'Fərdiləşdirilə bilən Faktura Temaları', 'Limitsiz biznes profili', 'Tam ağ etiket (White-label)'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                    <CheckCircle2 size={18} style={{ color: 'var(--color-text-muted)' }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={true}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all cursor-not-allowed"
                            style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-muted)' }}
                        >
                            Tezliklə
                        </button>
                    </motion.div>
                </div>

                <p className="text-center text-xs mt-12 font-medium" style={{ color: 'var(--color-text-muted)' }}>Valid until cancelled. Prices include VAT.</p>
            </div>
        </div>
    );
};

export default PricingPage;
