import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Download, CheckCircle, Clock, AlertCircle, FileText, Globe, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PublicInvoice = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/invoices/public/${token}/`);
                setInvoice(response.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Faktura tapılmadı');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [token]);

    const handleDownload = () => {
        const url = `http://localhost:8000/api/invoices/${invoice.id}/pdf/?business_id=${invoice.business}`;
        window.open(url, '_blank');
    };

    const handlePay = () => {
        navigate(`/public/pay/${token}`);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Yüklənir...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border max-w-md w-full text-center">
                <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Xəta baş verdi</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <a href="/" className="inline-block bg-primary-blue text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-200">
                    Ana Səhifəyə Get
                </a>
            </div>
        </div>
    );

    const isPaid = invoice.status === 'paid';
    const subtotal = parseFloat(invoice.subtotal);
    const tax = parseFloat(invoice.tax_amount);
    const total = parseFloat(invoice.total);

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8 font-inter">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight">Müştəri Portalı</h1>
                            <p className="text-xs text-slate-400 font-medium">#{invoice.invoice_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <Download size={18} />
                            <span>PDF Endir</span>
                        </button>
                        <button
                            disabled={isPaid}
                            onClick={handlePay}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg ${isPaid ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
                        >
                            <span>{isPaid ? 'Ödənilib' : 'İndi Ödə'}</span>
                        </button>
                    </div>
                </div>

                {/* Main Invoice Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
                >
                    {/* Status Banner */}
                    <div className={`py-4 px-8 text-center text-sm font-bold uppercase tracking-widest ${isPaid ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                        {isPaid ? (
                            <span className="flex items-center justify-center gap-2"><CheckCircle size={18} /> Bu faktura ödənilib</span>
                        ) : (
                            <span className="flex items-center justify-center gap-2"><Clock size={18} /> Ödəniş Gözlənilir</span>
                        )}
                    </div>

                    <div className="p-8 md:p-12">
                        {/* Branding & Info */}
                        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
                            <div className="space-y-4">
                                {invoice.business_details?.logo && (
                                    <img src={invoice.business_details.logo.startsWith('http') ? invoice.business_details.logo : `http://localhost:8000${invoice.business_details.logo}`} alt="Logo" className="h-16 w-auto object-contain mb-4 rounded-xl shadow-sm" />
                                )}
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{invoice.business_details?.name}</h2>
                                <div className="text-sm text-slate-500 space-y-1">
                                    <p>{invoice.business_details?.address}</p>
                                    <p>VÖEN: {invoice.business_details?.voen}</p>
                                    <p>{invoice.business_details?.email}</p>
                                </div>
                            </div>
                            <div className="text-right space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Müştəri</h3>
                                    <p className="text-lg font-bold text-slate-900">{invoice.client_details?.name}</p>
                                    <p className="text-sm text-slate-500">{invoice.client_details?.email}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-8 text-right">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tarix</h3>
                                        <p className="text-sm font-bold text-slate-800">{new Date(invoice.invoice_date).toLocaleDateString('az-AZ')}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Son Tarix</h3>
                                        <p className="text-sm font-bold text-slate-800">{new Date(invoice.due_date).toLocaleDateString('az-AZ')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto mb-12">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b-2 border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                        <th className="py-4 pr-4">Mehsul / Xidmət</th>
                                        <th className="py-4 px-4 text-center">Sayı</th>
                                        <th className="py-4 px-4 text-right">Qiymət</th>
                                        <th className="py-4 pl-4 text-right">Məbləğ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoice.items.map((item, i) => (
                                        <tr key={i} className="text-slate-700">
                                            <td className="py-6 pr-4 font-bold text-slate-900">{item.description}</td>
                                            <td className="py-6 px-4 text-center text-sm">{item.quantity} {item.unit}</td>
                                            <td className="py-6 px-4 text-right text-sm">{parseFloat(item.unit_price).toFixed(2)}</td>
                                            <td className="py-6 pl-4 text-right font-bold text-slate-900">{(item.quantity * item.unit_price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals & QR Code */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                            <div className="flex-1 space-y-8">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Qeyd və Şərtlər</h3>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 leading-relaxed italic">
                                        {invoice.notes || "Bu faktura kompyuter vasitəsilə generasiya olunub. Zəhmət olmasa vaxtında ödəniş edin."}
                                    </div>
                                </div>

                                {!isPaid && (
                                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-6">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-blue-100">
                                            <QRCodeSVG
                                                value={window.location.origin + '/public/pay/' + token}
                                                size={100}
                                                level="H"
                                                includeMargin={false}
                                                imageSettings={{
                                                    src: "/favicon.ico",
                                                    x: undefined,
                                                    y: undefined,
                                                    height: 24,
                                                    width: 24,
                                                    excavate: true,
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Smartphone size={18} className="text-blue-600" />
                                                <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Sürətli Ödəniş</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Mobil telefonunuzla skan edərək <br /> dərhal ödəniş edin.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="w-full md:w-80 space-y-4 pt-4 border-t-4 border-slate-900">
                                <div className="flex justify-between text-sm text-slate-500 font-medium px-2">
                                    <span>Cəm:</span>
                                    <span>{subtotal.toFixed(2)} ₼</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500 font-medium px-2">
                                    <span>ƏDV (18%):</span>
                                    <span>{tax.toFixed(2)} ₼</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black text-slate-900 bg-slate-100 p-4 rounded-2xl">
                                    <span>YEKUN:</span>
                                    <span className="text-blue-600">{total.toFixed(2)} ₼</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Branding */}
                    <div className="bg-slate-50 py-10 px-8 border-t border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-[10px] text-white font-bold">AZ</div>
                            <span className="text-xs font-bold text-slate-800 tracking-tighter">Powered by InvoiceAZ</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Bütün Hüquqlar Qorunur © 2026</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PublicInvoice;
