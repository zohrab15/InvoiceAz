import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientApi from '../api/client';
import {
    Package, Plus, Search, Filter, Edit2, Trash2,
    Upload, Download, QrCode, MoreHorizontal,
    AlertCircle, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import ProductQRScanner from '../components/ProductQRScanner';

const Products = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [excelFile, setExcelFile] = useState(null);

    // Fetch Products
    const { data: products, isLoading } = useQuery({
        queryKey: ['products', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/inventory/');
            return res.data;
        },
        enabled: !!activeBusiness && activeBusiness?.user_role !== 'SALES_REP',
        retry: false
    });

    // Mutations
    const addMutation = useMutation({
        mutationFn: (newProd) => clientApi.post('/inventory/', newProd),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            showToast('Məhsul əlavə edildi');
            setIsAddModalOpen(false);
        },
        onError: (err) => {
            const data = err.response?.data;
            if (data?.detail) {
                showToast(data.detail, 'error');
            } else if (data && typeof data === 'object') {
                const errors = Object.entries(data).map(([key, value]) => {
                    const msg = Array.isArray(value) ? value[0] : value;
                    return `${key}: ${msg}`;
                });
                showToast(errors[0] || 'Xəta baş verdi', 'error');
            } else {
                showToast('Server xətası baş verdi', 'error');
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: (prod) => clientApi.put(`/inventory/${prod.id}/`, prod),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            showToast('Məhsul yeniləndi');
            setEditingProduct(null);
        },
        onError: (err) => {
            const data = err.response?.data;
            showToast(data?.detail || 'Yenilənmə zamanı xəta', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => clientApi.delete(`/inventory/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            showToast('Məhsul silindi');
        }
    });

    const uploadMutation = useMutation({
        mutationFn: (formData) => clientApi.post('/inventory/upload-excel/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['products']);
            showToast(res.data.detail);
            setIsUploadModalOpen(false);
            setExcelFile(null);
        },
        onError: (err) => showToast(err.response?.data?.detail || 'Yükləmə zamanı xəta', 'error')
    });

    const unitMap = {
        'pcs': 'ədəd',
        'kg': 'kq',
        'm': 'metr',
        'l': 'litr',
        'service': 'xidmət',
        'ədəd': 'ədəd',
        'kq': 'kq',
        'metr': 'metr',
        'litr': 'litr',
        'xidmət': 'xidmət'
    };

    const handleInitialQRScan = (result) => {
        setIsQRScannerOpen(false);
        const found = products?.find(p => p.sku === result);
        if (found) {
            setEditingProduct(found);
        } else {
            setEditingProduct({ sku: result, name: '', base_price: 0, unit: 'pcs' });
        }
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!excelFile || !activeBusiness) return;
        const formData = new FormData();
        formData.append('file', excelFile);
        formData.append('business', activeBusiness.id);
        uploadMutation.mutate(formData);
    };

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    if (!activeBusiness) return (
        <div className="p-8 text-center text-slate-500">Zəhmət olmasa davam etmək üçün biznes seçin.</div>
    );

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 min-h-screen pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 font-roboto" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2.5 rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))', boxShadow: '0 10px 20px var(--color-brand-shadow)' }}>
                            <Package size={28} />
                        </div>
                        Məhsullar və İnventar
                    </h1>
                    <p className="mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Anbardakı məhsullarınızı idarə edin və fakturalara sürətli əlavə edin.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)' }}
                    >
                        <Upload size={18} />
                        <span className="hidden sm:inline">Excel Yüklə</span>
                    </button>
                    <button
                        onClick={() => setIsQRScannerOpen(true)}
                        className="p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)' }}
                    >
                        <QrCode size={18} />
                        <span className="hidden sm:inline">QR Skan</span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
                        style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))', boxShadow: '0 10px 20px var(--color-brand-shadow)' }}
                    >
                        <Plus size={18} />
                        Yeni Məhsul
                    </button>
                </div>
            </div>

            {/* Stats / Quick Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                    <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Ümumi Çeşid</div>
                    <div className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{products?.length || 0}</div>
                </div>
                <div className="p-6 rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                    <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Aktiv Məhsul</div>
                    <div className="text-3xl font-black" style={{ color: 'var(--color-brand)' }}>{filteredProducts.length}</div>
                </div>
                <div className="p-6 rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                    <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Anbar Vəziyyəti</div>
                    <div className={`text-3xl font-black ${products?.some(p => {
                        const stock = Number(p.stock_quantity || 0);
                        const min = Number(p.min_stock_level || 0);
                        return stock <= min && stock > 0;
                    }) ? 'text-rose-500' : products?.some(p => Number(p.stock_quantity || 0) <= 0) ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {(() => {
                            const lowStockCount = (products || []).filter(p => {
                                const stock = Number(p.stock_quantity || 0);
                                const min = Number(p.min_stock_level || 0);
                                return stock <= min;
                            }).length || 0;
                            return lowStockCount > 0 ? `${lowStockCount} Xəbərdarlıq` : 'Normal';
                        })()}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Məhsul adı və ya SKU ilə axtarış..."
                        className="w-full rounded-2xl p-4 pl-12 outline-none transition-all font-medium"
                        style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    className="px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all"
                    style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)' }}
                >
                    <Filter size={18} />
                    Filtr
                </button>
            </div>

            {/* Product List */}
            <div className="rounded-3xl overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-hover-bg)', borderBottom: '1px solid var(--color-card-border)' }}>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Məhsul</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>SKU / Barkod</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Qiymət</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Anbar (Stok)</th>
                                <th className="p-5 text-[10px] uppercase font-black tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Əməliyyatlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--color-card-border)' }}>
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="p-8"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div></td>
                                    </tr>
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                                            <Package size={64} />
                                            <p className="font-bold text-slate-500 text-lg">Məhsul tapılmadı</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold capitalize" style={{ color: 'var(--color-text-primary)' }}>{product.name}</div>
                                                <div className="text-xs font-medium truncate max-w-[200px]" style={{ color: 'var(--color-text-secondary)' }}>{product.description || 'Təsvir yoxdur'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="font-mono text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-text-secondary)' }}>
                                            {product.sku || '---'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="font-black" style={{ color: 'var(--color-text-primary)' }}>
                                            {product.base_price} <span className="text-xs font-bold ml-1" style={{ color: 'var(--color-text-muted)' }}>₼</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-bold flex items-center gap-2" style={{
                                                color: (Number(product.stock_quantity || 0) <= Number(product.min_stock_level || 0))
                                                    ? 'var(--color-danger)'
                                                    : 'var(--color-text-primary)'
                                            }}>
                                                {product.stock_quantity} <span className="text-[10px] uppercase opacity-60">{unitMap[(product.unit || '').toLowerCase().trim()] || product.unit}</span>
                                                {Number(product.stock_quantity || 0) <= Number(product.min_stock_level || 0) && (
                                                    <AlertCircle size={14} className="text-rose-500 animate-pulse" />
                                                )}
                                            </div>
                                            {(() => {
                                                const stock = Number(product.stock_quantity || 0);
                                                const min = Number(product.min_stock_level || 0);
                                                if (stock <= 0) return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 w-fit">Bitib</span>;
                                                if (stock <= min) return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 w-fit">Azalır</span>;
                                                return <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 w-fit">Kifayət qədər</span>;
                                            })()}
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingProduct(product)}
                                                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
                                                        deleteMutation.mutate(product.id);
                                                    }
                                                }}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {(isAddModalOpen || editingProduct) && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-4 md:my-auto max-h-[85vh] sm:max-h-[90vh]"
                            style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                        >
                            <div className="p-6 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                                <h3 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                                    {editingProduct?.id ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul'}
                                </h3>
                                <button
                                    onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
                                    className="p-2 rounded-xl transition-colors"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form
                                className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar pb-12"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const rawData = Object.fromEntries(formData.entries());

                                    // Sanitize numeric fields — convert empty strings or invalid inputs to 0
                                    const sanitizedData = {
                                        ...rawData,
                                        base_price: parseFloat(rawData.base_price) || 0,
                                        stock_quantity: parseFloat(rawData.stock_quantity) || 0,
                                        min_stock_level: parseFloat(rawData.min_stock_level) || 0,
                                    };

                                    if (editingProduct?.id) {
                                        updateMutation.mutate({ ...editingProduct, ...sanitizedData });
                                    } else {
                                        addMutation.mutate(sanitizedData);
                                    }
                                }}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Məhsul Adı</label>
                                        <input
                                            name="name"
                                            defaultValue={editingProduct?.name || ''}
                                            required
                                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            className="w-full rounded-xl p-4 outline-none transition-all font-bold focus:ring-2 focus:ring-blue-500/20"
                                            style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                            placeholder="Məhsulun adını daxil edin"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>SKU / Barkod</label>
                                        <input
                                            name="sku"
                                            defaultValue={editingProduct?.sku || ''}
                                            className="w-full rounded-xl p-4 outline-none transition-all font-bold"
                                            style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                            placeholder="Kodu daxil edin"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Qiymət (₼)</label>
                                        <input
                                            name="base_price"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingProduct?.base_price || 0}
                                            required
                                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            className="w-full rounded-xl p-4 outline-none transition-all font-bold"
                                            style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Ölçü Vahidi</label>
                                        <select
                                            name="unit"
                                            defaultValue={editingProduct?.unit || 'pcs'}
                                            className="w-full rounded-xl p-4 outline-none transition-all font-bold cursor-pointer"
                                            style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                        >
                                            <option value="pcs">Ədəd</option>
                                            <option value="kg">Kq</option>
                                            <option value="m">Metr</option>
                                            <option value="l">Litr</option>
                                            <option value="service">Xidmət</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Mövcud Miqdar</label>
                                        <input
                                            name="stock_quantity"
                                            type="number"
                                            step="0.001"
                                            defaultValue={editingProduct?.stock_quantity ?? 0}
                                            className="w-full rounded-xl p-4 outline-none transition-all font-bold"
                                            style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                            placeholder="Nə qədərdir?"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Kritik Limit</label>
                                        <input
                                            name="min_stock_level"
                                            type="number"
                                            step="0.001"
                                            defaultValue={editingProduct?.min_stock_level ?? 0}
                                            className="w-full rounded-xl p-4 outline-none transition-all font-bold"
                                            style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                            placeholder="Limit?"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest block mb-2" style={{ color: 'var(--color-text-muted)' }}>Təsvir</label>
                                        <textarea
                                            name="description"
                                            defaultValue={editingProduct?.description || ''}
                                            rows="3"
                                            className="w-full rounded-xl p-4 outline-none transition-all font-medium"
                                            style={{ backgroundColor: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)', color: 'var(--color-text-primary)' }}
                                            placeholder="Məhsul haqqında qısa məlumat..."
                                        />
                                    </div>
                                </div>
                                <div className="pt-6 pb-4 shrink-0">
                                    <button
                                        type="submit"
                                        disabled={addMutation.isPending || updateMutation.isPending}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {addMutation.isPending || updateMutation.isPending ? 'Saxlanılır...' : 'Yadda Saxla'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isUploadModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                            style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                        >
                            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                                <h3 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>Excel ilə Yüklə</h3>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpload} className="p-6 space-y-6">
                                <div
                                    className="border-2 border-dashed rounded-3xl p-10 text-center flex flex-col items-center gap-4 transition-colors cursor-pointer relative"
                                    style={{ borderColor: 'var(--color-card-border)' }}
                                >
                                    <Upload size={40} style={{ color: 'var(--color-brand)' }} />
                                    <div className="space-y-1">
                                        <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Excel faylını seçin</p>
                                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>.xlsx və ya .xls formatları</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".xlsx, .xls"
                                        onChange={(e) => setExcelFile(e.target.files[0])}
                                    />
                                    {excelFile && (
                                        <div className="mt-2 text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                                            {excelFile.name}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-2xl flex gap-3 items-start" style={{ backgroundColor: 'var(--color-hover-bg)' }}>
                                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
                                    <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                        Faylın sütun ardıcıllığı belə olmalıdır: <br />
                                        <span className="font-bold">Ad, Təsvir, SKU, Qiymət, Vahid, Miqdar, Limit</span>
                                    </div>
                                </div>

                                <button
                                    className="w-full py-4 rounded-xl font-black shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 text-white"
                                    style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))', boxShadow: '0 10px 20px var(--color-brand-shadow)' }}
                                    disabled={!excelFile || uploadMutation.isPending}
                                >
                                    {uploadMutation.isPending ? 'Yüklənir...' : 'İndi Yüklə'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Scanner Interface */}
            {isQRScannerOpen && (
                <ProductQRScanner
                    onScan={handleInitialQRScan}
                    onClose={() => setIsQRScannerOpen(false)}
                />
            )}
        </div>
    );
};

export default Products;
