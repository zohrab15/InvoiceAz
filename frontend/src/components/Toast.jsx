import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        if (!message || message.trim() === '') return;
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
                            className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border backdrop-blur-xl transition-all duration-300"
                            style={{
                                backgroundColor: toast.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                                borderColor: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                                color: 'var(--color-text-primary)',
                                boxShadow: `0 8px 32px ${toast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)}`
                                    }}
                        >
                            <div className="flex-shrink-0">
                                {toast.type === 'success' ? (
                                    <CheckCircle style={{ color: 'var(--color-success)' }} size={22} strokeWidth={2.5} />
                                ) : (
                                    <AlertCircle style={{ color: 'var(--color-error)' }} size={22} strokeWidth={2.5} />
                                )}
                            </div>
                            <span className="font-bold text-sm tracking-tight leading-tight">{toast.message}</span>
                            <button
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
