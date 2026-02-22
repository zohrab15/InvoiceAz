import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        if (!message || message.trim() === '') return;

        // Prevent duplicate messages from stacking up
        setToasts((prev) => {
            const isDuplicate = prev.some(t => t.message === message && t.type === type);
            if (isDuplicate) return prev;

            const id = Math.random().toString(36).substring(2, 11);
            const newToast = { id, message, type };

            setTimeout(() => {
                setToasts((current) => current.filter((t) => t.id !== id));
            }, 3500);

            return [...prev, newToast];
        });
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => {
                        const isSuccess = toast.type === 'success';

                        return (
                            <motion.div
                                key={toast.id}
                                layout
                                initial={{ opacity: 0, y: 24, scale: 0.88, x: 16 }}
                                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.88, x: 20, transition: { duration: 0.18 } }}
                                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                                className="relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border backdrop-blur-2xl overflow-hidden"
                                style={{
                                    background: 'rgba(10, 10, 15, 0.85)',
                                    borderColor: isSuccess ? 'rgba(139, 92, 246, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                                    boxShadow: isSuccess
                                        ? '0 8px 40px rgba(99, 102, 241, 0.18), 0 2px 8px rgba(0,0,0,0.5)'
                                        : '0 8px 40px rgba(239, 68, 68, 0.18), 0 2px 8px rgba(0,0,0,0.5)',
                                    minWidth: '280px',
                                    maxWidth: '360px',
                                }}
                            >
                                {/* Gradient glow line at top */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-px"
                                    style={{
                                        background: isSuccess
                                            ? 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(59,130,246,0.6), transparent)'
                                            : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)',
                                    }}
                                />

                                {/* Icon */}
                                <div
                                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: isSuccess
                                            ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))'
                                            : 'rgba(239,68,68,0.15)',
                                        border: isSuccess
                                            ? '1px solid rgba(139,92,246,0.3)'
                                            : '1px solid rgba(239,68,68,0.3)',
                                    }}
                                >
                                    {isSuccess ? (
                                        <CheckCircle2
                                            size={18}
                                            strokeWidth={2.5}
                                            style={{
                                                color: 'transparent',
                                                stroke: 'url(#successGrad)',
                                            }}
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={18}
                                            strokeWidth={2.5}
                                            className="text-red-400"
                                        />
                                    )}
                                    {/* SVG gradient def for success icon */}
                                    {isSuccess && (
                                        <svg width="0" height="0" style={{ position: 'absolute' }}>
                                            <defs>
                                                <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#60a5fa" />
                                                    <stop offset="100%" stopColor="#a78bfa" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    )}
                                </div>

                                {/* Message */}
                                <span
                                    className="flex-1 text-sm font-semibold leading-snug"
                                    style={{ color: 'rgba(255,255,255,0.92)' }}
                                >
                                    {toast.message}
                                </span>

                                {/* Dismiss button */}
                                <button
                                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                                    style={{
                                        color: 'rgba(255,255,255,0.35)',
                                        background: 'transparent',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
                                    }}
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
