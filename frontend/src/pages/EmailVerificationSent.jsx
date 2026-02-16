import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const EmailVerificationSent = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-inter">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl text-center mx-4"
            >
                <div className="inline-flex p-4 bg-blue-50 rounded-full mb-6 text-blue-600">
                    <Mail size={48} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-4">E-poçtunuzu yoxlayın</h1>
                <p className="text-slate-600 mb-8 leading-relaxed">
                    Qeydiyyatı tamamlamaq üçün e-poçt ünvanınıza təsdiq linki göndərildi.
                    Zəhmət olmasa "Spam" qovluğunu da yoxlayın.
                </p>
                <Link
                    to="/login"
                    className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors w-full"
                >
                    <span>Giriş səhifəsinə qayıt</span>
                    <ArrowRight size={20} />
                </Link>
            </motion.div>
        </div>
    );
};

export default EmailVerificationSent;
