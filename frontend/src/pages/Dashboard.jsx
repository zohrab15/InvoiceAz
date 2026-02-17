import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { TrendingUp, Clock, AlertCircle, Plus, Wallet, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Line } from 'recharts';

import { useBusiness } from '../context/BusinessContext';
import TopProductsChart from '../components/TopProductsChart';
import CountUp from '../components/CountUp';

const Dashboard = () => {
    const { activeBusiness } = useBusiness();
    const navigate = useNavigate();

    const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ['invoices', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
        queryKey: ['expenses', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/expenses/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const { data: payments, isLoading: isLoadingPayments } = useQuery({
        queryKey: ['payments', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/payments/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const isLoading = isLoadingInvoices || isLoadingExpenses || isLoadingPayments;

    const stats = {
        totalRevenue: invoices?.reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0,
        paidRevenue: invoices?.filter(i => i.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0,
        pendingRevenue: invoices?.filter(i => i.status === 'sent').reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0,
        totalExpenses: expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0,
    };

    const profit = stats.paidRevenue - stats.totalExpenses;

    const monthlyData = React.useMemo(() => {
        const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyun', 'İyul', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
        const currentMonth = new Date().getMonth();
        const data = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(currentMonth - i);
            const m = date.getMonth();
            const y = date.getFullYear();

            const monthIncome = invoices?.filter(inv => {
                const d = new Date(inv.invoice_date);
                return d.getMonth() === m && d.getFullYear() === y;
            }).reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;

            const monthExpense = expenses?.filter(exp => {
                const d = new Date(exp.date);
                return d.getMonth() === m && d.getFullYear() === y;
            }).reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;

            data.push({
                name: months[m],
                gəlir: monthIncome,
                xərc: monthExpense
            });
        }
        return data;
    }, [invoices, expenses]);

    const recentTransactions = React.useMemo(() => {
        const trans = [
            ...(invoices || []).map(inv => ({
                id: `inv-${inv.id}`,
                type: 'invoice',
                title: `#${inv.invoice_number}`,
                subtitle: inv.client_name,
                amount: parseFloat(inv.total),
                date: new Date(inv.invoice_date),
                rawDate: inv.invoice_date,
                positive: true,
                status: inv.status
            })),
            ...(expenses || []).map(exp => ({
                id: `exp-${exp.id}`,
                type: 'expense',
                title: exp.description,
                subtitle: exp.category,
                amount: parseFloat(exp.amount),
                date: new Date(exp.created_at),
                rawDate: exp.created_at,
                positive: false
            })),
            ...(payments || []).map(pay => ({
                id: `pay-${pay.id}`,
                type: 'payment',
                title: `Ödəniş: #${pay.invoice_number}`,
                subtitle: pay.client_name,
                amount: parseFloat(pay.amount),
                date: new Date(pay.created_at),
                rawDate: pay.created_at,
                positive: true
            }))
        ];
        return trans.sort((a, b) => b.date - a.date).slice(0, 6);
    }, [invoices, expenses, payments]);

    if (isLoading) return (
        <div className="h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Clock size={32} />
            </motion.div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-10 pb-20"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 font-roboto" style={{ color: 'var(--color-text-primary)' }}>
                        Dashboard <span className="block text-xs sm:text-sm font-bold tracking-widest uppercase mt-2" style={{ color: 'var(--color-brand)' }}>Biznesinizin ümumi görünüşü</span>
                    </h2>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <motion.a
                        whileHover={{ y: -2 }}
                        href="/expenses"
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-sm"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)' }}
                    >
                        <Wallet size={18} /> <span className="whitespace-nowrap">Yeni Xərc</span>
                    </motion.a>
                    <motion.a
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href="/invoices"
                        className="flex-2 sm:flex-none text-white px-6 sm:px-8 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-2xl transition-all font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))', boxShadow: '0 10px 30px var(--color-brand-shadow)' }}
                    >
                        <Plus size={18} /> <span className="whitespace-nowrap">Yeni Faktura</span>
                    </motion.a>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ümumi Gəlir', val: stats.totalRevenue, icon: <TrendingUp size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                    { label: 'Gözləyən', val: stats.pendingRevenue, icon: <Clock size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    { label: 'Ümumi Xərclər', val: stats.totalExpenses, icon: <Wallet size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                    {
                        label: 'Xalis Mənfəət',
                        val: profit,
                        icon: profit >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />,
                        color: profit >= 0 ? '#10b981' : '#ef4444',
                        bg: profit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
                    },
                ].map((s, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={s.label}
                        className="p-5 sm:p-7 rounded-[2rem] hover:shadow-2xl transition-all group relative overflow-hidden backdrop-blur-sm"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20 group-hover:scale-150 transition-transform duration-700" style={{ backgroundColor: s.bg }} />
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3.5 rounded-2xl" style={{ backgroundColor: s.bg, color: s.color }}>
                                {s.icon}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black tracking-tighter" style={{ color: 'var(--color-text-primary)' }}>
                            <CountUp to={s.val} decimals={0} /> <span className="text-xs font-bold ml-1" style={{ color: 'var(--color-text-muted)' }}>₼</span>
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 p-6 sm:p-10 rounded-[2.5rem] backdrop-blur-sm"
                    style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                        <h3 className="font-black text-lg tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: 'var(--color-brand)' }} />
                            Performans Analitikası
                        </h3>
                        <div className="flex gap-4 sm:gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-lg" style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.4)' }} />
                                <span>Gəlir</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-lg" style={{ boxShadow: '0 2px 8px rgba(251,113,133,0.4)' }} />
                                <span>Xərc</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64 sm:h-80 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-hover-bg)', opacity: 0.4 }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/20 dark:border-slate-800/50 min-w-[200px]">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">{label} Ayı</p>
                                                    <div className="space-y-4">
                                                        {payload.map((entry, index) => (
                                                            <div key={index} className="flex justify-between items-center gap-8">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}80` }} />
                                                                    <span className="text-xs font-bold text-slate-500 capitalize">{entry.name}</span>
                                                                </div>
                                                                <span className="text-sm font-black dark:text-white" style={{ color: 'var(--color-text-primary)' }}>
                                                                    {entry.value.toLocaleString()} ₼
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="gəlir"
                                    name="gəlir"
                                    fill="#2563eb"
                                    radius={[10, 10, 0, 0]}
                                    barSize={20}
                                    animationDuration={1500}
                                />
                                <Bar
                                    dataKey="xərc"
                                    name="xərc"
                                    fill="#fb7185"
                                    radius={[10, 10, 0, 0]}
                                    barSize={20}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 sm:p-10 rounded-[2.5rem] flex flex-col backdrop-blur-sm"
                    style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                >
                    <h3 className="font-black text-lg tracking-tight mb-8" style={{ color: 'var(--color-text-primary)' }}>Son Əməliyyatlar</h3>
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                        {recentTransactions.map((t, i) => (
                            <div
                                key={t.id}
                                onClick={() => navigate(t.type === 'expense' ? '/expenses' : '/invoices')}
                                className="flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-transform"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
                                        style={{
                                            backgroundColor: t.type === 'payment' ? 'rgba(16,185,129,0.1)' :
                                                t.type === 'expense' ? 'rgba(239,68,68,0.1)' : 'var(--color-hover-bg)',
                                            color: t.type === 'payment' ? '#10b981' :
                                                t.type === 'expense' ? '#ef4444' : 'var(--color-text-secondary)'
                                        }}
                                    >
                                        {t.type === 'expense' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-black text-sm" style={{ color: 'var(--color-text-primary)' }}>{t.title}</div>
                                        <div className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                                            {t.subtitle}
                                            {t.type === 'payment' && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }} />}
                                            {t.type === 'payment' && <span className="text-emerald-500 lowercase">ödəniş</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-sm font-black ${t.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {t.positive ? '+' : '-'}<CountUp to={t.amount} decimals={2} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/analytics/tax')}
                        className="w-full py-4 mt-8 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest"
                        style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))', boxShadow: '0 10px 30px var(--color-brand-shadow)' }}
                    >
                        Bütün Hesabata Bax
                    </button>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <TopProductsChart />
                </div>
                <div className="p-6 sm:p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-sm"
                    style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="font-roboto font-black text-lg" style={{ color: 'var(--color-text-primary)' }}>Satış Artımı</h3>
                    <p className="text-sm px-4" style={{ color: 'var(--color-text-secondary)' }}>Mehsul bazasında statistikalar satış strategiyanızı gücləndirir.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
