import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, resourceName, limit }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

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
                    className="w-full max-w-lg bg-[#0a0a0f] border border-blue-500/30 rounded-3xl overflow-hidden relative shadow-2xl shadow-blue-900/40"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/20 rounded-full blur-[80px]" />

                    <div className="p-8 relative z-10">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                                <Crown size={32} className="text-white" />
                            </div>

                            <h2 className="text-2xl font-black text-white mb-2">Limitə çatdınız! 🚀</h2>
                            <p className="text-slate-400 mb-8 max-w-sm">
                                Hazırkı planınızda maksimum <span className="text-white font-bold">{limit} {resourceName}</span> yaratmaq mümkündür.
                                Limitsiz imkanlar üçün Pro plana keçin.
                            </p>

                            <div className="w-full space-y-3 mb-8">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                    <div className="min-w-[20px] h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <Check size={12} className="text-emerald-500" />
                                    </div>
                                    <span className="text-slate-300 text-sm font-medium">Limitsiz faktura və xərclər</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                    <div className="min-w-[20px] h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <Check size={12} className="text-emerald-500" />
                                    </div>
                                    <span className="text-slate-300 text-sm font-medium">AI Trend və Proqnozlar</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                    <div className="min-w-[20px] h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <Check size={12} className="text-emerald-500" />
                                    </div>
                                    <span className="text-slate-300 text-sm font-medium">Limitsiz müştəri bazası</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    navigate('/pricing');
                                    onClose();
                                }}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-black rounded-xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 hover:shadow-blue-600/40 transition-all active:scale-[0.98]"
                            >
                                <Sparkles size={18} />
                                <span>Pro Plana Keçin</span>
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-4 text-slate-500 text-xs font-bold hover:text-white transition-colors uppercase tracking-widest"
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
