import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, MessageSquare, ChevronRight, Heart } from 'lucide-react';

const REASONS = [
    { id: 'too_expensive', label: 'Xidmət haqqı bahadır' },
    { id: 'missing_features', label: 'Lazımi funksiyalar yoxdur' },
    { id: 'hard_to_use', label: 'İstifadəsi çətindir' },
    { id: 'switching_to_competitor', 'label': 'Başqa xidmətə keçirəm' },
    { id: 'no_longer_needed', label: 'Artıq ehtiyac yoxdur' },
    { id: 'other', label: 'Digər' },
];

const CancellationModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
    const [step, setStep] = useState(1);
    const [reason, setReason] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleConfirm = () => {
        onConfirm(reason, feedback);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#16161a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-white">Abunəliyi ləğv et</h3>
                        <p className="text-sm text-white/50">Sizi itirdiyimiz üçün üzgünük :(</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-white/70 flex items-center gap-2">
                                        <MessageSquare size={16} className="text-blue-500" />
                                        Niyə abunəliyi ləğv etmək istəyirsiniz?
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {REASONS.map((r) => (
                                            <button
                                                key={r.id}
                                                onClick={() => setReason(r.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${reason === r.id
                                                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                                        : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20'
                                                    }`}
                                            >
                                                <span className="font-bold text-sm">{r.label}</span>
                                                {reason === r.id && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    disabled={!reason}
                                    onClick={() => setStep(2)}
                                    className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm disabled:opacity-30 flex items-center justify-center gap-2 group transition-all"
                                >
                                    Davam et
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        ) : step === 2 ? (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-3">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Heart size={18} className="fill-current" />
                                        <span className="font-black text-sm uppercase tracking-wider">Bizə kömək edin</span>
                                    </div>
                                    <p className="text-sm text-white/80 leading-relaxed">
                                        Geri bildiriminiz bizim üçün çox önəmlidir. Sistemi təkmilləşdirmək üçün əlavə qeydləriniz varsa yazın.
                                    </p>
                                    <textarea
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        placeholder="Qeydləriniz (opsional)..."
                                        className="w-full h-32 bg-black/20 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    />
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex gap-3">
                                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                    <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                                        Ləğv etdikdən sonra hazırkı planınız bitmə tarixinə qədər aktiv qalacaq. Bundan sonra avtomatik <b>Pulsuz Plana</b> keçid ediləcək.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="py-4 bg-white/5 text-white/70 rounded-2xl font-bold text-sm hover:bg-white/10 transition-colors"
                                    >
                                        Geri
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={isSubmitting}
                                        className="py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Gözləyin...' : 'Təsdiqlə'}
                                    </button>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default CancellationModal;
