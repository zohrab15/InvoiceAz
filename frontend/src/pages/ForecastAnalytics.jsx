import React from 'react';
import { useQuery } from '@tanstack/react-query';
import clientApi from '../api/client';
import { useBusiness } from '../context/BusinessContext';
import { motion as Motion } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Sparkles, DollarSign,
    Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight,
    Users, Activity, Zap, Lock
} from 'lucide-react';
import UpgradeModal from '../components/UpgradeModal';
import usePlanLimits from '../hooks/usePlanLimits';
import { CURRENCY_SYMBOLS } from '../utils/currency';

const ForecastAnalytics = () => {
    const { activeBusiness } = useBusiness();
    const currencySymbol = CURRENCY_SYMBOLS[activeBusiness?.default_currency] || '₼';
    const { isFeatureLocked } = usePlanLimits();
    const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
    const isLocked = isFeatureLocked('forecast_analytics');

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['forecast-analytics', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/analytics/forecast/', {
                params: { business_id: activeBusiness?.id }
            });
            return res.data;
        },
        enabled: !!activeBusiness && !isLocked
    });

    if (isLoading && !isLocked) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (isLocked) return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6 p-8 overflow-hidden rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
            <div className="absolute inset-0 bg-grid-slate-50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
            <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3"
            >
                <Lock className="text-white" size={48} />
            </Motion.div>
            <div className="relative z-10 max-w-lg space-y-4">
                <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Premium Analitika</h2>
                <p className="font-medium text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Süni intellekt dəstəkli proqnozlar və trend analizləri yalnız <span className="text-blue-600 font-bold">Pro</span> ve <span className="text-purple-600 font-bold">Premium</span> paketlərdə mövcuddur.
                </p>
                <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-slate-500/20"
                >
                    Paketi Yüksəlt
                </button>
            </div>

            {/* Blurred background elements to simulate content */}
            <div className="absolute inset-0 z-0 opacity-10 blur-xl pointer-events-none select-none overflow-hidden">
                <div className="absolute top-20 left-10 w-64 h-32 bg-blue-500 rounded-full"></div>
                <div className="absolute bottom-20 right-10 w-96 h-64 bg-purple-500 rounded-full"></div>
            </div>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                resourceName="AI Analitika"
                limit={0} // Always 0/unlimited semantic, just identifying the resource
            />
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
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                        <Sparkles className="text-blue-500" size={32} />
                        Trend və Proqnoz
                    </h1>
                    <p className="font-medium mt-1" style={{ color: 'var(--color-text-secondary)' }}>Süni intellekt əsaslı gələcək proqnozlar və inkişaf trendləri</p>
                </div>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>MoM Artım</h3>
                        <div className={`p-2 rounded-lg ${growth.mom >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {growth.mom >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{Math.abs(growth.mom)}%</span>
                        <span className={`text-xs font-bold ${growth.mom >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {growth.mom >= 0 ? 'Artım' : 'Azalma'}
                        </span>
                    </div>
                    <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Ötən aya nisbətən</p>
                </div>

                <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>YoY Artım</h3>
                        <div className={`p-2 rounded-lg ${growth.yoy >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                            {growth.yoy >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{Math.abs(growth.yoy)}%</span>
                        <span className={`text-xs font-bold ${growth.yoy >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {growth.yoy >= 0 ? 'Artım' : 'Azalma'}
                        </span>
                    </div>
                    <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Ötən ilin eyni ayına nisbətən</p>
                </div>

                <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Confidence Index</h3>
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Zap size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>82%</span>
                        <span className="text-xs font-bold text-purple-500">Yüksək</span>
                    </div>
                    <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Data həcminə görə etibarlılıq</p>
                </div>
            </div>

            {/* Revenue Scenario Forecast */}
            <div className="p-8 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <DollarSign size={24} className="text-green-500" />
                        Gəlir Proqnozu (3 ay)
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Tarixi
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                            <div className="w-3 h-3 bg-blue-300 rounded-full"></div> Proqnoz
                        </div>
                    </div>
                </div>
                <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-card-border)" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} tickFormatter={(value) => `${value}${currencySymbol}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--color-dropdown-bg)', borderRadius: '16px', border: '1px solid var(--color-dropdown-border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)' }} />

                            {/* Worst Case */}
                            <Area type="monotone" dataKey="worst" stroke="#EF4444" strokeDasharray="5 5" fill="transparent" name="Ən Pis Ssenari" />

                            {/* Realistic Case */}
                            <Area type="monotone" dataKey="realistic" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorHistorical)" name="Realist" />

                            {/* Best Case */}
                            <Area type="monotone" dataKey="best" stroke="#10B981" strokeDasharray="5 5" fill="transparent" name="Ən Yaxşı Ssenari" />

                            {/* Historical (Solid line overlay) */}
                            <Area type="monotone" dataKey="historical" stroke="#1E293B" strokeWidth={4} fill="transparent" name="Keçmiş Məlumatlar" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cashflow Forecast */}
                <div className="p-8 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Activity size={24} className="text-purple-500" />
                        Pul Axını Proqnozu
                    </h3>
                    <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                            <BarChart data={cashflow}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-card-border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                                <Tooltip cursor={{ fill: 'var(--color-hover-bg)', opacity: 0.4 }} contentStyle={{ backgroundColor: 'var(--color-dropdown-bg)', borderRadius: '12px', border: '1px solid var(--color-dropdown-border)' }} />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)' }} />
                                <Bar dataKey="inflow" fill="#3B82F6" name="Gözlənilən Giriş" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="outflow" fill="#EF4444" name="Gözlənilən Çıxış" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="net" fill="#10B981" name="Net Pul Axını" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk Radar */}
                <div
                    className="p-8 rounded-3xl shadow-xl border space-y-4"
                    style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)', color: 'var(--color-text-primary)' }}
                >
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                        <AlertTriangle size={24} className="text-orange-400" />
                        Risk Analizi (Churn)
                    </h3>
                    <div className="space-y-4">
                        {risks.churn_list.length === 0 ? (
                            <div className="p-4 rounded-2xl border text-center italic" style={{ backgroundColor: 'var(--color-badge-bg)', borderColor: 'var(--color-card-border)', color: 'var(--color-text-muted)' }}>
                                Hazırda yüksək riskli müştəri yoxdur ✅
                            </div>
                        ) : (
                            risks.churn_list.map((client) => (
                                <div key={client.id} className="p-4 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: 'var(--color-badge-bg)', borderColor: 'var(--color-card-border)' }}>
                                    <div>
                                        <h4 className="font-bold">{client.name}</h4>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Son fəaliyyət: {client.last_seen}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-orange-400">{client.days_inactive} gün</div>
                                        <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>İnaktivlik</div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="mt-6 p-4 rounded-2xl border text-xs leading-relaxed" style={{ backgroundColor: 'var(--color-brand-light)', borderColor: 'var(--color-brand-shadow)', color: 'var(--color-brand)' }}>
                            💡 **Məsləhət:** İnaktivlik müddəti 90 günü keçən müştərilərə endirim təklifi və ya "Sizi özlədik" kampaniyası ilə müraciət edin.
                        </div>
                    </div>
                </div>
            </div>
        </Motion.div>
    );
};

export default ForecastAnalytics;
