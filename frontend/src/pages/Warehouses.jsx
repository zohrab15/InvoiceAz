import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientApi from '../api/client';
import { Warehouse, Plus, Star, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../components/Toast';

const Warehouses = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);

    const { data: warehouses, isLoading } = useQuery({
        queryKey: ['warehouses', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/inventory/warehouses/');
            return res.data?.results || res.data || [];
        },
        enabled: !!activeBusiness,
    });

    const addMutation = useMutation({
        mutationFn: (data) => clientApi.post('/inventory/warehouses/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouses']);
            showToast('Anbar əlavə edildi');
            setIsAddOpen(false);
        },
        onError: () => showToast('Xəta baş verdi', 'error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, ...data }) => clientApi.patch(`/inventory/warehouses/${id}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouses']);
            showToast('Anbar yeniləndi');
            setEditingWarehouse(null);
        },
        onError: () => showToast('Xəta baş verdi', 'error'),
    });

    const setDefaultMutation = useMutation({
        mutationFn: (id) => clientApi.post(`/inventory/warehouses/${id}/set-default/`),
        onSuccess: () => { queryClient.invalidateQueries(['warehouses']); showToast('Əsas anbar dəyişdirildi'); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => clientApi.delete(`/inventory/warehouses/${id}/`),
        onSuccess: () => { queryClient.invalidateQueries(['warehouses']); showToast('Anbar silindi'); },
        onError: () => showToast('Xəta baş verdi', 'error'),
    });

    if (!activeBusiness) return <div className="p-8 text-center text-slate-500">Zəhmət olmasa biznes seçin.</div>;

    const handleCloseModal = () => {
        setIsAddOpen(false);
        setEditingWarehouse(null);
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 min-h-screen pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2.5 rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                            <Warehouse size={28} />
                        </div>
                        Anbarlar
                    </h1>
                    <p className="mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Mallarınızın saxlandığı məkanları idarə edin.</p>
                </div>
                <button onClick={() => setIsAddOpen(true)} className="text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                    <Plus size={18} /> Yeni Anbar
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? [1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse p-6 rounded-3xl h-40" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }} />
                )) : (warehouses || []).length === 0 ? (
                    <div className="col-span-full p-20 text-center rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                        <Warehouse size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-lg" style={{ color: 'var(--color-text-muted)' }}>Hələ heç bir anbar əlavə edilməyib</p>
                    </div>
                ) : (warehouses || []).map(wh => (
                    <motion.div key={wh.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl relative group" style={{ backgroundColor: 'var(--color-card-bg)', border: `2px solid ${wh.is_default ? '#8b5cf6' : 'var(--color-card-border)'}` }}>
                        {wh.is_default && <span className="absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-1 rounded-full bg-violet-500/10 text-violet-500">Əsas</span>}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                                <Warehouse size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg" style={{ color: 'var(--color-text-primary)' }}>{wh.name}</h3>
                                {wh.address && <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}><MapPin size={12} />{wh.address}</p>}
                            </div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{wh.product_count || 0} məhsul</div>
                        <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingWarehouse(wh)} className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-secondary)' }}>Düzəliş et</button>
                            {!wh.is_default && <button onClick={() => setDefaultMutation.mutate(wh.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-secondary)' }}><Star size={12} />Əsas et</button>}
                            {!wh.is_default && <button onClick={() => { if (window.confirm('Bu anbarı silmək istəyirsiniz?')) deleteMutation.mutate(wh.id); }} className="text-xs font-bold px-3 py-1.5 rounded-lg text-rose-500" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>Sil</button>}
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {(isAddOpen || editingWarehouse) && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                                <h3 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>{editingWarehouse ? 'Anbarı Düzəlt' : 'Yeni Anbar'}</h3>
                                <button onClick={handleCloseModal}><X size={20} style={{ color: 'var(--color-text-muted)' }} /></button>
                            </div>
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    const fd = new FormData(e.target);
                                    const data = { name: fd.get('name'), address: fd.get('address') };
                                    if (editingWarehouse) {
                                        updateMutation.mutate({ id: editingWarehouse.id, ...data });
                                    } else {
                                        addMutation.mutate(data);
                                    }
                                }}
                                className="p-6 space-y-4"
                            >
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Anbar Adı</label>
                                    <input name="name" defaultValue={editingWarehouse?.name || ''} required className="w-full rounded-xl p-4 outline-none font-bold" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} placeholder="Əsas Anbar" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Ünvan (ixtiyari)</label>
                                    <input name="address" defaultValue={editingWarehouse?.address || ''} className="w-full rounded-xl p-4 outline-none font-bold" style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }} placeholder="Bakı, Nəsimi r." />
                                </div>
                                <button type="submit" disabled={addMutation.isPending || updateMutation.isPending} className="w-full py-4 rounded-xl font-black text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                                    {addMutation.isPending || updateMutation.isPending ? 'Saxlanılır...' : (editingWarehouse ? 'Yadda Saxla' : 'Əlavə Et')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Warehouses;
