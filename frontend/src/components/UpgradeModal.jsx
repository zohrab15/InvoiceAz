import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, resourceName, limit, title, message }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const displayTitle = title || "Limitə çatdınız! 🚀";
    const displayMessage = message || (limit !== undefined && resourceName ? (
        <>
            Hazırkı planınızda maksimum <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{limit} {resourceName}</span> yaratmaq mümkündür.
            Limitsiz imkanlar üçün Pro plana keçin.
        </>
    ) : (
        "Bu xüsusiyyəti aktiv etmək üçün Pro plana keçin."
    ));

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-lg rounded-3xl overflow-hidden relative shadow-2xl border"
                    style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-brand-shadow)', boxShadow: '0 20px 50px var(--color-brand-shadow)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 w-full h-40 pointer-events-none" style={{ background: 'linear-gradient(to bottom, var(--color-brand-shadow), transparent)', opacity: 0.3 }} />
                    <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-[80px]" style={{ backgroundColor: 'var(--color-brand-shadow)', opacity: 0.2 }} />
                    <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-[80px]" style={{ backgroundColor: 'var(--color-brand-shadow)', opacity: 0.2 }} />

                    <div className="p-8 relative z-10">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--color-brand), #f59e0b)', boxShadow: '0 10px 20px var(--color-brand-shadow)' }}>
                                <Crown size={32} className="text-white" />
                            </div>

                            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>{displayTitle}</h2>
                            <p className="mb-8 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
                                {displayMessage}
                            </p>

                            <div className="w-full space-y-3 mb-8">
                                <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)' }}>
                                    <div className="min-w-[20px] h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-brand-light)' }}>
                                        <Check size={12} style={{ color: 'var(--color-brand)' }} />
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Limitsiz faktura və xərclər</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)' }}>
                                    <div className="min-w-[20px] h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-brand-light)' }}>
                                        <Check size={12} style={{ color: 'var(--color-brand)' }} />
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>AI Trend və Proqnozlar</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)' }}>
                                    <div className="min-w-[20px] h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-brand-light)' }}>
                                        <Check size={12} style={{ color: 'var(--color-brand)' }} />
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Limitsiz müştəri bazası</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    navigate('/pricing');
                                    onClose();
                                }}
                                className="w-full py-4 text-white font-black rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                style={{ background: 'var(--color-brand)', boxShadow: '0 10px 20px var(--color-brand-shadow)' }}
                            >
                                <Sparkles size={18} />
                                <span>Pro Plana Keçin</span>
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-4 text-xs font-bold transition-colors uppercase tracking-widest"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                            >
                                Bəlkə sonra
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UpgradeModal;
