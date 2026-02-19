import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import clientApi from '../api/client';
import { CheckCircle, XCircle, Loader, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
    const { key } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    useEffect(() => {
        const verifyEmail = async () => {
            if (!key) {
                setStatus('error');
                return;
            }

            try {
                // dj-rest-auth verification endpoint
                await clientApi.post('/auth/registration/verify-email/', { key });
                setStatus('success');
                // Optional: Automatically redirect after a few seconds
                setTimeout(() => navigate('/login'), 4000);
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
            }
        };

        verifyEmail();
    }, [key, navigate]);

    return (
        <div className="min-h-screen w-full flex flex-col bg-[#0a0a0f] text-white font-inter overflow-hidden relative">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />

            {/* Navbar Placeholder/Logo */}
            <div className="p-8 relative z-10 flex justify-center">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                        <Zap size={20} />
                    </div>
                    <span className="text-xl font-black tracking-tight italic">InvoiceAZ</span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md p-10 bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] shadow-2xl backdrop-blur-xl text-center"
                >
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6" />
                            <h2 className="text-2xl font-black text-white mb-2">Təsdiqlənir...</h2>
                            <p className="text-white/40 font-medium">Zəhmət olmasa bir neçə saniyə gözləyin</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex p-5 bg-emerald-500/10 rounded-3xl mb-8 text-emerald-400 border border-emerald-500/20"
                            >
                                <CheckCircle size={48} />
                            </motion.div>
                            <h2 className="text-3xl font-black text-white mb-4">Möhtəşəm!</h2>
                            <p className="text-white/40 mb-10 leading-relaxed font-medium">
                                Hesabınız uğurla təsdiqləndi. İndi InvoiceAZ-ın bütün imkanlarından yararlana bilərsiniz.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-black py-4 px-10 rounded-2xl transition-all w-full active:scale-[0.98] shadow-xl shadow-blue-500/10"
                            >
                                <span>Giriş et</span>
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="inline-flex p-5 bg-red-500/10 rounded-3xl mb-8 text-red-500 border border-red-500/20">
                                <XCircle size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">Xəta baş verdi</h2>
                            <p className="text-white/40 mb-10 leading-relaxed font-medium">
                                Link yanlışdır, vaxtı bitib və ya artıq istifadə olunub. Zəhmət olmasa yenidən cəhd edin.
                            </p>
                            <Link
                                to="/login"
                                className="text-blue-400 font-bold hover:text-blue-300 transition-colors underline underline-offset-4"
                            >
                                Giriş səhifəsinə qayıt
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Footer Attribution */}
            <div className="p-8 text-center text-white/10 text-xs font-bold uppercase tracking-widest relative z-10">
                &copy; 2026 InvoiceAZ &bull; Verified Account
            </div>
        </div>
    );
};

export default VerifyEmail;
