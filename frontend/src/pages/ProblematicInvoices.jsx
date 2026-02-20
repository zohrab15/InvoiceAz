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
import UpgradeModal from '../components/UpgradeModal';
import usePlanLimits from '../hooks/usePlanLimits';
import { utils, writeFile } from 'xlsx';
const ProblematicInvoices = () => {
    const { activeBusiness } = useBusiness();
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { isFeatureLocked } = usePlanLimits();

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

    const handleDownload = () => {
        if (isFeatureLocked('csv_export')) {
            setShowUpgradeModal(true);
            return;
        }

        if (!analytics?.debtors) return;

        // Prepare data for Excel
        const data = analytics.debtors.map(debtor => ({
            'Müştəri': debtor.name,
            'Email': debtor.email,
            'Telefon': debtor.phone,
            'Faktura Sayı': debtor.invoices_count,
            'Maks. Gecikmə (Gün)': debtor.max_overdue_days,
            'Cəmi Borc (AZN)': debtor.total_debt.toFixed(2)
        }));

        const worksheet = utils.json_to_sheet(data);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Borclular");

        // Column widths
        const wscols = [
            { wch: 20 }, // Müştəri
            { wch: 25 }, // Email
            { wch: 15 }, // Telefon
            { wch: 12 }, // Faktura Sayı
            { wch: 18 }, // Maks. Gecikmə
            { wch: 15 }, // Cəmi Borc
        ];
        worksheet['!cols'] = wscols;

        writeFile(workbook, "borclular_siyahisi.xlsx");
    };

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
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                        <AlertTriangle className="text-red-500" size={32} />
                        Problemli Fakturalar
                    </h1>
                    <p className="font-medium mt-1" style={{ color: 'var(--color-text-secondary)' }}>Gecikmiş ödənişlər və riskli müştərilərin təhlili</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border shadow-sm relative overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: '#EF444430' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#EF444415', color: '#EF4444' }}>
                            <DollarSign size={20} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Ümumi Gecikmə</h3>
                    </div>
                    <div className="text-3xl font-black relative z-10" style={{ color: 'var(--color-text-primary)' }}>
                        {kpi.total_overdue.toFixed(2)} ₼
                    </div>
                    <p className="text-xs text-red-500 font-bold mt-2 relative z-10">Ödənilməmiş məbləğ</p>
                </div>

                <div className="p-6 rounded-2xl border shadow-sm relative overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: '#F9731630' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#F9731615', color: '#F97316' }}>
                            <AlertOctagon size={20} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Kritik Borc (90+ gün)</h3>
                    </div>
                    <div className="text-3xl font-black relative z-10" style={{ color: 'var(--color-text-primary)' }}>
                        {kpi.critical_debt.toFixed(2)} ₼
                    </div>
                    <p className="text-xs text-orange-500 font-bold mt-2 relative z-10">Risk altında olan gəlir</p>
                </div>

                <div className="p-6 rounded-2xl border shadow-sm relative overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: '#3B82F630' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#3B82F615', color: '#3B82F6' }}>
                            <Users size={20} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Borclu Müştərilər</h3>
                    </div>
                    <div className="text-3xl font-black relative z-10" style={{ color: 'var(--color-text-primary)' }}>
                        {kpi.debtors_count}
                    </div>
                    <p className="text-xs text-blue-500 font-bold mt-2 relative z-10">Aktiv gecikməsi olanlar</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Aging Chart */}
                <div className="lg:col-span-2 p-8 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Calendar size={20} className="text-blue-500" />
                        Gecikmə Müddəti (Aging)
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                            <BarChart data={aging} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-card-border)" />
                                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} tickFormatter={(value) => `${value}₼`} />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-hover-bg)', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: 'var(--color-dropdown-bg)', borderRadius: '12px', border: '1px solid var(--color-dropdown-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                <div
                    className="p-8 rounded-3xl shadow-xl border space-y-6"
                    style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)', color: 'var(--color-text-primary)' }}
                >
                    <h3 className="text-xl font-black mb-4">Məsləhətlər 💡</h3>
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--color-badge-bg)', borderColor: 'var(--color-card-border)' }}>
                            <h4 className="font-bold text-red-500 mb-1">90+ Günü Keçənlər</h4>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Bu müştərilərlə şəxsən əlaqə saxlamağınız tövsiyə olunur. Hüquqi addımlar barədə düşünün.</p>
                        </div>
                        <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--color-badge-bg)', borderColor: 'var(--color-card-border)' }}>
                            <h4 className="font-bold text-blue-500 mb-1">Xatırlatma Göndərin</h4>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Gecikmənin ilk həftəsində göndərilən xatırlatmalar ödəmə şansını 60% artırır.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Debtors Table */}
            <div className="rounded-3xl border shadow-sm overflow-visible" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                <div className="p-8 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-card-border)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#EF444415', color: '#EF4444' }}>
                            <Users size={20} />
                        </div>
                        <h3 className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>Borcluların Siyahısı</h3>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 text-sm font-bold transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <Download size={16} />
                        Siyahını Yüklə
                    </button>
                </div>
                <div className="overflow-x-visible">
                    <table className="w-full text-left">
                        <thead style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-muted)' }} className="text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Müştəri</th>
                                <th className="px-8 py-4">Əlaqə</th>
                                <th className="px-8 py-4 text-center">Faktura Sayı</th>
                                <th className="px-8 py-4 text-center">Maks. Gecikmə</th>
                                <th className="px-8 py-4 text-right">Cəmi Borc</th>
                                <th className="px-8 py-4 text-center">Əməliyyat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--color-card-border)' }}>
                            {debtors.length === 0 ? (
                                <tr><td colSpan="6" className="p-12 text-center text-gray-400 italic">Gecikən borc yoxdur 🎉</td></tr>
                            ) : (
                                debtors.map((debtor) => (
                                    <tr key={debtor.id} className="transition-colors group" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-hover-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td className="px-8 py-4 font-bold" style={{ color: 'var(--color-text-primary)' }}>{debtor.name}</td>
                                        <td className="px-8 py-4">
                                            <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                <div>{debtor.email}</div>
                                                <div>{debtor.phone}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center font-bold" style={{ color: 'var(--color-text-secondary)' }}>{debtor.invoices_count}</td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider 
                                                ${debtor.max_overdue_days > 90 ? 'bg-red-100 text-red-600' :
                                                    debtor.max_overdue_days > 30 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {debtor.max_overdue_days} gün
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right font-black" style={{ color: 'var(--color-text-primary)' }}>
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
                                                    <div className="absolute right-8 top-12 z-50 rounded-xl shadow-xl border p-2 w-48 flex flex-col gap-1 text-left" style={{ backgroundColor: 'var(--color-dropdown-bg)', borderColor: 'var(--color-dropdown-border)' }}>
                                                        <a
                                                            href={`https://wa.me/${debtor.phone?.replace(/[^0-9]/g, '')}?text=Hörmətli ${debtor.name}, sizin ${debtor.total_debt} AZN gecikmiş borcunuz var. Xahiş edirik ödəniş edəsiniz.`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-green-500/10 text-[var(--color-text-secondary)] hover:text-green-500 rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <MessageCircle size={16} />
                                                            WhatsApp
                                                        </a>
                                                        <a
                                                            href={`mailto:${debtor.email}?subject=Ödəniş Xatırlatması&body=Hörmətli ${debtor.name},%0D%0A%0D%0ASizin ${debtor.total_debt} AZN məbləğində gecikmiş borcunuz var.`}
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-blue-500/10 text-[var(--color-text-secondary)] hover:text-blue-500 rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Mail size={16} />
                                                            Email
                                                        </a>
                                                        <a
                                                            href={`tel:${debtor.phone}`}
                                                            className="flex items-center gap-3 px-3 py-2 hover:bg-orange-500/10 text-[var(--color-text-secondary)] hover:text-orange-500 rounded-lg transition-colors text-sm font-medium"
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
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                resourceName="Excel Eksport"
                limit="məhdud"
            />
        </motion.div>
    );
};

export default ProblematicInvoices;
