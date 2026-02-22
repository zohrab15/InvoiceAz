import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import useAuthStore from '../../store/useAuthStore';
import { useToast } from '../Toast';
import { Trash2, UserPlus, Mail, Users, MapPin, AlertCircle, Search, Clock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamSettings = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { token, user } = useAuthStore();
    const showToast = useToast();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('SALES_REP');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch team members
    const { data: teamMembers, isLoading } = useQuery({
        queryKey: ['team', token],
        queryFn: async () => {
            const res = await client.get('/users/team/');
            return res.data;
        },
        enabled: !!token,
    });

    // Fetch pending invitations
    const { data: invitations, isLoading: isInvitesLoading } = useQuery({
        queryKey: ['invitations', token],
        queryFn: async () => {
            const res = await client.get('/users/invitations/');
            return res.data;
        },
        enabled: !!token,
    });

    // Fetch plan status
    const { data: planStatus } = useQuery({
        queryKey: ['plan_status', token],
        queryFn: async () => {
            const res = await client.get('/users/plan/status/');
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
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries(['team', token]);
            queryClient.invalidateQueries(['invitations', token]);

            if (res.status === 202) {
                showToast(`İstifadəçi tapılmadı, lakin ${variables.email} ünvanına dəvət göndərildi!`);
            } else {
                showToast(`${getRoleName(variables.role)} uğurla komandaya əlavə edildi!`);
            }

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

    // Cancel invitation mutation
    const cancelInviteMutation = useMutation({
        mutationFn: (id) => client.delete(`/users/invitations/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries(['invitations', token]);
            showToast('Dəvət ləğv edildi.');
        },
        onError: () => {
            showToast('Dəvəti ləğv etmək mümkün olmadı.', 'error');
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


    const renderLocation = (role, lat, lng, updated) => {
        if (role !== 'SALES_REP') {
            return <span className="text-gray-400 italic text-xs">İzlənmir</span>;
        }
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


    const filteredMembers = teamMembers?.filter(member => {
        const search = searchTerm.toLowerCase();
        return (
            member.user_name?.toLowerCase().includes(search) ||
            member.user_email?.toLowerCase().includes(search)
        );
    }) || [];

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

                {planStatus?.limits?.team_members !== null && (
                    <div className="relative overflow-hidden p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
                        style={{
                            background: planStatus?.limits?.team_members > 0
                                ? 'rgba(59, 130, 246, 0.05)'
                                : 'rgba(245, 158, 11, 0.05)',
                            border: planStatus?.limits?.team_members > 0
                                ? '1px solid rgba(59, 130, 246, 0.1)'
                                : '1px solid rgba(245, 158, 11, 0.2)',
                        }}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${planStatus?.limits?.team_members > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                                    Plan Limitləri
                                </h4>
                                <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                    Cari istifadə: <span style={{ color: 'var(--color-text-primary)' }}>{planStatus?.usage?.team_members_total || (filteredMembers.length + (invitations?.length || 0))}</span> / <span style={{ color: 'var(--color-text-primary)' }}>{planStatus?.limits?.team_members}</span> komanda üzvü
                                    {planStatus?.limits?.team_members === 0 && (
                                        <span className="ml-1 text-amber-600 block sm:inline">
                                            (Yalnız <b>Premium</b> paketdə komanda üzvü əlavə edilə bilər)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {planStatus?.limits?.team_members === 0 && (
                            <button
                                onClick={() => navigate('/pricing')}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 whitespace-nowrap"
                            >
                                Planı Yüksəlt
                            </button>
                        )}
                    </div>
                )}

                <p className="text-xs text-gray-500">Qeyd: İşçi qeydiyyatdan keçməyibsə, qeydiyyatdan keçdikdən sonra avtomatik komandaya əlavə olunacaq.</p>
            </div>

            {/* Pending Invitations */}
            {invitations?.length > 0 && (
                <div
                    className="p-8 rounded-3xl space-y-6"
                    style={{
                        backgroundColor: 'var(--color-card-bg)',
                        border: '1px solid var(--color-card-border)',
                        boxShadow: 'var(--color-card-shadow)'
                    }}
                >
                    <h3 className="font-black flex items-center gap-3 text-lg tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><Clock size={20} /></div>
                        Gözləyən Dəvətlər ({invitations.length})
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2" style={{ borderColor: 'var(--color-border)' }}>
                                    <th className="pb-3 text-xs font-black uppercase text-gray-500 tracking-wider">E-poçt</th>
                                    <th className="pb-3 text-xs font-black uppercase text-gray-500 tracking-wider">Rol</th>
                                    <th className="pb-3 text-xs font-black uppercase text-gray-500 tracking-wider">Tarix</th>
                                    <th className="pb-3 text-xs font-black uppercase text-gray-500 tracking-wider text-right">Əməliyyat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations.map((invite) => (
                                    <tr key={invite.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                                        <td className="py-4 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{invite.email}</td>
                                        <td className="py-4">
                                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-orange-100 text-orange-700">
                                                {getRoleName(invite.role)}
                                            </span>
                                        </td>
                                        <td className="py-4 text-xs text-gray-500">{formatDate(invite.created_at)}</td>
                                        <td className="py-4 text-right">
                                            <button
                                                onClick={() => cancelInviteMutation.mutate(invite.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                                                title="Dəvəti ləğv et"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Team List */}
            <div
                className="p-8 rounded-3xl space-y-6"
                style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-card-border)',
                    boxShadow: 'var(--color-card-shadow)'
                }}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="font-black flex items-center gap-3 text-lg tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Users size={20} /></div>
                        Komandam ({filteredMembers?.length || 0})
                    </h3>

                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Ad və ya email axtar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 border-2 border-transparent focus:border-primary-blue rounded-xl py-2 px-3 outline-none transition-all text-sm font-bold"
                            style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {searchTerm && filteredMembers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Search size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-medium">"{searchTerm}" üçün nəticə tapılmadı.</p>
                            </div>
                        ) : (
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
                                        {filteredMembers.map((member) => (
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
                                                    {renderLocation(member.role, member.last_latitude, member.last_longitude, member.last_location_update)}
                                                </td>
                                                <td className="py-4 text-right">
                                                    {member.user_email !== user?.email && (
                                                        <button
                                                            onClick={() => handleRemove(member.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                                                            title="İşçini sil"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TeamSettings;
