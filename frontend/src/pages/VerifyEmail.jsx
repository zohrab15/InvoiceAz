import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import clientApi from '../api/client';
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
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
                setTimeout(() => navigate('/login'), 3000);
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
            }
        };

        verifyEmail();
    }, [key, navigate]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-inter">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl text-center mx-4"
            >
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Təsdiqlənir...</h2>
                        <p className="text-slate-500 mt-2">Zəhmət olmasa gözləyin</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="inline-flex p-4 bg-green-50 rounded-full mb-6 text-green-600">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Uğurla Təsdiqləndi!</h2>
                        <p className="text-slate-600 mb-8">
                            Hesabınız aktivləşdirildi. İndi giriş edə bilərsiniz.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors w-full"
                        >
                            <span>Giriş et</span>
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="inline-flex p-4 bg-red-50 rounded-full mb-6 text-red-600">
                            <XCircle size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Xəta baş verdi</h2>
                        <p className="text-slate-600 mb-8">
                            Link yanlışdır və ya vaxtı bitib. Zəhmət olmasa yenidən cəhd edin.
                        </p>
                        <Link
                            to="/login"
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Giriş səhifəsinə qayıt
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
