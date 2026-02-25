import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { motion } from 'framer-motion';
import { Download, CheckCircle, Clock, AlertCircle, FileText, Globe, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CURRENCY_SYMBOLS } from '../utils/currency';

const ModernTheme = ({ invoice, subtotal, tax, total, isPaid, isPayable, token, currencySymbol }) => (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className={`py-4 px-8 text-center text-sm font-bold uppercase tracking-widest ${isPaid ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
            {isPaid ? (
                <span className="flex items-center justify-center gap-2"><CheckCircle size={18} /> Bu faktura ödənilib</span>
            ) : invoice.status === 'draft' ? (
                <span className="flex items-center justify-center gap-2"><FileText size={18} /> Qaralama Faktura</span>
            ) : (
                <span className="flex items-center justify-center gap-2"><Clock size={18} /> Ödəniş Gözlənilir</span>
            )}
        </div>

        <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
                <div className="space-y-4">
                    {invoice.business_details?.logo && (
                        <img src={invoice.business_details.logo.startsWith('http') ? invoice.business_details.logo : `${API_URL}${invoice.business_details.logo}`} alt="Logo" className="h-16 w-auto object-contain mb-4 rounded-xl shadow-sm" />
                    )}
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{invoice.business_details?.name}</h2>
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
                            <p className="text-sm font-bold text-slate-800">
                                {(() => {
                                    const d = new Date(invoice.invoice_date);
                                    if (isNaN(d.getTime())) return '---';
                                    const m = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
                                    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
                                })()}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Son Tarix</h3>
                            <p className="text-sm font-bold text-slate-800">
                                {(() => {
                                    const d = new Date(invoice.due_date);
                                    if (isNaN(d.getTime())) return '---';
                                    const m = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
                                    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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

            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                <div className="flex-1 space-y-8">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Qeyd və Şərtlər</h3>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 leading-relaxed italic">
                            {invoice.notes || "Bu faktura kompyuter vasitəsilə generasiya olunub. Zəhmət olmasa vaxtında ödəniş edin."}
                        </div>
                    </div>

                    {isPayable && (
                        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-6">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-blue-100">
                                <QRCodeSVG value={window.location.origin + '/public/pay/' + token} size={100} level="H" includeMargin={false} />
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
                    <div className="flex justify-between text-sm text-slate-500 font-medium px-2"><span>Cəm:</span><span>{subtotal.toFixed(2)} {currencySymbol}</span></div>
                    <div className="flex justify-between text-sm text-slate-500 font-medium px-2"><span>ƏDV (18%):</span><span>{tax.toFixed(2)} {currencySymbol}</span></div>
                    <div className="flex justify-between text-2xl font-black text-slate-900 bg-slate-100 p-4 rounded-2xl"><span>YEKUN:</span><span className="text-blue-600">{total.toFixed(2)} {currencySymbol}</span></div>
                </div>
            </div>
        </div>
    </div>
);

const ClassicTheme = ({ invoice, subtotal, tax, total, isPaid, isPayable, token, currencySymbol }) => (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden font-serif">
        <div className="p-12 md:p-20">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-bold uppercase tracking-widest text-slate-900 border-b-4 border-slate-900 inline-block pb-4 px-8">HESAB-FAKTURA</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Faktura №: {invoice.invoice_number}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
                <div className="space-y-6">
                    <div className="border-l-4 border-slate-900 pl-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">GÖNDƏRƏN</h3>
                        <h2 className="text-2xl font-bold text-slate-900">{invoice.business_details?.name}</h2>
                        <div className="text-sm text-slate-600 space-y-2 mt-4 leading-relaxed">
                            <p>{invoice.business_details?.address}</p>
                            <p>VÖEN: {invoice.business_details?.voen}</p>
                            <p>{invoice.business_details?.email}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="border-l-4 border-slate-200 pl-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">MÜŞTƏRİ</h3>
                        <h2 className="text-2xl font-bold text-slate-900">{invoice.client_details?.name}</h2>
                        <div className="text-sm text-slate-600 space-y-2 mt-4 leading-relaxed">
                            <p>{invoice.client_details?.address || '---'}</p>
                            <p>{invoice.client_details?.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-16 border-y-2 border-slate-900 py-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center bg-slate-50/50">
                <div><h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tarix</h4><p className="font-bold">
                    {(() => {
                        const d = new Date(invoice.invoice_date);
                        if (isNaN(d.getTime())) return '---';
                        const m = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
                        return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
                    })()}
                </p></div>
                <div><h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ödəniş Müddəti</h4><p className="font-bold">
                    {(() => {
                        const d = new Date(invoice.due_date);
                        if (isNaN(d.getTime())) return '---';
                        const m = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
                        return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
                    })()}
                </p></div>
                <div><h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</h4><p className="font-bold uppercase text-blue-700">{invoice.status}</p></div>
                <div><h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ümumi</h4><p className="font-bold text-xl">{total.toFixed(2)} {currencySymbol}</p></div>
            </div>

            <table className="w-full mb-16">
                <thead>
                    <tr className="bg-slate-900 text-white text-xs uppercase tracking-widest">
                        <th className="p-4 text-left">Təsvir</th>
                        <th className="p-4 text-center">Miqdar</th>
                        <th className="p-4 text-right">Vahid Qiymət</th>
                        <th className="p-4 text-right">Cəm</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
                    {invoice.items.map((item, i) => (
                        <tr key={i} className="text-slate-800">
                            <td className="p-5 font-bold">{item.description}</td>
                            <td className="p-5 text-center italic">{item.quantity} {item.unit}</td>
                            <td className="p-5 text-right font-mono">{parseFloat(item.unit_price).toFixed(2)}</td>
                            <td className="p-5 text-right font-bold font-mono">{item.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                <div className="flex-1 space-y-6">
                    <div className="max-w-xs">{isPayable && <QRCodeSVG value={window.location.origin + '/public/pay/' + token} size={120} level="H" includeMargin={true} />}</div>
                    <div className="p-6 bg-slate-50 border italic text-xs text-slate-500 leading-relaxed">{invoice.notes || "Zəhmət olmasa vaxtında ödəniş edin."}</div>
                </div>
                <div className="w-full md:w-80 space-y-4">
                    <div className="flex justify-between text-sm py-2 border-b"><span>Alt-cəm</span><span className="font-mono">{subtotal.toFixed(2)} {currencySymbol}</span></div>
                    <div className="flex justify-between text-sm py-2 border-b"><span>Vergi (18%)</span><span className="font-mono">{tax.toFixed(2)} {currencySymbol}</span></div>
                    <div className="flex justify-between text-2xl font-black pt-4"><span>YEKUN</span><span>{total.toFixed(2)} {currencySymbol}</span></div>
                </div>
            </div>
        </div>
    </div>
);

const MinimalTheme = ({ invoice, subtotal, tax, total, isPaid, isPayable, token, currencySymbol }) => (
    <div className="bg-white p-8 md:p-16 space-y-20 font-inter">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                {invoice.business_details?.logo && (
                    <img src={invoice.business_details.logo.startsWith('http') ? invoice.business_details.logo : `${API_URL}${invoice.business_details.logo}`} alt="Logo" className="h-10 w-auto opacity-80 grayscale hover:grayscale-0 transition-all" />
                )}
                <h1 className="text-sm font-bold tracking-widest uppercase text-slate-400">Invoice #{invoice.invoice_number}</h1>
            </div>
            <div className="text-right">
                <p className="text-4xl font-light tracking-tighter text-slate-900">{total.toFixed(2)} {currencySymbol}</p>
                <p className={`text-[10px] font-black uppercase mt-2 ${isPaid ? 'text-green-500' : 'text-slate-400'}`}>{isPaid ? 'Payment Received' : 'Balance Due'}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-sm">
            <div className="space-y-2"><p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">From</p><p className="font-bold text-slate-800">{invoice.business_details?.name}</p><p className="text-slate-500 text-xs">{invoice.business_details?.email}</p></div>
            <div className="space-y-2"><p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">To</p><p className="font-bold text-slate-800">{invoice.client_details?.name}</p><p className="text-slate-500 text-xs">{invoice.client_details?.email}</p></div>
            <div className="space-y-2"><p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Issued</p><p className="font-medium text-slate-600">{new Date(invoice.invoice_date).toLocaleDateString()}</p></div>
            <div className="space-y-2"><p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Due</p><p className="font-medium text-slate-600">{new Date(invoice.due_date).toLocaleDateString()}</p></div>
        </div>

        <div className="space-y-8">
            <div className="border-t border-slate-100" />
            <div className="space-y-6">
                {invoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center group">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-900">{item.description}</p>
                            <p className="text-[10px] text-slate-400">{item.quantity} × {parseFloat(item.unit_price).toFixed(2)}</p>
                        </div>
                        <p className="font-bold text-slate-900">{parseAmount(item.amount).toFixed(2)} {currencySymbol}</p>
                    </div>
                ))}
            </div>
            <div className="border-t border-slate-100" />
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="max-w-xs text-xs text-slate-400 leading-relaxed font-medium">{invoice.notes || "Thank you for your business."}</div>
            <div className="w-full md:w-64 space-y-4">
                <div className="flex justify-between text-xs text-slate-400"><span>Subtotal</span><span>{subtotal.toFixed(2)} {currencySymbol}</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Tax (18%)</span><span>{tax.toFixed(2)} {currencySymbol}</span></div>
                <div className="flex justify-between text-lg font-bold text-slate-900 border-t pt-4"><span>Total</span><span>{total.toFixed(2)} {currencySymbol}</span></div>
                <div className="pt-6 flex justify-end opacity-20 hover:opacity-100 transition-opacity">
                    {isPayable && <QRCodeSVG value={window.location.origin + '/public/pay/' + token} size={70} level="M" />}
                </div>
            </div>
        </div>
    </div>
);

const PublicInvoice = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/invoices/public/${token}/`);
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
        const url = `${API_URL}/api/invoices/public/${token}/pdf/`;
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
    const isPayable = ['sent', 'viewed', 'overdue'].includes(invoice.status);
    const subtotal = parseFloat(invoice.subtotal);
    const tax = parseFloat(invoice.tax_amount);
    const total = parseFloat(invoice.total);
    const currentTheme = invoice.invoice_theme || 'modern';
    const currencySymbol = CURRENCY_SYMBOLS[invoice.currency] || '₼';
    const parseAmount = (amt) => isNaN(parseFloat(amt)) ? 0 : parseFloat(amt);

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
                            disabled={!isPayable}
                            onClick={handlePay}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg ${!isPayable ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
                        >
                            <span>{isPaid ? 'Ödənilib' : invoice.status === 'draft' ? 'Qaralama' : 'İndi Ödə'}</span>
                        </button>
                    </div>
                </div>

                {/* Main Invoice Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={currentTheme}
                >
                    {currentTheme === 'classic' ? (
                        <ClassicTheme invoice={invoice} subtotal={subtotal} tax={tax} total={total} isPaid={isPaid} isPayable={isPayable} token={token} currencySymbol={currencySymbol} />
                    ) : currentTheme === 'minimal' ? (
                        <MinimalTheme invoice={invoice} subtotal={subtotal} tax={tax} total={total} isPaid={isPaid} isPayable={isPayable} token={token} currencySymbol={currencySymbol} />
                    ) : (
                        <ModernTheme invoice={invoice} subtotal={subtotal} tax={tax} total={total} isPaid={isPaid} isPayable={isPayable} token={token} currencySymbol={currencySymbol} />
                    )}
                </motion.div>

                {/* Footer Branding */}
                {!invoice.business_details?.white_label_enabled && (
                    <div className="py-10 text-center opacity-50">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-[10px] text-white font-bold">AZ</div>
                            <span className="text-xs font-bold text-slate-800 tracking-tighter">Powered by InvoiceAZ</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Bütün Hüquqlar Qorunur © 2026</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicInvoice;
