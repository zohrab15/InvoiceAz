import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, TrendingUp, Filter, Download, Search, ArrowUp, ArrowDown } from 'lucide-react';
import clientApi from '../api/client';
import { useBusiness } from '../context/BusinessContext';
import TopProductsChart from '../components/TopProductsChart';
import CountUp from '../components/CountUp';

const ProductAnalytics = () => {
    const { activeBusiness } = useBusiness();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'total_quantity', direction: 'desc' });

    // Fetch ALL products (or top 50/100 if you want to limit, for now using the same endpoint but we might want a fuller list)
    // The current endpoint returns top 10. For a full table we ideally need a new endpoint or pagination.
    // For MVP, we'll reuse the top-products endpoint but maybe we should ask backend for 'limit=100' or similar if supported.
    // The current backend implementation hardcodes [:10]. 
    // Let's use the same endpoint for now but we should acknowledge this limitation or update backend.
    // Actually, let's update the backend to support a limit param, 
    // BUT since I am in frontend mode right now, I will stick to what I have 
    // and maybe I'll update the backend in the next step to allow fetching ALL products.
    // For now, let's assume the endpoint returns what we need or I will update it.

    // WAIT: The user asked for "bütün satılan məhsulların siyahısı" (list of ALL sold products).
    // The current endpoint `/invoices/top-products/` only returns 10.
    // I should probably create a new endpoint or modify the existing one.
    // Let's modify the existing one to accept a query param like `?limit=all` or just `?limit=50`.

    const { data: products, isLoading } = useQuery({
        queryKey: ['product-analytics', activeBusiness?.id],
        queryFn: async () => {
            // I'll update backend to handle 'limit' param next.
            const res = await clientApi.get('/invoices/top-products/?limit=100');
            return res.data;
        },
        enabled: !!activeBusiness,
        refetchInterval: 30000,
    });

    const filteredData = useMemo(() => {
        if (!products) return [];
        let data = [...products];

        if (searchTerm) {
            data = data.filter(p =>
                p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig.key) {
            data.sort((a, b) => {
                const aValue = parseFloat(a[sortConfig.key]);
                const bValue = parseFloat(b[sortConfig.key]);
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [products, searchTerm, sortConfig]);

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-16"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        Məhsul Analitikası
                    </h1>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Ən çox satılan məhsullar və detallı satış hesabatı
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)' }}>
                        <Download size={16} />
                        Eksport
                    </button>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)' }}>
                        <Filter size={16} />
                        Filtr
                    </button>
                </div>
            </div>

            {/* Top Section: Chart */}
            <TopProductsChart />

            {/* Bottom Section: Detailed Table */}
            <div className="rounded-2xl overflow-hidden border border-[var(--color-card-border)] bg-[var(--color-card-bg)]">
                <div className="p-5 border-b border-[var(--color-card-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Package size={20} className="text-emerald-500" />
                        Məhsul Siyahısı
                    </h3>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Məhsul axtar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl text-sm font-medium outline-none transition-all w-full sm:w-64"
                            style={{
                                backgroundColor: 'var(--color-bg)',
                                border: '1px solid var(--color-card-border)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Məhsul Adı</th>
                                <th
                                    className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors text-right"
                                    style={{ color: 'var(--color-text-muted)' }}
                                    onClick={() => handleSort('total_quantity')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Satış Sayı
                                        {sortConfig.key === 'total_quantity' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                </th>
                                <th
                                    className="p-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] transition-colors text-right"
                                    style={{ color: 'var(--color-text-muted)' }}
                                    onClick={() => handleSort('total_revenue')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Ümumi Gəlir
                                        {sortConfig.key === 'total_revenue' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                </th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--color-text-muted)' }}>Ortalama Qiymət</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-card-border)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Yüklənir...</td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Məlumat tapılmadı</td>
                                </tr>
                            ) : (
                                filteredData.map((item, idx) => {
                                    const avgPrice = item.total_quantity > 0 ? item.total_revenue / item.total_quantity : 0;
                                    return (
                                        <tr key={idx} className="group hover:bg-[var(--color-hover-bg)] transition-colors">
                                            <td className="p-4 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                                {item.product_name}
                                            </td>
                                            <td className="p-4 text-right font-bold text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                                {item.total_quantity} ədəd
                                            </td>
                                            <td className="p-4 text-right font-bold text-sm text-emerald-500">
                                                <CountUp to={item.total_revenue} decimals={2} /> ₼
                                            </td>
                                            <td className="p-4 text-right font-medium text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                ~{avgPrice.toFixed(2)} ₼
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductAnalytics;
