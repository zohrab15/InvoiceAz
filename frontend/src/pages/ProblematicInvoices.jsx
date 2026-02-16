import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clientApi from '../api/client';
import { useBusiness } from '../context/BusinessContext';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    AlertTriangle, AlertOctagon, Users, DollarSign,
    Calendar, Send, ArrowRight, Download, MessageCircle, Phone, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ProblematicInvoices = () => {
    const { activeBusiness } = useBusiness();
    const [activeDropdown, setActiveDropdown] = useState(null);

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['issues-analytics', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/analytics/issues/', {
                params: { business_id: activeBusiness?.id }
            });
            return res.data;
        },
        enabled: !!activeBusiness
    });

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!analytics) return <div>Məlumat yoxdur</div>;

    const { kpi, aging, debtors } = analytics;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <AlertTriangle className="text-red-500" size={32} />
                        Problemli Fakturalar
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gecikmiş ödənişlər və riskli müştərilərin təhlili</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ümumi Gecikmə</h3>
                    </div>
                    <div className="text-3xl font-black text-slate-900 relative z-10">
                        {kpi.total_overdue.toFixed(2)} ₼
                    </div>
                    <p className="text-xs text-red-500 font-bold mt-2 relative z-10">Ödənilməmiş məbləğ</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <AlertOctagon size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Kritik Borc (90+ gün)</h3>
                    </div>
                    <div className="text-3xl font-black text-slate-900 relative z-10">
                        {kpi.critical_debt.toFixed(2)} ₼
                    </div>
                    <p className="text-xs text-orange-500 font-bold mt-2 relative z-10">Risk altında olan gəlir</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Borclu Müştərilər</h3>
                    </div>
                    <div className="text-3xl font-black text-slate-900 relative z-10">
                        {kpi.debtors_count}
                    </div>
                    <p className="text-xs text-blue-500 font-bold mt-2 relative z-10">Aktiv gecikməsi olanlar</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Aging Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-500" />
                        Gecikmə Müddəti (Aging)
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aging} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value}₼`} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={50}>
                                    {aging.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 3 ? '#EF4444' : index === 2 ? '#F97316' : '#3B82F6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions / Tips */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-lg text-white">
                    <h3 className="text-xl font-black mb-4">Məsləhətlər 💡</h3>
                    <div className="space-y-6">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <h4 className="font-bold text-red-200 mb-1">90+ Günü Keçənlər</h4>
                            <p className="text-sm text-gray-300">Bu müştərilərlə şəxsən əlaqə saxlamağınız tövsiyə olunur. Hüquqi addımlar barədə düşünün.</p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <h4 className="font-bold text-blue-200 mb-1">Xatırlatma Göndərin</h4>
                            <p className="text-sm text-gray-300">Gecikmənin ilk həftəsində göndərilən xatırlatmalar ödəmə şansını 60% artırır.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Debtors Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-visible">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">Borcluların Siyahısı</h3>
                    </div>
                    <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                        <Download size={16} />
                        Siyahını Yüklə
                    </button>
                </div>
                <div className="overflow-x-visible">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Müştəri</th>
                                <th className="px-8 py-4">Əlaqə</th>
                                <th className="px-8 py-4 text-center">Faktura Sayı</th>
                                <th className="px-8 py-4 text-center">Maks. Gecikmə</th>
                                <th className="px-8 py-4 text-right">Cəmi Borc</th>
                                <th className="px-8 py-4 text-center">Əməliyyat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {debtors.length === 0 ? (
                                <tr><td colSpan="6" className="p-12 text-center text-gray-400 italic">Gecikən borc yoxdur 🎉</td></tr>
                            ) : (
                                debtors.map((debtor) => (
                                    <tr key={debtor.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-4 font-bold text-slate-900">{debtor.name}</td>
                                        <td className="px-8 py-4">
                                            <div className="text-xs font-medium text-slate-500">
                                                <div>{debtor.email}</div>
                                                <div>{debtor.phone}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center font-bold text-slate-700">{debtor.invoices_count}</td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider 
                                                ${debtor.max_overdue_days > 90 ? 'bg-red-100 text-red-600' :
                                                    debtor.max_overdue_days > 30 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {debtor.max_overdue_days} gün
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right font-black text-slate-900">
                                            {debtor.total_debt.toFixed(2)} ₼
                                        </td>
                                        <td className="px-8 py-4 text-center relative">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === debtor.id ? null : debtor.id)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                                            >
                                                <Send size={14} />
                                                Xatırlat
                                            </button>

                                            {activeDropdown === debtor.id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                                    <div className="absolute right-8 top-12 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 flex flex-col gap-1 text-left">
                                                        <a
                                                            href={`https://wa.me/${debtor.phone?.replace(/[^0-9]/g, '')}?text=Hörmətli ${debtor.name}, sizin ${debtor.total_debt} AZN gecikmiş borcunuz var. Xahiş edirik ödəniş edəsiniz.`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-green-50 text-slate-600 hover:text-green-600 rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <MessageCircle size={16} />
                                                            WhatsApp
                                                        </a>
                                                        <a
                                                            href={`mailto:${debtor.email}?subject=Ödəniş Xatırlatması&body=Hörmətli ${debtor.name},%0D%0A%0D%0ASizin ${debtor.total_debt} AZN məbləğində gecikmiş borcunuz var.`}
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Mail size={16} />
                                                            Email
                                                        </a>
                                                        <a
                                                            href={`tel:${debtor.phone}`}
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Phone size={16} />
                                                            Zəng et
                                                        </a>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default ProblematicInvoices;
