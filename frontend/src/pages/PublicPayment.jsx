import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ShieldCheck, ArrowLeft, CheckCircle2, Loader2, Smartphone } from 'lucide-react';

const PublicPayment = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: ''
    });

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/invoices/public/${token}/`);
                setInvoice(response.data);
            } catch (err) {
                console.error('Faktura tapılmadı');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [token]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);

        // Simulate network delay
        setTimeout(async () => {
            try {
                const response = await axios.post(`${API_URL}/api/invoices/public/${token}/pay/`);
                if (response.data.status === 'paid') {
                    setSuccess(true);
                }
            } catch (err) {
                alert('Ödəniş zamanı xəta baş verdi.');
            } finally {
                setProcessing(false);
            }
        }, 2000);
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
    );

    if (success) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full text-center"
            >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="text-green-500" size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Ödəniş Uğurludur!</h2>
                <p className="text-slate-500 mb-10 font-medium">#{invoice.invoice_number} nömrəli faktura üzrə ödənişiniz qəbul edildi.</p>
                <button
                    onClick={() => navigate(`/public/invoice/${token}`)}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                >
                    Fakturaya Qayıt
                </button>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-inter">
            <div className="max-w-xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm mb-8"
                >
                    <ArrowLeft size={18} />
                    Geri qayıt
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight mb-2 uppercase italic">Checkout</h1>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Powered by InvoiceAZ Secure</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Məbləğ</p>
                                <p className="text-3xl font-black text-blue-400">{parseFloat(invoice.total).toFixed(2)} AZN</p>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
                    </div>

                    <div className="p-8 md:p-12">
                        <form onSubmit={handlePayment} className="space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={18} className="text-blue-600" />
                                    Kart Məlumatları
                                </h3>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <input
                                            required
                                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            type="text"
                                            placeholder="Kartın nömrəsi"
                                            className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-lg font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                            value={cardData.number}
                                            onChange={e => setCardData({ ...cardData, number: e.target.value })}
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-1">
                                            <div className="w-8 h-5 bg-slate-200 rounded opacity-50"></div>
                                            <div className="w-8 h-5 bg-slate-200 rounded opacity-50"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            required
                                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            type="text"
                                            placeholder="MM/YY"
                                            className="h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-lg font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                            value={cardData.expiry}
                                            onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                                        />
                                        <input
                                            required
                                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            type="text"
                                            placeholder="CVC"
                                            className="h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-lg font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                            value={cardData.cvc}
                                            onChange={e => setCardData({ ...cardData, cvc: e.target.value })}
                                        />
                                    </div>

                                    <input
                                        required
                                        onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                        onInput={(e) => e.target.setCustomValidity('')}
                                        type="text"
                                        placeholder="Kart sahibinin adı"
                                        className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-lg font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none uppercase"
                                        value={cardData.name}
                                        onChange={e => setCardData({ ...cardData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    disabled={processing}
                                    type="submit"
                                    className="w-full h-18 bg-blue-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:shadow-none"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Gözləyin...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={20} />
                                            {parseFloat(invoice.total).toFixed(2)} AZN ÖDƏ
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-6 text-slate-300">
                                <div className="flex items-center gap-1">
                                    <ShieldCheck size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">PCI-DSS Compliant</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Smartphone size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Secure Link</span>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-400 font-medium text-xs">
                    Təhlükəsiz ödəniş sistemi vasitəsilə 256-bit şifrələmə ilə qorunur.
                </div>
            </div>
        </div>
    );
};

export default PublicPayment;
