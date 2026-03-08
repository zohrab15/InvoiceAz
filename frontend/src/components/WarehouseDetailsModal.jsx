import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientApi from '../api/client';
import { X, Package, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../components/Toast';

const WarehouseDetailsModal = ({ warehouse, onClose, allWarehouses }) => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const [transferringProduct, setTransferringProduct] = useState(null);
    const [targetWarehouseId, setTargetWarehouseId] = useState('');
    const [transferQuantity, setTransferQuantity] = useState('');

    const { data: products, isLoading } = useQuery({
        queryKey: ['warehouse-products', activeBusiness?.id, warehouse?.id],
        queryFn: async () => {
            if (!warehouse?.id) return [];
            // Use existing products endpoint with warehouse filter
            const res = await clientApi.get(`/inventory/products/?warehouse=${warehouse.id}&page_size=1000`);
            return res.data?.results || res.data || [];
        },
        enabled: !!activeBusiness && !!warehouse?.id,
    });

    const transferMutation = useMutation({
        mutationFn: (data) => clientApi.post(`/inventory/products/${data.productId}/transfer/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouse-products']);
            queryClient.invalidateQueries(['products']);
            queryClient.invalidateQueries(['warehouses']);
            queryClient.invalidateQueries(['products-stats']);
            showToast('Transfer uğurla tamamlandı');
            setTransferringProduct(null);
            setTargetWarehouseId('');
            setTransferQuantity('');
        },
        onError: (err) => {
            const detail = err.response?.data?.detail || 'Transfer xətası baş verdi';
            showToast(detail, 'error');
        }
    });

    const handleTransfer = (e) => {
        e.preventDefault();
        if (!transferringProduct || !targetWarehouseId || !transferQuantity) return;

        transferMutation.mutate({
            productId: transferringProduct.id,
            target_warehouse_id: targetWarehouseId,
            quantity: transferQuantity
        });
    };

    const unitMap = {
        'pcs': 'ədəd', 'kg': 'kq', 'gr': 'qram', 'l': 'litr', 'm': 'metr',
        'm2': 'm²', 'm3': 'm³', 'box': 'qutu', 'koli': 'koli', 'pack': 'paçka',
        'block': 'blok', 'set': 'dəst', 'roll': 'rulo', 'service': 'xidmət'
    };

    const otherWarehouses = allWarehouses.filter(w => w.id !== warehouse.id);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Package size={24} style={{ color: 'var(--color-brand)' }} />
                            {warehouse.name} məhsulları
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Bu anbardakı bütün məhsullar və qalıqlar</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" style={{ color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (products || []).length === 0 ? (
                        <div className="p-12 text-center">
                            <Package size={48} className="mx-auto mb-4 opacity-20 text-slate-500" />
                            <p className="font-bold text-lg" style={{ color: 'var(--color-text-muted)' }}>Bu anbarda hələlik məhsul yoxdur</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--color-card-border)' }}>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--color-hover-bg)', borderBottom: '1px solid var(--color-card-border)' }}>
                                        <th className="p-4 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Məhsul</th>
                                        <th className="p-4 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>SKU</th>
                                        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Anbar (Stok)</th>
                                        <th className="p-4 text-[10px] uppercase font-black tracking-widest text-center" style={{ color: 'var(--color-text-muted)' }}>Əməliyyat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--color-card-border)' }}>
                                    {(products || []).map((product) => {
                                        const stock = Number(product.stock_quantity || 0);
                                        const min = Number(product.min_stock_level || 0);
                                        const unitText = unitMap[(product.unit || '').toLowerCase().trim()] || product.unit;

                                        return (
                                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold capitalize" style={{ color: 'var(--color-text-primary)' }}>{product.name}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-text-secondary)' }}>
                                                        {product.sku || '---'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="font-bold flex items-center gap-1" style={{ color: stock <= min ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                                                            {product.stock_quantity} <span className="text-[10px] uppercase opacity-60 ml-0.5">{unitText}</span>
                                                            {stock <= min && <AlertCircle size={12} className="text-rose-500 animate-pulse ml-1" />}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {stock > 0 && otherWarehouses.length > 0 ? (
                                                        <button
                                                            onClick={() => setTransferringProduct(product)}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 w-full mx-auto"
                                                            style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-brand)' }}
                                                        >
                                                            <ArrowRightLeft size={12} /> Transfer
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Mümkün deyil</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Transfer Internal Modal/Overlay */}
                <AnimatePresence>
                    {transferringProduct && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="absolute bottom-0 left-0 right-0 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl z-10"
                            style={{ backgroundColor: 'var(--color-card-bg)', borderTop: '1px solid var(--color-card-border)' }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-black text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                        Məhsul Transferi
                                    </h4>
                                    <p className="text-sm font-bold" style={{ color: 'var(--color-brand)' }}>{transferringProduct.name}  <span className="text-slate-500 text-xs">Mövcud: {transferringProduct.stock_quantity} {unitMap[(transferringProduct.unit || '').toLowerCase().trim()] || transferringProduct.unit}</span></p>
                                </div>
                                <button onClick={() => setTransferringProduct(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleTransfer} className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-1" style={{ color: 'var(--color-text-muted)' }}>Hədəf Anbar</label>
                                    <select
                                        required
                                        value={targetWarehouseId}
                                        onChange={(e) => setTargetWarehouseId(e.target.value)}
                                        className="w-full rounded-xl p-3 outline-none font-bold cursor-pointer"
                                        style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                    >
                                        <option value="" disabled>Seçin...</option>
                                        {otherWarehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1 w-full">
                                    <label className="text-[10px] uppercase font-black tracking-widest block mb-1" style={{ color: 'var(--color-text-muted)' }}>Miqdar ({unitMap[(transferringProduct.unit || '').toLowerCase().trim()] || transferringProduct.unit})</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        max={transferringProduct.stock_quantity}
                                        value={transferQuantity}
                                        onChange={(e) => setTransferQuantity(e.target.value)}
                                        className="w-full rounded-xl p-3 outline-none font-bold"
                                        style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                        placeholder={`Max: ${transferringProduct.stock_quantity}`}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={transferMutation.isPending || !targetWarehouseId || !transferQuantity}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-white disabled:opacity-50 transition-all active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))' }}
                                >
                                    {transferMutation.isPending ? 'Köçürülür...' : 'Tamamla'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default WarehouseDetailsModal;
