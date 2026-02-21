import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import useAuthStore from '../../store/useAuthStore';
import { useToast } from '../Toast';
import { Trash2, UserPlus, Mail, Users, MapPin, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamSettings = () => {
    const queryClient = useQueryClient();
    const { token, user } = useAuthStore();
    const showToast = useToast();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('SALES_REP');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch team members
    const { data: teamMembers, isLoading } = useQuery({
        queryKey: ['team', token],
        queryFn: async () => {
            const res = await client.get('/users/team/');
            return res.data;
        },
        enabled: !!token,
    });

    const getRoleName = (roleCode) => {
        const roles = {
            'MANAGER': 'Menecer',
            'ACCOUNTANT': 'Mühasib',
            'INVENTORY_MANAGER': 'Anbar Meneceri',
            'SALES_REP': 'Satış Təmsilçisi'
        };
        return roles[roleCode] || roleCode;
    };

    // Add team member mutation
    const addMutation = useMutation({
        mutationFn: (data) => client.post('/users/team/', data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['team', token]);
            showToast(`${getRoleName(variables.role)} uğurla komandaya əlavə edildi!`);
            setEmail('');
            setRole('SALES_REP');
            setIsSubmitting(false);
        },
        onError: (error) => {
            setIsSubmitting(false);
            const msg = error.response?.data?.detail || 'İşçini əlavə etmək mümkün olmadı.';
            showToast(msg, 'error');
        }
    });

    // Remove team member mutation
    const removeMutation = useMutation({
        mutationFn: (id) => client.delete(`/users/team/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['team', token]);
            showToast('İşçi komandadan silindi.');
        },
        onError: () => {
            showToast('Silmə əməliyyatı xəta ilə nəticələndi.', 'error');
        }
    });

    const handleAddMember = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setIsSubmitting(true);
        addMutation.mutate({ email, role });
    };

    const handleRemove = (id) => {
        if (window.confirm("Bu işçini komandadan silmək istədiyinizə əminsiniz?")) {
            removeMutation.mutate(id);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Məlumat yoxdur';
        const d = new Date(dateString);
        return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };


    const renderLocation = (lat, lng, updated) => {
        if (!lat || !lng) return <span className="text-gray-400 italic text-xs">Aktiv deyil</span>;

        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        return (
            <div className="flex flex-col">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-sm font-medium">
                    <MapPin size={14} /> Xəritədə bax
                </a>
                <span className="text-[10px] text-gray-500 mt-1">Sonlanma: {formatDate(updated)}</span>
            </div>
        );
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Add Member Form */}
            <div
                className="p-8 rounded-3xl space-y-6"
                style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-card-border)',
                    boxShadow: 'var(--color-card-shadow)'
                }}
            >
                <h3 className="font-black flex items-center gap-3 text-lg tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><UserPlus size={20} /></div>
                    Yeni İşçi Əlavə Et
                </h3>

                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            required
                            placeholder="işçinin.emaili@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 border-2 border-transparent focus:border-primary-blue rounded-xl p-3 outline-none transition-all font-bold"
                            style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-3 outline-none transition-all font-bold cursor-pointer"
                            style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                        >
                            <option value="MANAGER">Menecer</option>
                            <option value="ACCOUNTANT">Mühasib</option>
                            <option value="INVENTORY_MANAGER">Anbar Meneceri</option>
                            <option value="SALES_REP">Satış Təmsilçisi</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || addMutation.isPending}
                        className="bg-[var(--color-brand)] text-white px-8 py-3 rounded-xl font-bold hover:bg-[var(--color-brand-dark)] transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                        {isSubmitting ? 'Əlavə edilir...' : 'Dəvət Göndər'}
                    </button>
                </form>
                <p className="text-xs text-gray-500">Qeyd: İşçi əvvəlcə InvoiceAZ platformasında qeydiyyatdan keçmiş olmalıdır.</p>
            </div>

            {/* Team List */}
            <div
                className="p-8 rounded-3xl space-y-6"
                style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-card-border)',
                    boxShadow: 'var(--color-card-shadow)'
                }}
            >
                <h3 className="font-black flex items-center gap-3 text-lg tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Users size={20} /></div>
                    Komandam ({teamMembers?.length || 0})
                </h3>

                {isLoading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                ) : teamMembers?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Komandanızda hələ işçi yoxdur.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2" style={{ borderColor: 'var(--color-border)' }}>
                                    <th className="pb-3 text-xs font-black uppercase text-gray-500 tracking-wider">İşçi</th>
                                    <th className="pb-3 text-xs font-black uppercase text-gray-500 tracking-wider">Rol</th>
                                    <th className="pb-3 text-xs font-black uppercase text-gray-500 tracking-wider">Son Məkan (GPS)</th>
                                    <th className="pb-3 text-xs font-black uppercase text-gray-500 tracking-wider text-right">Əməliyyat</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {teamMembers.map((member) => (
                                        <motion.tr
                                            key={member.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="border-b last:border-0 hover:bg-gray-50/50 transition-colors"
                                            style={{ borderColor: 'var(--color-border)' }}
                                        >
                                            <td className="py-4">
                                                <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{member.user_name || 'Adsız İstifadəçi'}</div>
                                                <div className="text-xs text-gray-500">{member.user_email}</div>
                                            </td>
                                            <td className="py-4">
                                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-blue-100 text-blue-700">
                                                    {getRoleName(member.role)}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                {renderLocation(member.last_latitude, member.last_longitude, member.last_location_update)}
                                            </td>
                                            <td className="py-4 text-right">
                                                <button
                                                    onClick={() => handleRemove(member.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                                                    title="İşçini sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TeamSettings;
