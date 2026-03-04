import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import clientApi from '../api/client';
import { ArrowLeftRight, ArrowUpCircle, ArrowDownCircle, RefreshCw, Search, X } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

const TYPE_COLORS = {
    'IN': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: <ArrowDownCircle size={16} /> },
    'OUT': { bg: 'bg-rose-500/10', text: 'text-rose-500', icon: <ArrowUpCircle size={16} /> },
    'ADJUSTMENT_PLUS': { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: <ArrowDownCircle size={16} /> },
    'ADJUSTMENT_MINUS': { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: <ArrowUpCircle size={16} /> },
    'RETURN': { bg: 'bg-violet-500/10', text: 'text-violet-500', icon: <RefreshCw size={14} /> },
    'TRANSFER': { bg: 'bg-cyan-500/10', text: 'text-cyan-500', icon: <ArrowLeftRight size={14} /> },
    'WRITE_OFF': { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: <ArrowUpCircle size={16} /> },
};

const StockMovements = () => {
    const { activeBusiness } = useBusiness();
    const [typeFilter, setTypeFilter] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [page, setPage] = useState(1);

    // Fetch all products for the dropdown/search
    const { data: allProducts } = useQuery({
        queryKey: ['all-products', activeBusiness?.id],
        queryFn: async () => { const res = await clientApi.get('/inventory/products/all/'); return res.data; },
        enabled: !!activeBusiness,
    });

    // Filtered product suggestions
    const filteredProducts = useMemo(() => {
        if (!productSearch || !allProducts) return [];
        const q = productSearch.toLowerCase();
        return allProducts.filter(p =>
            p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
        ).slice(0, 10);
    }, [productSearch, allProducts]);

    // Fetch movements with filters
    const { data, isLoading } = useQuery({
        queryKey: ['stock-movements', activeBusiness?.id, typeFilter, selectedProductId, page],
        queryFn: async () => {
            const params = new URLSearchParams({ page });
            if (typeFilter) params.set('movement_type', typeFilter);
            if (selectedProductId) params.set('product', selectedProductId);
            const res = await clientApi.get(`/inventory/stock-movements/?${params.toString()}`);
            return res.data;
        },
        enabled: !!activeBusiness,
        keepPreviousData: true,
    });

    const movements = data?.results || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / 50);

    const handleSelectProduct = (product) => {
        setSelectedProductId(product.id);
        setProductSearch(product.name);
        setShowProductDropdown(false);
        setPage(1);
    };

    const handleClearProduct = () => {
        setSelectedProductId('');
        setProductSearch('');
        setPage(1);
    };

    if (!activeBusiness) return <div className="p-8 text-center text-slate-500">Zəhmət olmasa biznes seçin.</div>;

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 min-h-screen pb-24">
            <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                    <div className="p-2.5 rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                        <ArrowLeftRight size={28} />
                    </div>
                    Stok Hərəkətləri
                </h1>
                <p className="mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Anbara giriş, çıxış və düzəlişlərin tam tarixçəsi.</p>
            </div>

            {/* Filters row */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Product search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Məhsul adı və ya SKU ilə axtar..."
                        className="w-full rounded-2xl p-4 pl-12 pr-10 outline-none transition-all font-medium"
                        style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                        value={productSearch}
                        onChange={e => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                            if (!e.target.value) { setSelectedProductId(''); setPage(1); }
                        }}
                        onFocus={() => { if (productSearch && !selectedProductId) setShowProductDropdown(true); }}
                    />
                    {selectedProductId && (
                        <button onClick={handleClearProduct} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <X size={16} style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                    )}
                    {/* Dropdown suggestions */}
                    {showProductDropdown && filteredProducts.length > 0 && !selectedProductId && (
                        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto"
                            style={{ backgroundColor: 'var(--color-dropdown-bg, var(--color-card-bg))', border: '1px solid var(--color-dropdown-border, var(--color-card-border))' }}>
                            {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => handleSelectProduct(p)}
                                    className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                                    style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                                    <div>
                                        <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</div>
                                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>SKU: {p.sku || '—'} · Stok: {p.stock_quantity}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Type filter chips */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl w-fit" style={{ backgroundColor: 'var(--color-hover-bg)', border: '1px solid var(--color-card-border)' }}>
                    {[
                        { id: '', label: 'Hamısı' },
                        { id: 'IN', label: 'Giriş' },
                        { id: 'OUT', label: 'Çıxış' },
                        { id: 'ADJUSTMENT_PLUS', label: 'Düzəliş (+)' },
                        { id: 'ADJUSTMENT_MINUS', label: 'Düzəliş (-)' },
                        { id: 'RETURN', label: 'Qaytarma' },
                    ].map(f => (
                        <button key={f.id} onClick={() => { setTypeFilter(f.id); setPage(1); }}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${typeFilter === f.id ? 'shadow-sm' : ''}`}
                            style={{ backgroundColor: typeFilter === f.id ? 'var(--color-card-bg)' : 'transparent', color: typeFilter === f.id ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active filter indicator */}
            {selectedProductId && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Filtr aktiv:</span>
                    <span className="text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-2" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                        {productSearch}
                        <button onClick={handleClearProduct}><X size={12} /></button>
                    </span>
                </div>
            )}

            {/* Table */}
            <div className="rounded-3xl overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-hover-bg)', borderBottom: '1px solid var(--color-card-border)' }}>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Tarix</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Məhsul</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Növ</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Miqdar</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Stok (Əvvəl → Sonra)</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Mənbə</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Qeyd</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--color-card-border)' }}>
                            {isLoading ? [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse"><td colSpan="7" className="p-8"><div className="h-4 rounded w-1/3" style={{ backgroundColor: 'var(--color-hover-bg)' }} /></td></tr>
                            )) : movements.length === 0 ? (
                                <tr><td colSpan="7" className="p-20 text-center">
                                    <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-bold text-lg" style={{ color: 'var(--color-text-muted)' }}>Hərəkət tapılmadı</p>
                                    {selectedProductId && <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Bu məhsul üçün heç bir stok hərəkəti yoxdur.</p>}
                                </td></tr>
                            ) : movements.map(m => {
                                const style = TYPE_COLORS[m.movement_type] || TYPE_COLORS['OUT'];
                                return (
                                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="p-5 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{new Date(m.created_at).toLocaleDateString('az-AZ')} <span className="text-xs opacity-60">{new Date(m.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span></td>
                                        <td className="p-5"><span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{m.product_name}</span>{m.product_sku && <span className="text-xs ml-2 font-mono opacity-50">{m.product_sku}</span>}</td>
                                        <td className="p-5"><span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${style.bg} ${style.text} flex items-center gap-1 w-fit`}>{style.icon}{m.movement_type_display}</span></td>
                                        <td className="p-5 font-black" style={{ color: 'var(--color-text-primary)' }}>{m.quantity}</td>
                                        <td className="p-5 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{m.stock_before} → <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{m.stock_after}</span></td>
                                        <td className="p-5"><span className="text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-text-secondary)' }}>{m.source_type_display}</span></td>
                                        <td className="p-5 text-xs max-w-[200px] truncate" style={{ color: 'var(--color-text-muted)' }}>{m.note || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-card-border)', backgroundColor: 'var(--color-hover-bg)' }}>
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>Toplam {totalCount} hərəkət</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)' }}>Əvvəlki</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)' }}>Növbəti</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockMovements;
