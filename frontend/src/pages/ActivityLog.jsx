import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    History,
    FileText,
    Users,
    Package,
    Settings,
    Shield,
    CreditCard,
    MoreHorizontal,
    Search,
    Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { useBusiness } from '../context/BusinessContext';

const getModuleIcon = (module) => {
    switch (module) {
        case 'INVOICE': return <FileText size={16} className="text-blue-500" />;
        case 'PAYMENT': return <CreditCard size={16} className="text-green-500" />;
        case 'CLIENT': return <Users size={16} className="text-purple-500" />;
        case 'PRODUCT': return <Package size={16} className="text-orange-500" />;
        case 'EXPENSE': return <CreditCard size={16} className="text-red-500" />;
        case 'AUTH': return <Shield size={16} className="text-gray-500" />;
        case 'SETTINGS': return <Settings size={16} className="text-indigo-500" />;
        default: return <MoreHorizontal size={16} className="text-gray-400" />;
    }
};

const getActionColor = (action) => {
    switch (action) {
        case 'CREATE': return 'bg-green-500/10 text-green-600 border-green-500/20';
        case 'UPDATE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        case 'DELETE': return 'bg-red-500/10 text-red-600 border-red-500/20';
        case 'LOGIN': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
        case 'EXPORT': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
        default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
};

const mapRole = (role) => {
    if (!role) return '';
    const map = {
        'OWNER': 'Sahib',
        'MANAGER': 'Menecer',
        'ACCOUNTANT': 'Mühasib',
        'INVENTORY_MANAGER': 'Anbar Meneceri',
        'SALES_REP': 'Satış Təmsilçisi'
    };
    return map[role.toUpperCase()] || role.replace('_', ' ');
};

const ActivityLog = () => {
    const { activeBusiness } = useBusiness();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['activity-logs', activeBusiness?.id],
        queryFn: async () => {
            const resp = await client.get('/notifications/activity-logs/', {
                params: { business_id: activeBusiness?.id }
            });
            return resp.data;
        },
        enabled: !!activeBusiness?.id,
    });

    const filteredLogs = logs.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6 pb-12 px-4"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                <div>
                    <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Fəaliyyət Tarixçəsi</h2>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Sistemdə baş verən bütün əməliyyatların audit siyahısı
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Tarixçədə axtar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-[var(--color-brand)]"
                        style={{
                            backgroundColor: 'var(--color-page-bg)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-card-border)',
                        }}
                    />
                </div>
            </div>

            <div className="p-2 sm:p-8 rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand)]"></div>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-20">
                        <History size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--color-text-primary)' }} />
                        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Qeyd tapılmadı</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Bu biznes üçün heç bir fəaliyyət tarixçəsi yoxdur.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 ml-4 md:ml-6 mt-4 mb-4" style={{ borderColor: 'var(--color-card-border)' }}>
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="mb-8 ml-6 group">
                                <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-[17px] ring-4"
                                    style={{ backgroundColor: 'var(--color-page-bg)', ringColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                                    {getModuleIcon(log.module)}
                                </span>

                                <div className="p-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                                    style={{ backgroundColor: 'var(--color-hover-bg)', border: '1px solid var(--color-card-border)' }}>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                                {log.user_name}
                                            </span>
                                            {log.user_role && (
                                                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                                                    {mapRole(log.user_role)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                                            {new Date(log.created_at).toLocaleString('az-AZ', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <h4 className="text-sm font-medium leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                        {log.description}
                                    </h4>

                                    <div className="mt-3 flex gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${getActionColor(log.action)}`}>
                                            {log.action_display}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                                            style={{ backgroundColor: 'var(--color-page-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-card-border)' }}>
                                            Modul: {log.module_display}
                                        </span>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ActivityLog;
