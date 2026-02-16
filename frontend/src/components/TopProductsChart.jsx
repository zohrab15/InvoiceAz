import React from 'react';
import { useQuery } from '@tanstack/react-query';
import clientApi from '../api/client';
import { useBusiness } from '../context/BusinessContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Package, TrendingUp, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomBar = (props) => {
    const { fill, x, y, width, height } = props;
    // Create a pill-shaped bar with rounded right side
    const radius = 10;
    return (
        <g>
            <path
                d={`M${x},${y} h${width - radius} a${radius},${radius} 0 0 1 ${radius},${radius} v${height - 2 * radius} a${radius},${radius} 0 0 1 -${radius},${radius} h-${width - radius} Z`}
                fill={fill}
            />
        </g>
    );
};

const TopProductsChart = () => {
    const { activeBusiness } = useBusiness();

    const { data: topProducts, isLoading } = useQuery({
        queryKey: ['top-products', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/top-products/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    if (isLoading) return (
        <div className="h-[450px] flex items-center justify-center text-slate-400 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                <TrendingUp size={32} className="opacity-20" />
            </motion.div>
        </div>
    );

    if (!topProducts || topProducts.length === 0) return (
        <div className="h-[450px] flex flex-col items-center justify-center text-slate-300 gap-4 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Package size={32} opacity={0.3} />
            </div>
            <p className="font-black uppercase tracking-[0.2em] text-xs">Məlumat yoxdur</p>
        </div>
    );

    // Color palette for items
    const colors = [
        ['#3b82f6', '#60a5fa'], // Blue
        ['#8b5cf6', '#a78bfa'], // Violet
        ['#ec4899', '#f472b6'], // Pink
        ['#f59e0b', '#fbbf24'], // Amber
        ['#10b981', '#34d399'], // Emerald
    ];

    // Max value for the background track
    const maxVal = Math.max(...topProducts.map(p => p.total_quantity)) * 1.1;
    const chartData = topProducts.map(p => ({ ...p, maxVal }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 h-full flex flex-col overflow-hidden relative"
        >
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start mb-10 relative">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 rotate-3 transform transition-transform hover:rotate-0">
                        <ShoppingBag size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">En çox satılan mallar</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic mt-1">Satış sayına görə TOP 10</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cəmi Mallar</span>
                    <span className="text-2xl font-black text-slate-900 font-outfit">{topProducts.length} <span className="text-xs text-slate-400">çeşid</span></span>
                </div>
            </div>

            <div className="flex-1 min-h-[350px] relative">
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
                                            fill="#64748b"
                                            fontSize={11}
                                            fontWeight={800}
                                            className="font-outfit"
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
                            cursor={{ fill: 'rgba(241, 245, 249, 0.5)', radius: 10 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-slate-50 flex flex-col gap-2">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest underline decoration-blue-200 underline-offset-4">{data.product_name}</p>
                                            <div className="flex items-center gap-6 mt-1">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Gəlir</p>
                                                    <p className="text-lg font-black text-slate-900 tracking-tighter">{data.total_revenue.toLocaleString()} ₼</p>
                                                </div>
                                                <div className="w-px h-8 bg-slate-100" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Miqdar</p>
                                                    <p className="text-lg font-black text-blue-600 tracking-tighter">{data.total_quantity} <span className="text-[10px]">ədəd</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Background Track Bar */}
                        <Bar
                            dataKey="maxVal"
                            fill="#f8fafc"
                            radius={[0, 10, 10, 0]}
                            barSize={20}
                            isAnimationActive={false}
                        />

                        {/* Actual Data Bar */}
                        <Bar
                            dataKey="total_quantity"
                            radius={[0, 10, 10, 0]}
                            barSize={20}
                            animationDuration={1500}
                        >
                            {topProducts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#grad-${index % colors.length})`} />
                            ))}
                            <LabelList
                                dataKey="total_quantity"
                                position="right"
                                content={(props) => {
                                    const { x, y, width, value } = props;
                                    return (
                                        <text
                                            x={x + width + 10}
                                            y={y + 14}
                                            fill="#1e293b"
                                            fontSize={12}
                                            fontWeight={900}
                                            className="font-outfit tracking-tighter"
                                        >
                                            {value.toLocaleString()} ədəd
                                        </text>
                                    );
                                }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                    <ArrowUpRight size={16} />
                    <span>Real vaxt hesabatı</span>
                </div>
                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-4 decoration-blue-100 hover:decoration-blue-600">
                    Bütün detallara bax
                </button>
            </div>
        </motion.div>
    );
};

export default TopProductsChart;
