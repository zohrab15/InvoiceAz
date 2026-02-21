import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clientApi from '../api/client';
import {
    TrendingUp, Clock, AlertCircle, Plus, Wallet,
    ArrowUpRight, ArrowDownRight, BarChart3,
    FileText, Calendar, Activity
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, ComposedChart, Bar, CartesianGrid
} from 'recharts';

import { useBusiness } from '../context/BusinessContext';
import TopProductsChart from '../components/TopProductsChart';
import CountUp from '../components/CountUp';
import useAuthStore from '../store/useAuthStore';

const Dashboard = () => {
    const { activeBusiness } = useBusiness();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ['invoices', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/');
            return res.data;
        },
        enabled: !!activeBusiness,
        retry: false,
    });

    const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
        queryKey: ['expenses', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/expenses/');
            return res.data;
        },
        enabled: !!activeBusiness && activeBusiness?.user_role !== 'SALES_REP',
        retry: false,
    });

    const { data: payments, isLoading: isLoadingPayments } = useQuery({
        queryKey: ['payments', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/payments/');
            return res.data;
        },
        enabled: !!activeBusiness && activeBusiness?.user_role !== 'SALES_REP',
        retry: false,
    });

    const isLoading = isLoadingInvoices || isLoadingExpenses || isLoadingPayments;

    // Time-aware greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Sabahınız xeyir';
        if (hour < 17) return 'Günortanız xeyir';
        return 'Axşamınız xeyir';
    }, []);

    const todayStr = useMemo(() => {
        const d = new Date();
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
        const days = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${days[d.getDay()]}`;
    }, []);

    const stats = {
        totalRevenue: (invoices || []).reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0,
        paidRevenue: (invoices || []).filter(i => i.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0,
        pendingRevenue: (invoices || []).filter(i => i.status === 'sent').reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0,
        totalExpenses: (expenses || []).reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0,
        invoiceCount: (invoices || []).length || 0,
        paidCount: (invoices || []).filter(i => i.status === 'paid').length || 0,
    };

    const profit = stats.paidRevenue - stats.totalExpenses;

    const monthlyData = useMemo(() => {
        const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyun', 'İyul', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
        const currentMonth = new Date().getMonth();
        const data = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(currentMonth - i);
            const m = date.getMonth();
            const y = date.getFullYear();

            const monthIncome = (invoices || []).filter(inv => {
                const d = new Date(inv.invoice_date);
                return d.getMonth() === m && d.getFullYear() === y;
            }).reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;

            const monthExpense = (expenses || []).filter(exp => {
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

    const recentTransactions = useMemo(() => {
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
        // Filter out items with missing or invalid dates to prevent crashes
        const validTrans = trans.filter(t => t.rawDate && !isNaN(t.date.getTime()));
        return validTrans.sort((a, b) => b.date - a.date).slice(0, 7);
    }, [invoices, expenses, payments]);

    if (isLoading) return (
        <div className="h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Clock size={32} />
            </motion.div>
        </div>
    );

    const rawRole = activeBusiness?.user_role;
    const role = (rawRole || 'SALES_REP').toUpperCase();

    const isInventoryManager = role === 'INVENTORY_MANAGER';
    const isOwnerOrManager = ['OWNER', 'MANAGER'].includes(role);
    const isAccountant = role === 'ACCOUNTANT';

    const statCards = [
        {
            label: 'Ümumi Gəlir',
            val: stats.totalRevenue,
            icon: <TrendingUp size={20} />,
            color: '#3b82f6',
            bg: 'rgba(59,130,246,0.08)',
            border: '#3b82f6',
            visible: !isInventoryManager
        },
        {
            label: 'Gözləyən',
            val: stats.pendingRevenue,
            icon: <Clock size={20} />,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.08)',
            border: '#f59e0b',
            visible: !isInventoryManager
        },
        {
            label: 'Ümumi Xərclər',
            val: stats.totalExpenses,
            icon: <Wallet size={20} />,
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.08)',
            border: '#ef4444',
            visible: isOwnerOrManager || isAccountant
        },
        {
            label: 'Xalis Mənfəət',
            val: profit,
            icon: profit >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />,
            color: profit >= 0 ? '#10b981' : '#ef4444',
            bg: profit >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: profit >= 0 ? '#10b981' : '#ef4444',
            visible: isOwnerOrManager || isAccountant
        },
    ].filter(card => card.visible);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-8 pb-16"
        >
            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-roboto" style={{ color: 'var(--color-text-primary)' }}>
                        {greeting}{user?.first_name ? `, ${user.first_name}` : ''} 👋
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-xs font-semibold capitalize" style={{ color: 'var(--color-text-muted)' }}>{todayStr}</span>
                    </div>
                </div>
                {isOwnerOrManager && (
                    <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/invoices')}
                        className="text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition-all"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
                            boxShadow: '0 4px 14px var(--color-brand-shadow)'
                        }}
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>Yeni Faktura</span>
                    </motion.button>
                )}
            </div>

            {/* ── STAT CARDS ── */}
            <div className={`grid grid-cols-2 lg:grid-cols-${statCards.length} gap-4`}>
                {statCards.map((s, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        key={s.label}
                        className="p-5 rounded-2xl transition-all relative overflow-hidden"
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            border: '1px solid var(--color-card-border)',
                            borderLeft: `3px solid ${s.border}`
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                            <div className="p-2 rounded-lg" style={{ backgroundColor: s.bg, color: s.color }}>
                                {s.icon}
                            </div>
                        </div>
                        <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                            <CountUp to={s.val} decimals={2} />
                            <span className="text-xs font-semibold ml-1.5" style={{ color: 'var(--color-text-muted)' }}>₼</span>
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* ── CHART + TRANSACTIONS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Chart — 3 cols */}
                {(isOwnerOrManager || isAccountant) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-3 p-6 rounded-2xl"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <div>
                                <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Maliyyə İcmalı</h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Son 6 aylıq gəlir və xərc</p>
                            </div>
                            <div className="flex gap-5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    Gəlir
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                    Xərc
                                </div>
                            </div>
                        </div>

                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                                <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gəlirGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--color-card-border)"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 600 }}
                                        tickFormatter={v => v > 0 ? `${(v / 1000).toFixed(0)}k` : '0'}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--color-hover-bg)', opacity: 0.5 }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload?.length) {
                                                return (
                                                    <div
                                                        className="p-4 rounded-xl shadow-xl backdrop-blur-md min-w-[180px]"
                                                        style={{
                                                            backgroundColor: 'var(--color-dropdown-bg)',
                                                            border: '1px solid var(--color-dropdown-border)'
                                                        }}
                                                    >
                                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-3 pb-2"
                                                            style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-card-border)' }}>
                                                            {label}
                                                        </p>
                                                        <div className="space-y-2">
                                                            {payload.map((entry, idx) => (
                                                                <div key={idx} className="flex justify-between items-center gap-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                        <span className="text-xs font-medium capitalize" style={{ color: 'var(--color-text-secondary)' }}>{entry.name}</span>
                                                                    </div>
                                                                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                                                        {entry.value?.toLocaleString()} ₼
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
                                    <Area
                                        type="monotone"
                                        dataKey="gəlir"
                                        name="gəlir"
                                        fill="url(#gəlirGrad)"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        animationDuration={1200}
                                    />
                                    <Bar
                                        dataKey="xərc"
                                        name="xərc"
                                        fill="#fb7185"
                                        radius={[4, 4, 0, 0]}
                                        barSize={16}
                                        animationDuration={1200}
                                        opacity={0.85}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

                {/* Transactions — 2 cols */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`${(isOwnerOrManager || isAccountant) ? 'lg:col-span-2' : 'lg:col-span-5'} p-6 rounded-2xl flex flex-col`}
                    style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                >
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Son Əməliyyatlar</h3>
                        <Activity size={16} style={{ color: 'var(--color-text-muted)' }} />
                    </div>

                    <div className="space-y-1 flex-1 overflow-y-auto">
                        {recentTransactions.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => navigate(t.type === 'expense' ? '/expenses' : '/invoices')}
                                className="flex justify-between items-center py-3 px-3 rounded-xl cursor-pointer transition-colors"
                                style={{ '--hover-bg': 'var(--color-hover-bg)' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-hover-bg)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{
                                            backgroundColor: t.type === 'payment' ? 'rgba(16,185,129,0.1)' :
                                                t.type === 'expense' ? 'rgba(239,68,68,0.1)' : 'var(--color-badge-bg)',
                                            color: t.type === 'payment' ? '#10b981' :
                                                t.type === 'expense' ? '#ef4444' : 'var(--color-text-secondary)'
                                        }}
                                    >
                                        {t.type === 'expense' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{t.title}</div>
                                        <div className="text-[10px] font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
                                            {t.subtitle}
                                            {t.type === 'payment' && <span className="text-emerald-500 ml-1">• ödəniş</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                    <div className={`text-sm font-bold ${t.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {t.positive ? '+' : '-'}<CountUp to={t.amount} decimals={2} />
                                    </div>
                                    <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                        {(() => {
                                            if (!t.date || isNaN(t.date.getTime())) return '---';
                                            const shortMonths = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
                                            return `${t.date.getDate()} ${shortMonths[t.date.getMonth()]}`;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => navigate('/analytics/tax')}
                        className="w-full py-3 mt-4 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-wider"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
                            boxShadow: '0 4px 12px var(--color-brand-shadow)'
                        }}
                    >
                        Bütün Hesabata Bax
                    </button>
                </motion.div>
            </div>

            {/* ── TOP PRODUCTS — Full Width ── */}
            <TopProductsChart />
        </motion.div>
    );
};

export default Dashboard;
