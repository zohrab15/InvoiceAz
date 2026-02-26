import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const EmailVerificationSent = () => {
    const navigate = useNavigate();

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
                <Motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md p-10 bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] shadow-2xl backdrop-blur-xl text-center"
                >
                    <Motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="inline-flex p-6 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-3xl mb-8 text-blue-400 border border-blue-500/20"
                    >
                        <Mail size={40} className="animate-pulse" />
                    </Motion.div>

                    <h1 className="text-3xl font-black tracking-tight mb-4 text-white">E-poçtunuzu yoxlayın</h1>

                    <p className="text-white/40 mb-10 leading-[1.6] font-medium text-lg">
                        Təbriklər! Hesabınız yaradıldı. İndi e-poçt ünvanınıza göndərdiyimiz <span className="text-blue-400">təsdiq linkini</span> sıxaraq başlayın.
                    </p>

                    <div className="space-y-4">
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-violet-600 hover:shadow-xl hover:shadow-blue-500/20 text-white font-black py-4 px-8 rounded-2xl transition-all w-full active:scale-[0.98]"
                        >
                            <span>Giriş səhifəsinə keç</span>
                            <ArrowRight size={20} />
                        </Link>

                        <div className="flex items-center justify-center gap-2 text-xs text-white/20 font-bold uppercase tracking-widest pt-4">
                            <CheckCircle2 size={14} className="text-emerald-500/50" />
                            <span>Spam qovluğunu da yoxlayın</span>
                        </div>
                    </div>
                </Motion.div>
            </div>

            {/* Footer Attribution */}
            <div className="p-8 text-center text-white/10 text-xs font-bold uppercase tracking-widest relative z-10">
                &copy; 2026 InvoiceAZ &bull; Professional Solutions
            </div>
        </div>
    );
};

export default EmailVerificationSent;
