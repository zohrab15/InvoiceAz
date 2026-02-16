import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { UserPlus, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password1: '',
        password2: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const showToast = useToast();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password1 !== formData.password2) {
            return showToast('Şifrilər uyğun gəlmir', 'error');
        }

        setIsLoading(true);
        try {
            await clientApi.post('/auth/registration/', formData);
            // showToast('Qeydiyyat uğurla tamamlandı! İndi giriş edə bilərsiniz.'); // Removed to avoid confusion
            navigate('/verify-email-sent');
        } catch (error) {
            console.error('Registration error details:', error.response?.data);
            let errorMsg = 'Qeydiyyat zamanı xəta baş verdi';
            if (error.response?.data) {
                const data = error.response.data;
                const firstKey = Object.keys(data)[0];
                if (firstKey) {
                    const value = data[firstKey];
                    errorMsg = Array.isArray(value) ? value[0] : (typeof value === 'string' ? value : JSON.stringify(value));
                    // Simple translation for common errors
                    if (errorMsg === 'A user with that email already exists.') errorMsg = 'Bu e-poçt ilə artıq hesab mövcuddur.';
                }
            }
            showToast(errorMsg, 'error');
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-inter">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg p-8 glass-dark text-white rounded-3xl shadow-2xl z-10 mx-4"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        className="inline-flex p-4 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30"
                    >
                        <UserPlus size={32} />
                    </motion.div>
                    <h1 className="text-3xl font-black font-outfit tracking-tight">Qeydiyyat</h1>
                    <p className="text-slate-400 mt-2">Professional hesabınızı yaradın</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                name="first_name"
                                required
                                placeholder="Ad"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                name="last_name"
                                required
                                placeholder="Soyad"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="E-poçt ünvanı"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="password"
                            name="password1"
                            required
                            placeholder="Şifrə"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="password"
                            name="password2"
                            required
                            placeholder="Şifrəni təsdiqləyin"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Hesab yarat</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-slate-500 text-sm">
                    Artıq hesabınız var? <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300">Giriş edin</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
