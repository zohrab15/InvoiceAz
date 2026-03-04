import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientApi from '../api/client';
import { ClipboardCheck, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../components/Toast';

const REASON_LABELS = {
    'COUNT': 'Fiziki sayım',
    'DAMAGE': 'Xarab olma',
    'LOSS': 'İtki / Oğurluq',
    'FOUND': 'Tapıntı',
    'EXPIRY': 'Müddəti bitib',
    'OTHER': 'Digər',
};

const InventoryAdjustments = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [page, setPage] = useState(1);

    const { data: products } = useQuery({
        queryKey: ['all-products', activeBusiness?.id],
        queryFn: async () => { const res = await clientApi.get('/inventory/products/all/'); return res.data; },
        enabled: !!activeBusiness,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['adjustments', activeBusiness?.id, page],
        queryFn: async () => {
            const res = await clientApi.get(`/inventory/adjustments/?page=${page}`);
            return res.data;
        },
        enabled: !!activeBusiness,
        keepPreviousData: true,
    });

    const createMutation = useMutation({
        mutationFn: (data) => clientApi.post('/inventory/adjustments/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adjustments']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['stock-movements']);
            showToast('İnventarizasiya düzəlişi qeydə alındı');
            setIsAddOpen(false);
            setSelectedProduct(null);
        },
        onError: (err) => showToast(err.response?.data?.detail || 'Xəta baş verdi', 'error'),
    });

    const adjustments = data?.results || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / 50);

    if (!activeBusiness) return <div className="p-8 text-center text-slate-500">Zəhmət olmasa biznes seçin.</div>;

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 min-h-screen pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2.5 rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <ClipboardCheck size={28} />
                        </div>
                        İnventarizasiya
                    </h1>
                    <p className="mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Fiziki sayım, xarab olma və itkini qeyd edin.</p>
                </div>
                <button onClick={() => setIsAddOpen(true)} className="text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <Plus size={18} /> Yeni Düzəliş
                </button>
            </div>

            {/* Adjustments Table */}
            <div className="rounded-3xl overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-hover-bg)', borderBottom: '1px solid var(--color-card-border)' }}>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Tarix</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Məhsul</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Köhnə Qalıq</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Yeni Qalıq</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Fərq</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Səbəb</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Qeyd</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--color-card-border)' }}>
                            {isLoading ? [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse"><td colSpan="7" className="p-8"><div className="h-4 rounded w-1/3" style={{ backgroundColor: 'var(--color-hover-bg)' }} /></td></tr>
                            )) : adjustments.length === 0 ? (
                                <tr><td colSpan="7" className="p-20 text-center">
                                    <ClipboardCheck size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-bold text-lg" style={{ color: 'var(--color-text-muted)' }}>Düzəliş tapılmadı</p>
                                </td></tr>
                            ) : adjustments.map(adj => {
                                const diff = adj.difference || (adj.new_quantity - adj.old_quantity);
                                return (
                                    <tr key={adj.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                                        <td className="p-5 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{new Date(adj.created_at).toLocaleDateString('az-AZ')}</td>
                                        <td className="p-5 font-bold" style={{ color: 'var(--color-text-primary)' }}>{adj.product_name}</td>
                                        <td className="p-5 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{adj.old_quantity}</td>
                                        <td className="p-5 font-bold" style={{ color: 'var(--color-text-primary)' }}>{adj.new_quantity}</td>
                                        <td className="p-5"><span className={`font-black ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{diff >= 0 ? '+' : ''}{diff}</span></td>
                                        <td className="p-5"><span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-text-secondary)' }}>{adj.reason_display || REASON_LABELS[adj.reason] || adj.reason}</span></td>
                                        <td className="p-5 text-xs max-w-[200px] truncate" style={{ color: 'var(--color-text-muted)' }}>{adj.note || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-card-border)', backgroundColor: 'var(--color-hover-bg)' }}>
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>Toplam {totalCount} düzəliş</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)' }}>Əvvəlki</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)' }}>Növbəti</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                                <h3 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>Yeni Düzəliş</h3>
                                <button onClick={() => { setIsAddOpen(false); setSelectedProduct(null); }}><X size={20} style={{ color: 'var(--color-text-muted)' }} /></button>
                            </div>
                            <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.target); createMutation.mutate({ product: parseInt(fd.get('product')), new_quantity: parseFloat(fd.get('new_quantity')), reason: fd.get('reason'), note: fd.get('note') }); }} className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Məhsul</label>
                                    <select name="product" required onChange={e => { const p = (products || []).find(x => x.id === parseInt(e.target.value)); setSelectedProduct(p); }} className="w-full rounded-xl p-4 outline-none font-bold" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}>
                                        <option value="">Seçin...</option>
                                        {(products || []).map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock_quantity})</option>)}
                                    </select>
                                </div>
                                {selectedProduct && (
                                    <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                                        <div className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>Hazırki stok: <span className="text-lg font-black" style={{ color: 'var(--color-text-primary)' }}>{selectedProduct.stock_quantity}</span></div>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Real Miqdar (sayımdan sonra)</label>
                                    <input name="new_quantity" type="number" step="0.01" required className="w-full rounded-xl p-4 outline-none font-bold" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Səbəb</label>
                                    <select name="reason" className="w-full rounded-xl p-4 outline-none font-bold" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}>
                                        {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Qeyd</label>
                                    <textarea name="note" rows="2" className="w-full rounded-xl p-4 outline-none font-medium" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} />
                                </div>
                                <button type="submit" disabled={createMutation.isPending} className="w-full py-4 rounded-xl font-black text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                    {createMutation.isPending ? 'Saxlanılır...' : 'Düzəlişi Qeyd Et'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventoryAdjustments;
