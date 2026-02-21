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

    // Add team member mutation
    const addMutation = useMutation({
        mutationFn: (newMemberEmail) => client.post('/users/team/', { email: newMemberEmail }),
        onSuccess: () => {
            queryClient.invalidateQueries(['team', token]);
            showToast('İşçi uğurla komandaya əlavə edildi!');
            setEmail('');
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
        addMutation.mutate(email);
    };

    const handleRemove = (id) => {
        if (window.confirm("Bu işçini komandadan silmək istədiyinizə əminsiniz?")) {
            removeMutation.mutate(id);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Məlumat yoxdur';
        return new Date(dateString).toLocaleString('az-AZ', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
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

    if (user?.membership !== 'Premium') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl space-y-6 text-center"
                style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-card-border)',
                }}
            >
                <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>Premium Xüsusiyyət</h3>
                <p style={{ color: 'var(--color-text-secondary)' }} className="max-w-md mx-auto">
                    Komanda idarəetməsi və Satış Təmsilçilərinin GPS izlənməsi yalnız Premium planda mövcuddur.
                </p>
                <button
                    className="px-6 py-3 rounded-xl bg-[var(--color-brand)] text-white font-bold disabled:opacity-50 mt-4 cursor-not-allowed"
                    disabled
                >
                    Planı Yüksəlt (Tezliklə)
                </button>
            </motion.div>
        );
    }

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
                                                    {member.role === 'SALES_REP' ? 'Satış Təmsilçisi' : member.role}
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
