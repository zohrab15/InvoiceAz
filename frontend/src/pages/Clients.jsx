import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import clientApi from '../api/client';
import { useToast } from '../components/Toast';
import { Plus, Search, Mail, Phone, MoreVertical, X, User, Building, MapPin, Hash, Edit, Trash2, Download } from 'lucide-react';
import PhoneInput from '../components/common/PhoneInput';
import * as XLSX from 'xlsx';
import UpgradeModal from '../components/UpgradeModal';
import usePlanLimits from '../hooks/usePlanLimits';
import useAuthStore from '../store/useAuthStore';

const Clients = () => {
    const { activeBusiness } = useBusiness();
    const queryClient = useQueryClient();
    const showToast = useToast();
    const { checkLimit, isPro } = usePlanLimits();
    const { token, user } = useAuthStore();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        voen: '',
        assigned_to: ''
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkAssignLoading, setIsBulkAssignLoading] = useState(false);

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', address: '', voen: '', assigned_to: '' });
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
            const res = await clientApi.get('/clients/all/');
            return res.data;
        },
        enabled: !!activeBusiness,
    });

    const isOwnerOrManager = activeBusiness?.user_role === 'OWNER' || activeBusiness?.user_role === 'MANAGER';

    const { data: teamMembers } = useQuery({
        queryKey: ['team', token],
        queryFn: async () => {
            const res = await clientApi.get('/users/team/');
            return res.data;
        },
        enabled: !!token && (user?.membership === 'Premium' || isOwnerOrManager),
    });

    // Only show Sales Reps for assignment per user request
    const salesReps = teamMembers?.filter(m => m.role === 'SALES_REP') || [];

    const createMutation = useMutation({
        mutationFn: (data) => clientApi.post('/clients/all/', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri əlavə edildi');
            setIsAddModalOpen(false);
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
        mutationFn: (data) => clientApi.put(`/clients/all/${data.id}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri yeniləndi');
            setEditingClient(null);
            resetForm();
        },
        onError: (error) => showToast(error.response?.data?.detail || 'Xəta baş verdi', 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => clientApi.delete(`/clients/all/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            showToast('Müştəri silindi');
        }
    });

    const bulkAssignMutation = useMutation({
        mutationFn: (data) => clientApi.post('/clients/all/bulk-assign/', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['clients']);
            showToast(res.data.detail);
            setSelectedIds([]);
        },
        onError: (err) => showToast(err.response?.data?.detail || 'Toplu təhkim zamanı xəta', 'error')
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = { ...formData };
        if (!submitData.assigned_to) {
            submitData.assigned_to = null;
        }

        if (editingClient) {
            updateMutation.mutate({ ...submitData, id: editingClient.id });
        } else {
            createMutation.mutate(submitData);
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            voen: client.voen || '',
            assigned_to: client.assigned_to || ''
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

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredClients?.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredClients?.map(c => c.id) || []);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight font-roboto">Müştərilər</h1>
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
                                'Hesab (IBAN)': c.bank_account || '',
                                'Təhkim edilib': c.assigned_to || 'Heç kimə'
                            }));

                            const ws = XLSX.utils.json_to_sheet(data);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Müştərilər");
                            XLSX.writeFile(wb, `musteriler_siyahisi_${new Date().toISOString().split('T')[0]}.xlsx`);
                        }}
                        className="p-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-hover-bg)] transition-all font-bold text-sm flex items-center gap-2"
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

            <div className="bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-card-border)] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[var(--color-card-border)] bg-[var(--color-hover-bg)] flex items-center space-x-4">
                    <Search className="text-[var(--color-text-muted)]" size={20} />
                    <input
                        type="text"
                        placeholder="Ad, email və ya telefon ilə axtar..."
                        className="bg-transparent border-none outline-none w-full text-sm font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--color-hover-bg)] text-[var(--color-text-muted)] text-xs uppercase font-semibold">
                            <tr>
                                {isOwnerOrManager && (
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-[var(--color-card-border)] bg-[var(--color-card-bg)] checked:bg-blue-600 transition-all cursor-pointer"
                                            checked={filteredClients?.length > 0 && selectedIds.length === filteredClients?.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                )}
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
                                    className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(client.id) ? 'bg-blue-50/50' : ''}`}
                                >
                                    {isOwnerOrManager && (
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-[var(--color-card-border)] bg-[var(--color-card-bg)] checked:bg-blue-600 transition-all cursor-pointer"
                                                checked={selectedIds.includes(client.id)}
                                                onChange={() => toggleSelect(client.id)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-500/10 text-primary-blue rounded-full flex items-center justify-center font-bold text-lg">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-[var(--color-text-primary)]">{client.name}</div>
                                                <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                                                    <Building size={10} className="text-[var(--color-text-muted)]" /> {client.voen ? `VÖEN: ${client.voen}` : 'VÖEN yoxdur'}
                                                </div>
                                                {client.assigned_to && isOwnerOrManager && (
                                                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded max-w-max mt-1 border border-blue-100 uppercase tracking-tight">
                                                        Təhkim: {teamMembers?.find(m => m.user === client.assigned_to)?.user_name || 'Satış Təmsilçisi'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {client.email && (
                                                <div className="flex items-center text-sm text-[var(--color-text-secondary)] gap-2">
                                                    <Mail size={14} className="text-[var(--color-text-muted)]" />
                                                    {client.email}
                                                </div>
                                            )}
                                            {client.phone && (
                                                <div className="flex items-center text-sm text-[var(--color-text-secondary)] gap-2">
                                                    <Phone size={14} className="text-[var(--color-text-muted)]" />
                                                    {client.phone}
                                                </div>
                                            )}
                                            {client.address && (
                                                <div className="flex items-center text-sm text-[var(--color-text-secondary)] gap-2">
                                                    <MapPin size={14} className="text-[var(--color-text-muted)]" />
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
                                        <div className="flex justify-end space-x-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[var(--color-card-bg)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--color-card-border)]"
                        >
                            <div className="p-6 border-b border-[var(--color-card-border)] bg-[var(--color-hover-bg)] flex justify-between items-center">
                                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{editingClient ? 'Müştəri Məlumatlarını Yenilə' : 'Yeni Müştəri Əlavə Et'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Tam Ad / Şirkət Adı</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                                        <input
                                            required
                                            onInvalid={(e) => e.target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl focus:border-primary-blue text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                            placeholder="Ad daxil edin"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                                            <input
                                                type="email"
                                                className="w-full pl-10 pr-4 py-3 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl focus:border-primary-blue text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                                placeholder="example@mail.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Mobil Nömrə</label>
                                        <PhoneInput
                                            name="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">VÖEN</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl focus:border-primary-blue text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                                placeholder="10 rəqəmli VÖEN"
                                                value={formData.voen}
                                                onChange={(e) => setFormData({ ...formData, voen: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Ünvan</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-3 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl focus:border-primary-blue text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                                placeholder="Şəhər, küçə..."
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {(user?.membership === 'Premium' || isOwnerOrManager) && salesReps.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1">Satış Təmsilçisinə Təhkim Et (Könüllü)</label>
                                        <select
                                            className="w-full px-4 py-3 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl focus:border-primary-blue text-[var(--color-text-primary)] outline-none transition-all font-medium appearance-none"
                                            value={formData.assigned_to || ''}
                                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                        >
                                            <option value="">Heç kimə (Yalnız mən)</option>
                                            {salesReps.map(member => (
                                                <option key={member.user} value={member.user}>
                                                    {member.user_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-[var(--color-hover-bg)] text-[var(--color-text-secondary)] font-bold rounded-xl hover:bg-[var(--color-card-bg)] border border-[var(--color-card-border)] transition-colors"
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

            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/10 backdrop-blur-2xl border border-white/20 px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-10 min-w-[500px]"
                    >
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-white">{selectedIds.length}</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Seçilib</span>
                        </div>

                        <div className="h-10 w-px bg-white/10"></div>

                        <div className="flex-1 flex items-center gap-4">
                            <select
                                className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer hover:bg-white/10"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        bulkAssignMutation.mutate({
                                            client_ids: selectedIds,
                                            assigned_to: e.target.value
                                        });
                                    }
                                }}
                            >
                                <option value="" className="bg-slate-900 text-white">Təhkim et...</option>
                                {salesReps.map(member => (
                                    <option key={member.user} value={member.user} className="bg-slate-900 text-white">
                                        {member.user_name}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => setSelectedIds([])}
                                className="p-3 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
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
