import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientApi from '../api/client';
import { ShoppingCart, Plus, X, Check, Clock, Package, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import { CURRENCY_SYMBOLS } from '../utils/currency';

const STATUS_STYLES = {
    'DRAFT': { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Qaralama' },
    'ORDERED': { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Sifariş' },
    'RECEIVED': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Qəbul' },
    'PARTIAL': { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Qismən' },
    'CANCELLED': { bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'Ləğv' },
};

const PurchaseOrders = () => {
    const { activeBusiness } = useBusiness();
    const currencySymbol = CURRENCY_SYMBOLS[activeBusiness?.default_currency] || '₼';
    const queryClient = useQueryClient();
    const showToast = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [items, setItems] = useState([{ product: '', quantity_ordered: 1, unit_cost: 0 }]);
    const [page, setPage] = useState(1);
    const [currentStatus, setCurrentStatus] = useState('ORDERED');
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [receivingOrder, setReceivingOrder] = useState(null);
    const [receivingItems, setReceivingItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: products } = useQuery({
        // ... (existing code for products fetch)
        queryKey: ['all-products', activeBusiness?.id],
        queryFn: async () => { const res = await clientApi.get('/inventory/products/all/'); return res.data; },
        enabled: !!activeBusiness,
    });

    const { data: warehouses } = useQuery({
        // ... (existing code for warehouses fetch)
        queryKey: ['warehouses', activeBusiness?.id],
        queryFn: async () => { const res = await clientApi.get('/inventory/warehouses/all/'); return res.data; },
        enabled: !!activeBusiness,
    });

    const warehouseList = Array.isArray(warehouses) ? warehouses : (warehouses?.results || []);

    const { data, isLoading } = useQuery({
        // ... (existing code for POs fetch)
        queryKey: ['purchase-orders', activeBusiness?.id, statusFilter, page, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({ page });
            if (statusFilter) params.set('status', statusFilter);
            if (searchTerm) params.set('search', searchTerm);
            const res = await clientApi.get(`/inventory/purchase-orders/?${params.toString()}`);
            return res.data;
        },
        enabled: !!activeBusiness,
        keepPreviousData: true,
    });

    const createMutation = useMutation({
        mutationFn: (data) => clientApi.post('/inventory/purchase-orders/', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['purchase-orders']);
            const isDraft = res.data?.status === 'DRAFT';
            showToast(isDraft ? 'Qaralama saxlanıldı' : 'Alış sifarişi yaradıldı');
            setIsAddOpen(false);
            setItems([{ product: '', quantity_ordered: 1, unit_cost: 0 }]);
        },
        onError: (err) => showToast(err.response?.data?.detail || 'Xəta baş verdi', 'error'),
    });

    const receiveMutation = useMutation({
        mutationFn: ({ id, items }) => clientApi.post(`/inventory/purchase-orders/${id}/receive/`, { items }),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchase-orders']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['stock-movements']);
            showToast('Mal qəbulu uğurla qeydə alındı!');
            setIsReceiveOpen(false);
        },
        onError: () => showToast('Qəbul zamanı xəta', 'error'),
    });

    const orders = data?.results || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / 50);

    const handleCreate = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const whId = warehouseList.length === 1 ? warehouseList[0].id : fd.get('warehouse');

        if (!whId && warehouseList.length > 0) {
            showToast('Zəhmət olmasa anbar seçin', 'error');
            return;
        }

        createMutation.mutate({
            supplier_name: fd.get('supplier_name'),
            supplier_contact: fd.get('supplier_contact'),
            order_date: fd.get('order_date'),
            expected_date: fd.get('expected_date') || null,
            warehouse: whId,
            note: fd.get('note'),
            status: currentStatus,
            items: items.filter(i => i.product).map(i => ({ product: parseInt(i.product), quantity_ordered: parseFloat(i.quantity_ordered), unit_cost: parseFloat(i.unit_cost) })),
        });
    };

    const handleReceiveInit = (po) => {
        const itemsToReceive = po.items
            .filter(i => i.quantity_received < i.quantity_ordered)
            .map(i => ({
                id: i.id,
                product_name: i.product_name,
                remaining: parseFloat(i.quantity_ordered) - parseFloat(i.quantity_received),
                quantity_received: parseFloat(i.quantity_ordered) - parseFloat(i.quantity_received),
            }));

        if (itemsToReceive.length === 0) {
            showToast('Bütün mallar artıq qəbul edilib', 'warning');
            return;
        }

        setReceivingOrder(po);
        setReceivingItems(itemsToReceive);
        setIsReceiveOpen(true);
    };

    const handleReceiveSubmit = (e) => {
        e.preventDefault();
        const payload = receivingItems.map(i => ({
            id: i.id,
            quantity_received: parseFloat(i.quantity_received) || 0,
        })).filter(i => i.quantity_received > 0);

        if (payload.length === 0) {
            showToast('Qəbul miqdarı daxil edin', 'error');
            return;
        }

        receiveMutation.mutate({ id: receivingOrder.id, items: payload });
    };

    if (!activeBusiness) return <div className="p-8 text-center text-slate-500">Zəhmət olmasa biznes seçin.</div>;

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 min-h-screen pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2.5 rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                            <ShoppingCart size={28} />
                        </div>
                        Alış Sifarişləri
                    </h1>
                    <p className="mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Təchizatçılardan mal sifarişi verin və qəbul edin.</p>
                </div>
                <button onClick={() => { setIsAddOpen(true); setCurrentStatus('ORDERED'); }} className="text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                    <Plus size={18} /> Yeni Sifariş
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl w-fit" style={{ backgroundColor: 'var(--color-hover-bg)', border: '1px solid var(--color-card-border)' }}>
                    {[{ id: '', label: 'Hamısı' }, { id: 'DRAFT', label: 'Qaralama' }, { id: 'ORDERED', label: 'Sifariş' }, { id: 'RECEIVED', label: 'Qəbul' }, { id: 'PARTIAL', label: 'Qismən' }].map(f => (
                        <button key={f.id} onClick={() => { setStatusFilter(f.id); setPage(1); }}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all`}
                            style={{ backgroundColor: statusFilter === f.id ? 'var(--color-card-bg)' : 'transparent', color: statusFilter === f.id ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        placeholder="Təchizatçı və ya qeyd üzrə axtar..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl outline-none font-bold text-sm transition-all"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)' }}
                    />
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {isLoading ? [1, 2].map(i => <div key={i} className="animate-pulse p-6 rounded-3xl h-32" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }} />) :
                    orders.length === 0 ? (
                        <div className="p-20 text-center rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-lg" style={{ color: 'var(--color-text-muted)' }}>Alış sifarişi tapılmadı</p>
                        </div>
                    ) : orders.map(po => {
                        const st = STATUS_STYLES[po.status] || STATUS_STYLES['DRAFT'];
                        return (
                            <motion.div key={po.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-black text-lg" style={{ color: 'var(--color-text-primary)' }}>{po.supplier_name}</h3>
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${st.bg} ${st.text}`}>{st.label}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                            <span className="font-bold text-blue-600">PO-{po.id}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} />{po.order_date}</span>
                                            {po.items && <span>{po.items.length} məhsul</span>}
                                            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{po.total_amount} {currencySymbol}</span>
                                            {po.warehouse_name && <span className="flex items-center gap-1 opacity-70"><Package size={12} />{po.warehouse_name}</span>}
                                        </div>
                                    </div>
                                    {(po.status === 'ORDERED' || po.status === 'PARTIAL') && (
                                        <button onClick={() => handleReceiveInit(po)} disabled={receiveMutation.isPending}
                                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2"
                                            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                                            <Check size={16} /> Qəbul Et
                                        </button>
                                    )}
                                </div>
                                {po.note && <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{po.note}</p>}
                            </motion.div>
                        );
                    })}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)' }}>Əvvəlki</button>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-30" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)' }}>Növbəti</button>
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-4 md:my-auto" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                                <h3 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>Yeni Alış Sifarişi</h3>
                                <button onClick={() => setIsAddOpen(false)}><X size={20} style={{ color: 'var(--color-text-muted)' }} /></button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Təchizatçı</label>
                                        <input name="supplier_name" required className="w-full rounded-xl p-3 outline-none font-bold placeholder:font-medium placeholder:opacity-50" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} placeholder="Təchizatçı adını yazın" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Əlaqə</label>
                                        <input name="supplier_contact" className="w-full rounded-xl p-3 outline-none font-bold" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Sifariş Tarixi</label>
                                        <input name="order_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-xl p-3 outline-none font-bold" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Gözlənilən Tarix</label>
                                        <input name="expected_date" type="date" className="w-full rounded-xl p-3 outline-none font-bold" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} />
                                    </div>

                                    {warehouseList.length > 1 && (
                                        <div className="col-span-2">
                                            <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Anbarı Seçin</label>
                                            <select
                                                name="warehouse"
                                                required
                                                className="w-full rounded-xl p-3 outline-none font-bold cursor-pointer"
                                                style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                            >
                                                <option value="">Malların gələcəyi hədəf anbarı seçin...</option>
                                                {warehouseList.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name} {w.is_default ? '(Əsas)' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Qeyd</label>
                                    <textarea name="note" rows="2" className="w-full rounded-xl p-3 outline-none font-medium text-sm" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Məhsullar</label>
                                        <button type="button" onClick={() => setItems([...items, { product: '', quantity_ordered: 1, unit_cost: 0 }])} className="text-xs font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>+ Sətir</button>
                                    </div>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-12 sm:col-span-5">
                                                <select value={item.product} onChange={e => { const n = [...items]; n[idx].product = e.target.value; setItems(n); }} className="w-full rounded-xl p-3 outline-none font-bold text-sm" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}>
                                                    <option value="">Məhsul seçin</option>
                                                    {(products || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-5 sm:col-span-3">
                                                <input type="number" step="0.01" placeholder="Miqdar" value={item.quantity_ordered} onChange={e => { const n = [...items]; n[idx].quantity_ordered = e.target.value; setItems(n); }} className="w-full rounded-xl p-3 outline-none font-bold text-sm" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} />
                                            </div>
                                            <div className="col-span-5 sm:col-span-3">
                                                <input type="number" step="0.01" placeholder="Qiymət" value={item.unit_cost} onChange={e => { const n = [...items]; n[idx].unit_cost = e.target.value; setItems(n); }} className="w-full rounded-xl p-3 outline-none font-bold text-sm" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-rose-500"><X size={16} /></button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button type="submit" onClick={() => setCurrentStatus('DRAFT')} disabled={createMutation.isPending}
                                        className="py-4 rounded-xl font-black" style={{ backgroundColor: 'var(--color-hover-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)' }}>
                                        Qaralama kimi saxla
                                    </button>
                                    <button type="submit" onClick={() => setCurrentStatus('ORDERED')} disabled={createMutation.isPending}
                                        className="py-4 rounded-xl font-black text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                                        {createMutation.isPending ? 'Gözləyin...' : 'Sifarişi Göndər'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Receive Modal (Partial supported) */}
            <AnimatePresence>
                {isReceiveOpen && receivingOrder && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                                <div>
                                    <h3 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>Mal Qəbulu</h3>
                                    <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>PO-{receivingOrder.id} | {receivingOrder.supplier_name}</p>
                                </div>
                                <button onClick={() => setIsReceiveOpen(false)}><X size={20} style={{ color: 'var(--color-text-muted)' }} /></button>
                            </div>
                            <form onSubmit={handleReceiveSubmit} className="p-6 space-y-4">
                                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    Zəhmət olmasa daxil olan faktiki miqdarları qeyd edin. Əgər miqdar sifariş ediləndən azdırsa, status "Qismən" olaraq qalacaq.
                                </p>

                                <div className="space-y-3">
                                    {receivingItems.map((item, idx) => (
                                        <div key={item.id} className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-hover-bg)', border: '1px solid var(--color-card-border)' }}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.product_name}</span>
                                                <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Qalıq: {item.remaining}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="text-[10px] font-black uppercase" style={{ color: 'var(--color-text-muted)' }}>Gələn Miqdar:</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    max={item.remaining}
                                                    value={item.quantity_received}
                                                    onChange={e => {
                                                        const newItems = [...receivingItems];
                                                        newItems[idx].quantity_received = e.target.value;
                                                        setReceivingItems(newItems);
                                                    }}
                                                    className="flex-1 rounded-xl p-2 outline-none font-black text-right"
                                                    style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-brand)' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button type="submit" disabled={receiveMutation.isPending}
                                    className="w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                                    {receiveMutation.isPending ? 'İşlənilir...' : <><Check size={20} /> Qəbulu Təsdiqlə</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PurchaseOrders;
