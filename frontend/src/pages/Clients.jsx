import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { Plus, Search, Mail, Phone, MoreVertical, X, User, Building, MapPin, Hash, Edit, Trash2 } from 'lucide-react';
import PhoneInput from '../components/common/PhoneInput';
import * as XLSX from 'xlsx';
import UpgradeModal from '../components/UpgradeModal';
import usePlanLimits from '../hooks/usePlanLimits';

const Clients = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const { checkLimit, isPro } = usePlanLimits();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        voen: ''
    });

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', address: '', voen: '' });
        setEditingClient(null);
        setIsModalOpen(false);
    };

    const handleAddNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const { data: clients, isLoading } = useQuery({
        queryKey: ['clients', activeBusiness?.id],
        queryFn: async () => {
            const res = await clientApi.get('/clients/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const createMutation = useMutation({
        mutationFn: (data) => clientApi.post('/clients/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri əlavə edildi');
            resetForm();
        },
        onError: (error) => {
            const data = error.response?.data;
            if (data?.code === 'plan_limit' || (data?.detail && String(data.detail).includes('limit'))) {
                setShowUpgradeModal(true);
            } else {
                const detail = data?.detail || 'Xəta baş verdi';
                showToast(detail, 'error');
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => clientApi.put(`/clients/${data.id}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri yeniləndi');
            resetForm();
        },
        onError: (error) => showToast(error.response?.data?.detail || 'Xəta baş verdi', 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => clientApi.delete(`/clients/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri silindi');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingClient) {
            updateMutation.mutate({ ...formData, id: editingClient.id });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            voen: client.voen || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Bu müştərini silmək istədiyinizə əminsiniz?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredClients = clients?.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight font-roboto">Müştərilər</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const data = (clients || []).map(c => ({
                                'Ad': c.name,
                                'Email': c.email || '',
                                'Telefon': c.phone || '',
                                'VÖEN': c.tax_number || '',
                                'Ünvan': c.address || '',
                                'Bank': c.bank_name || '',
                                'Hesab (IBAN)': c.bank_account || ''
                            }));

                            const ws = XLSX.utils.json_to_sheet(data);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Müştərilər");
                            XLSX.writeFile(wb, `musteriler_siyahisi_${new Date().toISOString().split('T')[0]}.xlsx`);
                        }}
                        className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm flex items-center gap-2"
                        title="Excel kimi yüklə"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Eksport</span>
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="bg-primary-blue text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Yeni Müştəri</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex items-center space-x-4">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Ad, email və ya telefon ilə axtar..."
                        className="bg-transparent border-none outline-none w-full text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Müştəri</th>
                                <th className="px-6 py-4">Əlaqə</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Əməliyyatlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">Yüklənir...</td></tr>
                            ) : filteredClients?.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">Müştəri tapılmadı</td></tr>
                            ) : filteredClients?.map((client) => (
                                <motion.tr
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={client.id}
                                    className="hover:bg-blue-50/30 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 text-primary-blue rounded-full flex items-center justify-center font-bold text-lg">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{client.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Building size={10} /> {client.voen ? `VÖEN: ${client.voen}` : 'VÖEN yoxdur'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {client.email && (
                                                <div className="flex items-center text-sm text-gray-600 gap-2">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {client.email}
                                                </div>
                                            )}
                                            {client.phone && (
                                                <div className="flex items-center text-sm text-gray-600 gap-2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {client.phone}
                                                </div>
                                            )}
                                            {client.address && (
                                                <div className="flex items-center text-sm text-gray-600 gap-2">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    <span className="truncate max-w-[200px]">{client.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider">
                                            Aktiv
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">{editingClient ? 'Müştəri Məlumatlarını Yenilə' : 'Yeni Müştəri Əlavə Et'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tam Ad / Şirkət Adı</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            required
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                            placeholder="Ad daxil edin"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="email"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                                placeholder="example@mail.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Mobil Nömrə</label>
                                        <PhoneInput
                                            value={formData.phone}
                                            onChange={(val) => setFormData({ ...formData, phone: val })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">VÖEN</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                                placeholder="10 rəqəmli VÖEN"
                                                value={formData.voen}
                                                onChange={(e) => setFormData({ ...formData, voen: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ünvan</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-blue focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                                placeholder="Şəhər, küçə..."
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Ləğv et
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-primary-blue text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                                    >
                                        {editingClient ? 'Yadda Saxla' : 'Əlavə Et'}
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
                resourceName="Müştəri"
                limit={checkLimit('clients').limit}
            />
        </div>
    );
};

export default Clients;
