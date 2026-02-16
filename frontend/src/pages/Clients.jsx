import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { Plus, Search, Mail, Phone, MoreVertical, X, User, Building, MapPin, Hash, Edit, Trash2, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import PhoneInput from '../components/common/PhoneInput';

const Clients = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        client_type: 'individual',
        email: '',
        phone: '',
        address: '',
        voen: ''
    });

    // Unified phone state is now inside formData.phone

    const resetForm = () => {
        setFormData({ name: '', client_type: 'individual', email: '', phone: '', address: '', voen: '' });
        // No need for separate phone states
        setEditingId(null);
        setActiveMenuId(null);
    };

    const { data: clients, isLoading } = useQuery({
        queryKey: ['clients', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/clients/');
            return res.data;
        },
        enabled: !!activeBusiness, // Only fetch if business is selected
    });

    const createMutation = useMutation({
        mutationFn: (data) => clientApi.post('/clients/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri uğurla əlavə edildi!');
            setShowAddModal(false);
            resetForm();
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.detail || 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
            showToast(errorMsg, 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => clientApi.put(`/clients/${editingId}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri məlumatları yeniləndi!');
            setShowAddModal(false);
            resetForm();
        },
        onError: (error) => {
            showToast('Yenilənmə zamanı xəta baş verdi', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => clientApi.delete(`/clients/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri silindi!');
        }
    });

    const filteredClients = React.useMemo(() => {
        return clients?.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name) return showToast('Ad məcburidir', 'error');

        const submissionData = { ...formData };

        if (editingId) {
            updateMutation.mutate(submissionData);
        } else {
            createMutation.mutate(submissionData);
        }
    };

    const handleEdit = (client) => {
        setFormData(client);
        setEditingId(client.id);

        setShowAddModal(true);
        setActiveMenuId(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('Bu müştərini silmək istədiyinizə əminsiniz?')) {
            deleteMutation.mutate(id);
        }
        setActiveMenuId(null);
    };

    if (isLoading) return (
        <div className="h-48 flex items-center justify-center text-gray-400">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Plus size={32} />
            </motion.div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">Müştərilər</h2>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}
                    className="bg-primary-blue text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-bold text-sm"
                >
                    <Plus size={20} />
                    <span>Yeni Müştəri</span>
                </motion.button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-4 border-b border-gray-50 flex items-center space-x-3 bg-gray-50/30">
                    <Search size={20} className="text-gray-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Müştəri axtar..."
                        className="bg-transparent border-none focus:ring-0 w-full font-medium text-gray-600 placeholder:text-gray-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Ad / Şirkət</th>
                                <th className="px-6 py-4">Əlaqə</th>
                                <th className="px-6 py-4">Maliyyə (Gəlir / Xərc)</th>
                                <th className="px-6 py-4">VÖEN</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <AnimatePresence>
                                {filteredClients?.map((client, i) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={client.id}
                                        className="hover:bg-blue-50/30 transition-colors group cursor-default"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${client.client_type === 'company' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {client.client_type === 'company' ? <Building size={18} /> : <User size={18} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 leading-tight">{client.name}</div>
                                                    <div className="text-[10px] font-black uppercase tracking-tighter text-gray-400 mt-0.5">
                                                        {client.client_type === 'company' ? 'Şirkət' : 'Fiziki şəxs'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 space-y-1">
                                            {client.email && (
                                                <div className="flex items-center text-xs font-medium text-gray-500 hover:text-primary-blue transition-colors">
                                                    <Mail size={12} className="mr-2 opacity-50" /> {client.email}
                                                </div>
                                            )}
                                            {client.phone && (
                                                <div className="flex items-center text-xs font-medium text-gray-500">
                                                    <Phone size={12} className="mr-2 opacity-50" /> {client.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                    <ArrowUpRight size={12} /> {parseFloat(client.total_revenue).toLocaleString()} ₼
                                                </div>
                                                <div className="text-xs font-bold text-red-500 flex items-center gap-1">
                                                    <ArrowDownRight size={12} /> {parseFloat(client.total_expenses).toLocaleString()} ₼
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                {client.voen || '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right relative">
                                            <button
                                                onClick={() => setActiveMenuId(activeMenuId === client.id ? null : client.id)}
                                                className={`p-2 rounded-lg transition-all ${activeMenuId === client.id ? 'bg-blue-100 text-primary-blue opacity-100' : 'text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100'}`}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {/* Action Menu */}
                                            <AnimatePresence>
                                                {activeMenuId === client.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        className="absolute right-8 top-12 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => handleEdit(client)}
                                                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-blue flex items-center gap-2 transition-colors"
                                                        >
                                                            <Edit size={14} /> Düzəliş et
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(client.id)}
                                                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Trash2 size={14} /> Sil
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredClients?.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="text-gray-300 font-bold italic tracking-tight">Müştəri tapılmadı...</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{editingId ? 'Müştəri Düzəliş' : 'Yeni Müştəri'}</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, client_type: 'individual' })}
                                            className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.client_type === 'individual' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Fiziki Şəxs
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, client_type: 'company' })}
                                            className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.client_type === 'company' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Şirkət / VÖEN
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Müştəri və ya Şirkət adı"
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-blue rounded-xl p-3 pl-12 outline-none transition-all font-bold placeholder:font-medium"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-blue rounded-xl p-3 pl-12 outline-none transition-all font-bold"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <PhoneInput
                                            label="Telefon"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>

                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Ünvan"
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-blue rounded-xl p-3 pl-12 outline-none transition-all font-bold"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>

                                    <div className="relative">
                                        <Hash className="absolute left-4 top-3.5 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            placeholder="VÖEN (isteğe bağlı)"
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-blue rounded-xl p-3 pl-12 outline-none transition-all font-bold"
                                            value={formData.voen}
                                            onChange={(e) => setFormData({ ...formData, voen: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all border-2 border-transparent hover:border-gray-100"
                                    >
                                        Ləğv et
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending}
                                        className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest bg-primary-blue text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? 'Göndərilir...' : (editingId ? 'Yadda saxla' : 'Əlavə et')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Clients;
