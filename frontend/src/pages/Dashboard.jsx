import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { TrendingUp, Clock, AlertCircle, Plus, Wallet, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

import { useBusiness } from '../context/BusinessContext';
import TopProductsChart from '../components/TopProductsChart';

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

    // Aggregated real monthly data
    const monthlyData = React.useMemo(() => {
        const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyun', 'İyul', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
        const currentMonth = new Date().getMonth();
        const data = [];

        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(currentMonth - i);
            const m = date.getMonth();
            const y = date.getFullYear();

            const monthIncome = invoices?.filter(inv => {
                const d = new Date(inv.created_at);
                return d.getMonth() === m && d.getFullYear() === y;
            }).reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;

            const monthExpense = expenses?.filter(exp => {
                const d = new Date(exp.date); // Use 'date' field from Expense model
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
                date: new Date(inv.created_at),
                rawDate: inv.created_at,
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
        <div className="h-full flex items-center justify-center text-gray-400">
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
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2 font-outfit">
                        Dashboard <span className="text-blue-600 block text-sm font-bold tracking-widest uppercase mt-2">Biznesinizin ümumi görünüşü</span>
                    </h2>
                </div>
                <div className="flex gap-4 mb-2">
                    <motion.a
                        whileHover={{ y: -2 }}
                        href="/expenses"
                        className="glass px-6 py-3 rounded-2xl flex items-center gap-2 text-slate-600 hover:text-red-500 transition-all font-bold text-sm"
                    >
                        <Wallet size={18} /> Yeni Xərc
                    </motion.a>
                    <motion.a
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href="/invoices"
                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-2 shadow-2xl shadow-slate-200 transition-all font-bold text-sm"
                    >
                        <Plus size={18} /> Yeni Faktura
                    </motion.a>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Ümumi Gəlir', val: stats.totalRevenue, icon: <TrendingUp size={20} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Gözləyən', val: stats.pendingRevenue, icon: <Clock size={20} />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Ümumi Xərclər', val: stats.totalExpenses, icon: <Wallet size={20} />, color: 'text-red-500', bg: 'bg-red-500/10' },
                    {
                        label: 'Xalis Mənfəət',
                        val: profit,
                        icon: profit >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />,
                        color: profit >= 0 ? 'text-emerald-500' : 'text-red-500',
                        bg: profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    },
                ].map((s, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={s.label}
                        className="glass p-7 rounded-[2rem] hover:shadow-2xl transition-all group relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} rounded-bl-full opacity-20 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3.5 rounded-2xl ${s.bg} ${s.color}`}>
                                {s.icon}
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</p>
                        </div>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">
                            {s.val.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-1">₼</span>
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 glass p-10 rounded-[2.5rem]"
                >
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-3">
                            <div className="w-2 h-8 bg-blue-600 rounded-full" />
                            Performans Analitikası
                        </h3>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-lg shadow-blue-200" />
                                <span>Gəlir</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-lg shadow-red-200" />
                                <span>Xərc</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FB7185" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                                    itemStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                                />
                                <Area type="monotone" dataKey="gəlir" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="xərc" stroke="#FB7185" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass p-10 rounded-[2.5rem] flex flex-col"
                >
                    <h3 className="font-black text-slate-900 text-lg tracking-tight mb-8">Son Əməliyyatlar</h3>
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                        {recentTransactions.map((t, i) => (
                            <div
                                key={t.id}
                                onClick={() => navigate(t.type === 'expense' ? '/expenses' : '/invoices')}
                                className="flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-transform"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${t.type === 'payment' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                                        t.type === 'expense' ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' :
                                            'bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white'
                                        }`}>
                                        {t.type === 'expense' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 text-sm">{t.title}</div>
                                        <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                                            {t.subtitle}
                                            {t.type === 'payment' && <span className="w-1 h-1 rounded-full bg-slate-300" />}
                                            {t.type === 'payment' && <span className="text-emerald-500 lowercase">ödəniş</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-sm font-black ${t.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {t.positive ? '+' : '-'}{t.amount.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full py-4 mt-8 bg-slate-900 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-slate-200 transition-all text-[10px] uppercase tracking-widest">
                        Bütün Hesabata Bax
                    </button>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <TopProductsChart />
                </div>
                <div className="glass p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="font-outfit font-black text-slate-900 text-lg">Satış Artımı</h3>
                    <p className="text-slate-500 text-sm">Mehsul bazasında statistikalar satış strategiyanızı gücləndirir.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
