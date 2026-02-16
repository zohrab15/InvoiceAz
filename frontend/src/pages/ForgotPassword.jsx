import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { KeyRound, Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const showToast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await clientApi.post('/auth/password/reset/', { email });
            setIsSent(true);
            showToast('Sıfırlama linki e-poçt ünvanınıza göndərildi');
        } catch (error) {
            showToast('Xəta baş verdi. E-poçt ünvanını yoxlayın', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-inter">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass-dark text-white rounded-3xl shadow-2xl z-10 mx-4"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-4 bg-amber-600 rounded-2xl mb-4 shadow-lg shadow-amber-500/30"
                    >
                        <KeyRound size={32} />
                    </motion.div>
                    <h1 className="text-3xl font-black font-outfit tracking-tight">Şifrəni unutmusunuz?</h1>
                    <p className="text-slate-400 mt-2">Narahat olmayın, e-poçtunuzu daxil edin və biz sizə bərpa linki göndərək.</p>
                </div>

                {!isSent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="email"
                                required
                                placeholder="E-poçt ünvanı"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Link göndər</span>
                                    <Send size={20} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl text-center space-y-4">
                        <p className="text-blue-400 text-sm">Təlimatlar {email} ünvanına göndərildi.</p>
                        <button
                            onClick={() => setIsSent(false)}
                            className="text-white font-bold underline"
                        >
                            Yenidən göndər
                        </button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="inline-flex items-center space-x-2 text-slate-500 hover:text-white transition-colors text-sm font-bold">
                        <ArrowLeft size={16} />
                        <span>Giriş səhifəsinə qayıt</span>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
