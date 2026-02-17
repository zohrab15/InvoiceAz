import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clientApi from '../api/client';
import { useBusiness } from '../context/BusinessContext';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Calendar, CreditCard, Activity, Users, TrendingUp, AlertCircle, CheckCircle2, Building, DollarSign } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const PaymentAnalytics = () => {
    const { activeBusiness } = useBusiness();

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['payment-analytics', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/analytics/payments/', {
                params: { business_id: activeBusiness?.id }
            });
            return res.data;
        },
        enabled: !!activeBusiness
    });

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!analytics) return <div>Məlumat yoxdur</div>;

    const { behavior, heatmap, methods, speed, customer_ratings } = analytics;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ödəniş Analitikası</h1>
                    <p className="text-slate-500 font-medium mt-1">Gəlir axınlarını və müştəri davranışlarını izləyin</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold">
                    <Calendar size={16} />
                    <span>Real-time Data</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <CheckCircle2 size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Vaxtında Ödəmə</h3>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{behavior.on_time_pct}%</div>
                    <p className="text-xs text-green-500 font-bold mt-2">Bütün ödənişlərin faizi</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <AlertCircle size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Gecikmə Faizi</h3>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{behavior.late_pct}%</div>
                    <p className="text-xs text-orange-500 font-bold mt-2">Orta gecikmə: {behavior.avg_overdue_days} gün</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ödəniş Sürəti</h3>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{speed[0]?.percentage}%</div>
                    <p className="text-xs text-purple-500 font-bold mt-2">İlk 7 gündə ödəyənlər</p>
                </div>
            </div>

            {/* Payment Heatmap */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-green-500" />
                    Ödəniş Sıxlığı (Heatmap)
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={heatmap} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                hide
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                                formatter={(value) => [`${value} ödəniş`, 'Sayı']}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#10B981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Methods Chart */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-blue-500" />
                        Ödəniş Metodları
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={methods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="amount"
                                >
                                    {methods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Speed Bar Chart */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-purple-500" />
                        Ödəniş Sürəti (Günlər)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={speed}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Customer Ratings Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Müştəri Reytinqi</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Top 10 Performans</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Müştəri</th>
                                <th className="px-8 py-4 text-center">Rekytinq</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Ortalama Gecikmə</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {customer_ratings.length === 0 ? (
                                <tr><td colSpan="4" className="p-12 text-center text-gray-400 italic">Məlumat yoxdur</td></tr>
                            ) : (
                                customer_ratings.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4 font-bold text-slate-900">{customer.name}</td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black mx-auto shadow-lg shadow-gray-200">
                                                {customer.rating}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${customer.color}`}>
                                                {customer.description}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right font-mono text-slate-600 font-medium">
                                            {customer.avg_delay > 0 ? `+${customer.avg_delay}` : customer.avg_delay} gün
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

export default PaymentAnalytics;
