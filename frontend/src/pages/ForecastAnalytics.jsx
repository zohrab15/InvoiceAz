import React from 'react';
import { useQuery } from '@tanstack/react-query';
import clientApi from '../api/client';
import { useBusiness } from '../context/BusinessContext';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Sparkles, DollarSign,
    Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight,
    Users, Activity, Zap
} from 'lucide-react';

const ForecastAnalytics = () => {
    const { activeBusiness } = useBusiness();

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['forecast-analytics', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/analytics/forecast/', {
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

    const { growth, revenue_chart, cashflow, risks } = analytics;

    // Format data for Scenario Chart
    // Recharts works best with flat objects. We need to merge historical and forecast data.
    const chartData = revenue_chart.map(item => ({
        ...item,
        historical: item.is_projected ? null : item.revenue,
        realistic: item.is_projected ? item.realistic : item.revenue,
        best: item.is_projected ? item.best : null,
        worst: item.is_projected ? item.worst : null,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Sparkles className="text-blue-500" size={32} />
                        Trend və Proqnoz
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Süni intellekt əsaslı gələcək proqnozlar və inkişaf trendləri</p>
                </div>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">MoM Artım</h3>
                        <div className={`p-2 rounded-lg ${growth.mom >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {growth.mom >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{Math.abs(growth.mom)}%</span>
                        <span className={`text-xs font-bold ${growth.mom >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {growth.mom >= 0 ? 'Artım' : 'Azalma'}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Ötən aya nisbətən</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">YoY Artım</h3>
                        <div className={`p-2 rounded-lg ${growth.yoy >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                            {growth.yoy >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{Math.abs(growth.yoy)}%</span>
                        <span className={`text-xs font-bold ${growth.yoy >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {growth.yoy >= 0 ? 'Artım' : 'Azalma'}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Ötən ilin eyni ayına nisbətən</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Confidence Index</h3>
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Zap size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">82%</span>
                        <span className="text-xs font-bold text-purple-500">Yüksək</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Data həcminə görə etibarlılıq</p>
                </div>
            </div>

            {/* Revenue Scenario Forecast */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <DollarSign size={24} className="text-green-500" />
                        Gəlir Proqnozu (3 ay)
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Tarixi
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <div className="w-3 h-3 bg-blue-300 rounded-full"></div> Proqnoz
                        </div>
                    </div>
                </div>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value}₼`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Legend verticalAlign="top" height={36} />

                            {/* Worst Case */}
                            <Area type="monotone" dataKey="worst" stroke="#EF4444" strokeDasharray="5 5" fill="transparent" name="Worst Case" />

                            {/* Realistic Case */}
                            <Area type="monotone" dataKey="realistic" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorHistorical)" name="Realistic" />

                            {/* Best Case */}
                            <Area type="monotone" dataKey="best" stroke="#10B981" strokeDasharray="5 5" fill="transparent" name="Best Case" />

                            {/* Historical (Solid line overlay) */}
                            <Area type="monotone" dataKey="historical" stroke="#1E293B" strokeWidth={4} fill="transparent" name="Tarixi Məlumat" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cashflow Forecast */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Activity size={24} className="text-purple-500" />
                        Cashflow Proqnozu
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashflow}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend />
                                <Bar dataKey="inflow" fill="#3B82F6" name="Gözlənilən Giriş" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="outflow" fill="#EF4444" name="Gözlənilən Çıxış" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="net" fill="#10B981" name="Net Cashflow" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk Radar */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                        <AlertTriangle size={24} className="text-orange-400" />
                        Risk Analizi (Churn)
                    </h3>
                    <div className="space-y-4">
                        {risks.churn_list.length === 0 ? (
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center italic text-gray-400">
                                Hazırda yüksək riskli müştəri yoxdur ✅
                            </div>
                        ) : (
                            risks.churn_list.map((client) => (
                                <div key={client.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold">{client.name}</h4>
                                        <p className="text-xs text-gray-400 mt-1">Son fəaliyyət: {client.last_seen}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-orange-400">{client.days_inactive} gün</div>
                                        <div className="text-[10px] uppercase font-bold text-gray-500">İnaktivlik</div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="mt-6 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-xs text-blue-200 leading-relaxed">
                            💡 **Məsləhət:** İnaktivlik müddəti 90 günü keçən müştərilərə endirim təklifi və ya "Sizi özlədik" kampaniyası ilə müraciət edin.
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ForecastAnalytics;
