import React, { useState } from 'react';
import { API_URL } from '../config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { Plus, Trash2, Search, Filter, DollarSign, Calendar, Tag, CreditCard, ChevronDown, X, Building, User, Paperclip, Download, Info, Edit2, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import UpgradeModal from '../components/UpgradeModal';
import usePlanLimits from '../hooks/usePlanLimits';

import { useBusiness } from '../context/BusinessContext';

const Expenses = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const { checkLimit, isPro } = usePlanLimits();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [budgetLimitInput, setBudgetLimitInput] = useState('');

    const categories = [
        { id: 'office', name: 'Ofis ləvazimatları', color: '#3B82F6' }, // Blue
        { id: 'salary', name: 'Maaşlar', color: '#10B981' }, // Green
        { id: 'marketing', name: 'Marketinq', color: '#F59E0B' }, // Amber
        { id: 'rent', name: 'İcarə və Kommunal', color: '#EF4444' }, // Red
        { id: 'travel', name: 'Ezamiyyət', color: '#8B5CF6' }, // Violet
        { id: 'software', name: 'Proqram və Abunəliklər', color: '#06B6D4' }, // Cyan
        { id: 'transport', name: 'Nəqliyyat və Yanacaq', color: '#F97316' }, // Orange
        { id: 'hardware', name: 'Avadanlıq və Texnika', color: '#6366F1' }, // Indigo
        { id: 'tax', name: 'Vergi və Dövlət rüsumları', color: '#991B1B' }, // Dark Red
        { id: 'bank', name: 'Bank və Komissiya', color: '#059669' }, // Emerald
        { id: 'training', name: 'Təlim və Tədris', color: '#D946EF' }, // Fuchsia
        { id: 'other', name: 'Digər', color: '#64748B' }, // Slate
    ];

    const [formData, setFormData] = useState({
        description: '',
        vendor: '',
        amount: '',
        currency: 'AZN',
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        status: 'paid',
        payment_method: 'Nəqd',
        client: '',
        notes: ''
    });
    const [attachment, setAttachment] = useState(null);

    const resetForm = () => {
        setFormData({
            description: '',
            vendor: '',
            amount: '',
            currency: 'AZN',
            date: new Date().toISOString().split('T')[0],
            category: 'other',
            status: 'paid',
            payment_method: 'Nəqd',
            client: '',
            notes: ''
        });
        setAttachment(null);
        setEditingExpense(null);
    };

    const { data: expenses, isLoading } = useQuery({
        queryKey: ['expenses', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/invoices/expenses/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const { data: clients } = useQuery({
        queryKey: ['clients', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/clients/clients/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const createMutation = useMutation({
        mutationFn: (data) => {
            const fd = new FormData();
            Object.keys(data).forEach(key => {
                // Only append if value is not null/undefined and not an empty string for optional fields
                if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
                    fd.append(key, data[key]);
                }
            });
            if (attachment instanceof File) {
                fd.append('attachment', attachment);
            }
            return clientApi.post('/invoices/expenses/', fd);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['expenses']);
            showToast('Xərc uğurla əlavə edildi!');
            setShowAddModal(false);
            resetForm();
        },
        onError: (error) => {
            console.error('Create error:', error);
            const data = error.response?.data;
            if (data?.code === 'plan_limit' || (data?.detail && String(data.detail).includes('limit'))) {
                setShowUpgradeModal(true);
                setShowAddModal(false);
            } else {
                const detail = data?.detail || data?.error || 'Xərc əlavə edilərkən xəta baş verdi';
                showToast(detail, 'error');
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => {
            const fd = new FormData();
            Object.keys(data).forEach(key => {
                const val = data[key];
                // Don't append attachment here, it's handled separately
                if (key === 'attachment') return;

                // Only append if value is not null, undefined, or empty string
                // Exception: if it's a numeric field like amount, 0 is valid but '' is not
                if (val !== null && val !== undefined && val !== '') {
                    fd.append(key, val);
                }
            });
            // If new attachment selected, append it
            if (attachment instanceof File) {
                fd.append('attachment', attachment);
            }
            return clientApi.patch(`/invoices/expenses/${editingExpense.id}/`, fd);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['expenses']);
            showToast('Xərc yeniləndi!');
            setShowAddModal(false);
            resetForm();
        },
        onError: (error) => {
            console.error('Update error:', error);
            const msg = error.response?.data?.detail || error.response?.data?.error || 'Yeniləmə zamanı xəta baş verdi';
            showToast(msg, 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => clientApi.delete(`/invoices/expenses/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['expenses']);
            showToast('Xərc silindi');
        }
    });

    const updateBudgetMutation = useMutation({
        mutationFn: (newLimit) => clientApi.patch(`/users/business/${activeBusiness.id}/`, { budget_limit: newLimit }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['business']);
            showToast('Büdcə limiti yeniləndi');
            setIsEditingBudget(false);
        },
        onError: () => showToast('Büdcəni yeniləmək mümkün olmadı', 'error')
    });

    const monthlyBudget = activeBusiness?.budget_limit || 1000;

    const filteredExpenses = expenses?.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const chartData = categories.map(cat => ({
        name: cat.name,
        value: expenses?.filter(e => e.category === cat.id).reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0
    })).filter(d => d.value > 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.description || !formData.amount) return showToast('Məbləğ və təsvir məcburidir', 'error');
        createMutation.mutate(formData);
    };

    if (isLoading) return <div className="p-12 text-center text-gray-400">Yüklənir...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 pb-20"
        >
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Xərclər</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const data = (expenses || []).map(e => ({
                                'Təsvir': e.description,
                                'Təchizatçı': e.vendor || '',
                                'Kateqoriya': categories.find(c => c.id === e.category)?.name || e.category,
                                'Tarix': e.date,
                                'Məbləğ': parseFloat(e.amount),
                                'Valyuta': e.currency,
                                'Status': e.status === 'paid' ? 'Ödənilib' : 'Gözləmədə',
                                'Ödəniş Üsulu': e.payment_method || ''
                            }));

                            const ws = XLSX.utils.json_to_sheet(data);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Xərclər");
                            XLSX.writeFile(wb, `xercler_hesabati_${new Date().toISOString().split('T')[0]}.xlsx`);
                        }}
                        className="p-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm flex items-center gap-2"
                        title="CSV kimi yüklə"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Eksport</span>
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                        className="bg-red-500 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-red-600 shadow-lg shadow-red-100 transition-all font-bold text-sm"
                    >
                        <Plus size={20} />
                        <span>Yeni Xərc</span>
                    </motion.button>
                </div>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center space-x-3 bg-gray-50/30">
                            <Search size={20} className="text-gray-400 ml-2" />
                            <input
                                type="text"
                                placeholder="Xərclərdə axtar..."
                                className="bg-transparent border-none focus:ring-0 w-full font-medium text-gray-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Təsvir / Kateqoriya</th>
                                        <th className="px-6 py-4 text-center">Tarix</th>
                                        <th className="px-6 py-4 text-right">Məbləğ</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredExpenses?.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-red-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-gray-900 leading-tight">{exp.description}</div>
                                                    {exp.attachment && (
                                                        <a href={exp.attachment.startsWith('http') ? exp.attachment : `${API_URL}${exp.attachment}`} target="_blank" rel="noreferrer">
                                                            <Paperclip size={12} className="text-blue-400" />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
                                                        {categories.find(c => c.id === exp.category)?.name}
                                                    </span>
                                                    {exp.vendor && (
                                                        <>
                                                            <span className="text-[10px] text-gray-300">•</span>
                                                            <span className="text-[10px] font-bold text-gray-500">{exp.vendor}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-xs font-semibold text-gray-400">
                                                    {new Date(exp.date).toLocaleDateString('az-AZ')}
                                                </div>
                                                <div className={`text-[9px] font-black uppercase mt-1 px-1.5 py-0.5 rounded-md inline-block ${exp.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {exp.status === 'paid' ? 'Ödənilib' : 'Gözləmədə'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-red-500 text-sm">
                                                -{parseFloat(exp.amount).toFixed(2)} {exp.currency}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => {
                                                            setEditingExpense(exp);
                                                            setFormData({
                                                                description: exp.description,
                                                                vendor: exp.vendor || '',
                                                                amount: exp.amount,
                                                                currency: exp.currency,
                                                                date: exp.date,
                                                                category: exp.category,
                                                                status: exp.status,
                                                                payment_method: exp.payment_method || '',
                                                                client: exp.client || '',
                                                                notes: exp.notes || ''
                                                            });
                                                            setAttachment(exp.attachment);
                                                            setShowAddModal(true);
                                                        }}
                                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-300 hover:text-blue-500 transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => { if (window.confirm('Silinsin?')) deleteMutation.mutate(exp.id); }}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredExpenses?.length === 0 && (
                                        <tr><td colSpan="4" className="p-12 text-center text-gray-300 italic">Xərc tapılmadı</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-black text-gray-800 text-sm tracking-widest uppercase mb-8 border-b pb-4">Kateqoriya üzrə</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={140}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        radius={[0, 4, 4, 0]}
                                        barSize={20}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={categories.find(c => c.name === entry.name)?.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-black text-gray-800 text-sm tracking-widest uppercase mb-4 mb-6 border-b pb-4 flex items-center justify-between">
                            <span>Büdcə Limiti</span>
                            <Info size={14} className="text-gray-400" />
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-gray-400 uppercase tracking-wider">Aylıq Xərclər</span>
                                    <span className="text-gray-800">
                                        {expenses?.filter(e => {
                                            const d = new Date(e.date);
                                            const now = new Date();
                                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                        }).reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)} ₼
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`${(expenses?.filter(e => {
                                            const d = new Date(e.date);
                                            const now = new Date();
                                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                        }).reduce((sum, e) => sum + parseFloat(e.amount), 0) / monthlyBudget) > 0.9 ? 'bg-red-500' : 'bg-blue-500'
                                            } h-full rounded-full transition-all duration-1000`}
                                        style={{
                                            width: `${Math.min(100, (expenses?.filter(e => {
                                                const d = new Date(e.date);
                                                const now = new Date();
                                                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                            }).reduce((sum, e) => sum + parseFloat(e.amount), 0) / monthlyBudget) * 100)}%`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="text-[10px] text-gray-400 font-medium italic">
                                        Limit: {monthlyBudget} ₼
                                    </div>
                                    <button
                                        onClick={() => setIsEditingBudget(true)}
                                        className="text-[10px] text-blue-500 font-bold hover:underline"
                                    >
                                        Dəyiş
                                    </button>
                                </div>

                                {isEditingBudget && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[9px] font-black uppercase text-blue-400">Yeni Aylıq Limit (₼)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="flex-1 bg-white border border-blue-100 rounded-lg p-1.5 text-xs font-bold outline-none"
                                                value={budgetLimitInput || monthlyBudget}
                                                onChange={(e) => setBudgetLimitInput(e.target.value)}
                                            />
                                            <button
                                                onClick={() => {
                                                    updateBudgetMutation.mutate(budgetLimitInput || monthlyBudget);
                                                }}
                                                disabled={updateBudgetMutation.isPending}
                                                className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                                            >
                                                {updateBudgetMutation.isPending ? '...' : 'Ok'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden">
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                                    {editingExpense ? 'Xərci Redaktə Et' : 'Yeni Xərc'}
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!formData.description || !formData.amount) return showToast('Məbləğ və təsvir məcburidir', 'error');
                                if (editingExpense) {
                                    updateMutation.mutate(formData);
                                } else {
                                    createMutation.mutate(formData);
                                }
                            }} className="p-8 space-y-5 overflow-y-auto max-h-[70vh]">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                        <input type="text" placeholder="Xərcin təsviri *" className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 pl-12 outline-none transition-all font-bold" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                                    </div>

                                    <div className="relative">
                                        <Building className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                        <input type="text" placeholder="Təchizatçı (Vendor)" className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 pl-12 outline-none transition-all font-bold" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                            <input type="number" step="0.01" placeholder="Məbləğ *" className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 pl-12 outline-none transition-all font-bold" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                                        </div>
                                        <div className="relative">
                                            <select className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 outline-none transition-all font-bold cursor-pointer" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                                                <option value="AZN">AZN</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                            <input type="date" className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 pl-12 outline-none transition-all font-bold" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                        <div className="relative">
                                            <select className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 outline-none transition-all font-bold cursor-pointer" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="paid">Ödənilib</option>
                                                <option value="pending">Gözləmədə</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <select className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 outline-none transition-all font-bold cursor-pointer" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                            <select
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 pl-12 outline-none transition-all font-bold cursor-pointer"
                                                value={formData.payment_method}
                                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                            >
                                                <option value="Nəqd">Nəqd</option>
                                                <option value="Bank köçürməsi">Bank köçürməsi</option>
                                                <option value="Kart">Kart</option>
                                                <option value="Digər">Digər</option>
                                            </select>
                                        </div>
                                    </div>


                                    <div className="relative">
                                        <div className={`w-full bg-gray-50 border-2 border-dashed ${attachment ? 'border-green-500 bg-green-50' : 'border-gray-200'} rounded-xl p-4 transition-all`}>
                                            <label className="flex flex-col items-center justify-center cursor-pointer gap-2">
                                                {attachment ? (
                                                    <>
                                                        <Check size={24} className="text-green-500" />
                                                        <span className="text-xs font-bold text-green-700">{attachment.name}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Paperclip size={24} className="text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Qəbz / Faktura əlavə et</span>
                                                    </>
                                                )}
                                                <input type="file" className="hidden" onChange={(e) => setAttachment(e.target.files[0])} accept="image/*,.pdf" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all">Ləğv et</button>
                                    <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest bg-red-500 text-white shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50">
                                        {createMutation.isPending || updateMutation.isPending ? 'Göndərilir...' : (editingExpense ? 'Yadda Saxla' : 'Əlavə et')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                resourceName="Xərc"
                limit={checkLimit('expenses').limit}
            />
        </motion.div>
    );
};

export default Expenses;
