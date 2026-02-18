import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import clientApi from '../api/client';
import { useBusiness } from '../context/BusinessContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Package, TrendingUp, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from './CountUp';

const TopProductsChart = () => {
    const { activeBusiness } = useBusiness();

    const { data: topProducts, isLoading } = useQuery({
        queryKey: ['top-products', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/top-products/');
            return res.data;
        },
        enabled: !!activeBusiness,
        refetchInterval: 30000, // Auto-refresh every 30 seconds
    });

    if (isLoading) return (
        <div
            className="h-[400px] flex items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)' }}
        >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                <TrendingUp size={28} style={{ opacity: 0.3 }} />
            </motion.div>
        </div>
    );

    if (!topProducts || topProducts.length === 0) return (
        <div
            className="h-[400px] flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed"
            style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)', color: 'var(--color-text-muted)' }}
        >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-badge-bg)' }}>
                <Package size={28} style={{ opacity: 0.4 }} />
            </div>
            <p className="font-bold uppercase tracking-widest text-xs">Məlumat yoxdur</p>
        </div>
    );

    const colors = [
        ['#3b82f6', '#60a5fa'],
        ['#8b5cf6', '#a78bfa'],
        ['#ec4899', '#f472b6'],
        ['#f59e0b', '#fbbf24'],
        ['#10b981', '#34d399'],
    ];

    // Django Decimal fields come as strings in JSON — parse them
    const parsed = (topProducts || []).map(p => ({
        ...p,
        total_quantity: Number(p.total_quantity) || 0,
        total_revenue: Number(p.total_revenue) || 0,
    }));

    const maxVal = Math.max(...parsed.map(p => p.total_quantity), 0) * 1.15 || 10;
    const chartData = parsed.map(p => ({ ...p, maxVal }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl flex flex-col overflow-hidden relative"
            style={{
                backgroundColor: 'var(--color-card-bg)',
                border: '1px solid var(--color-card-border)',
                height: '450px'
            }}
        >
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))' }}
                    >
                        <ShoppingBag size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                            Ən çox satılan mallar
                        </h3>
                        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            Satış sayına görə TOP {topProducts.length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full h-full relative" style={{ minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
                    >
                        <defs>
                            {colors.map((colorSet, i) => (
                                <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={colorSet[0]} />
                                    <stop offset="100%" stopColor={colorSet[1]} />
                                </linearGradient>
                            ))}
                        </defs>
                        <XAxis type="number" domain={[0, maxVal]} hide />
                        <YAxis
                            dataKey="product_name"
                            type="category"
                            width={120}
                            tick={(props) => {
                                const { x, y, payload } = props;
                                return (
                                    <g transform={`translate(${x},${y})`}>
                                        <text
                                            x={-10}
                                            y={0}
                                            dy={4}
                                            textAnchor="end"
                                            fill="var(--color-text-secondary)"
                                            fontSize={11}
                                            fontWeight={700}
                                        >
                                            {payload.value.length > 15 ? payload.value.substring(0, 15) + '...' : payload.value}
                                        </text>
                                    </g>
                                );
                            }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--color-hover-bg)', opacity: 0.5 }}
                            content={({ active, payload }) => {
                                if (active && payload?.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div
                                            className="p-4 rounded-xl shadow-xl backdrop-blur-md"
                                            style={{
                                                backgroundColor: 'var(--color-dropdown-bg)',
                                                border: '1px solid var(--color-dropdown-border)'
                                            }}
                                        >
                                            <p className="text-xs font-bold mb-2 pb-2" style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-card-border)' }}>
                                                {data.product_name}
                                            </p>
                                            <div className="flex items-center gap-5">
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Gəlir</p>
                                                    <p className="text-base font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                                                        <CountUp to={data.total_revenue} decimals={2} /> ₼
                                                    </p>
                                                </div>
                                                <div className="w-px h-8" style={{ backgroundColor: 'var(--color-card-border)' }} />
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>Miqdar</p>
                                                    <p className="text-base font-bold tracking-tight" style={{ color: 'var(--color-brand)' }}>
                                                        <CountUp to={data.total_quantity} decimals={0} /> ədəd
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Data Bar with built-in background */}
                        <Bar
                            dataKey="total_quantity"
                            background={{ fill: 'var(--color-badge-bg)', radius: [0, 6, 6, 0] }}
                            radius={[0, 6, 6, 0]}
                            barSize={18}
                            animationDuration={1200}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#grad-${index % colors.length})`} />
                            ))}
                            <LabelList
                                dataKey="total_quantity"
                                position="right"
                                content={(props) => {
                                    const { x, y, width, value } = props;
                                    return (
                                        <text
                                            x={x + width + 8}
                                            y={y + 13}
                                            fill="var(--color-text-primary)"
                                            fontSize={11}
                                            fontWeight={700}
                                        >
                                            <CountUp to={value} decimals={0} /> ədəd
                                        </text>
                                    );
                                }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-card-border)' }}>
                <Link to="/analytics/products" className="flex items-center gap-1.5 text-emerald-500 font-semibold text-xs hover:underline cursor-pointer">
                    <ArrowUpRight size={14} />
                    <span>Real vaxt hesabatı</span>
                </Link>
            </div>
        </motion.div>
    );
};

export default TopProductsChart;
