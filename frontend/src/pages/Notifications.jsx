import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, Check, CheckCheck, Trash2, Filter, Clock, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';

const typeConfig = {
    info: { icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Məlumat' },
    success: { icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Uğurlu' },
    warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Xəbərdarlıq' },
    error: { icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Xəta' },
};

const Notifications = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all'); // all, unread, read

    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await client.get('/notifications/');
            return response.data;
        },
    });

    const notifications = notificationsData?.results || (Array.isArray(notificationsData) ? notificationsData : []);

    const markAsReadMutation = useMutation({
        mutationFn: (id) => client.post(`/notifications/${id}/mark_as_read/`),
        onSuccess: () => queryClient.invalidateQueries(['notifications']),
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => client.post('/notifications/mark_all_as_read/'),
        onSuccess: () => queryClient.invalidateQueries(['notifications']),
    });

    const { activeBusiness } = useBusiness();
    const rawRole = activeBusiness?.user_role;
    const role = (rawRole || 'OWNER').toUpperCase();

    const roleFiltered = notifications.filter(n => {
        if (role === 'SALES_REP' || role === 'ACCOUNTANT') {
            if (n.category === 'inventory') return false;
            // Fallback for legacy notifications
            if (n.title && n.title.toLowerCase().includes('stok')) return false;
        }
        return true;
    });

    const filteredNotifications = roleFiltered.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    const unreadCount = roleFiltered.filter(n => !n.is_read).length;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'İndicə';
        if (diffMins < 60) return `${diffMins} dəq əvvəl`;
        if (diffHours < 24) return `${diffHours} saat əvvəl`;
        if (diffDays < 7) return `${diffDays} gün əvvəl`;
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const groupByDate = (notifs) => {
        const groups = {};
        notifs.forEach(n => {
            const date = new Date(n.created_at);
            const now = new Date();
            const diffDays = Math.floor((now - date) / 86400000);

            let key;
            if (diffDays === 0) key = 'Bu gün';
            else if (diffDays === 1) key = 'Dünən';
            else if (diffDays < 7) key = 'Bu həftə';
            else if (diffDays < 30) key = 'Bu ay';
            else key = 'Daha əvvəl';

            if (!groups[key]) groups[key] = [];
            groups[key].push(n);
        });
        return groups;
    };

    const grouped = groupByDate(filteredNotifications);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 pb-12 px-4"
        >
            {/* Header */}
            <div className="p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
            >
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                            <Bell size={28} />
                        </div>
                        Bildirişlər
                    </h2>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {unreadCount > 0 ? `${unreadCount} oxunmamış bildiriş` : 'Bütün bildirişlər oxunub'}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}
                    >
                        <CheckCheck size={16} />
                        Hamısını oxunmuş et
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 px-1">
                {[
                    { id: 'all', label: 'Hamısı', count: roleFiltered.length },
                    { id: 'unread', label: 'Oxunmamış', count: unreadCount },
                    { id: 'read', label: 'Oxunmuş', count: roleFiltered.length - unreadCount },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                        style={{
                            backgroundColor: filter === tab.id ? 'var(--color-brand)' : 'var(--color-card-bg)',
                            color: filter === tab.id ? 'white' : 'var(--color-text-muted)',
                            border: `1px solid ${filter === tab.id ? 'var(--color-brand)' : 'var(--color-card-border)'}`,
                        }}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {isLoading ? (
                <div className="p-12 rounded-3xl text-center" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                    <div className="w-10 h-10 border-4 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm mt-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>Yüklənir...</p>
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="p-12 rounded-3xl text-center" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                    <BellRing className="mx-auto mb-3" size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {filter === 'unread' ? 'Oxunmamış bildiriş yoxdur' : 'Hələ ki bildiriş yoxdur'}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([dateLabel, notifs]) => (
                        <div key={dateLabel}>
                            <div className="flex items-center gap-3 mb-3 px-1">
                                <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                    {dateLabel}
                                </span>
                                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-card-border)' }} />
                            </div>

                            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                                <AnimatePresence>
                                    {notifs.map((n, idx) => {
                                        const config = typeConfig[n.type] || typeConfig.info;
                                        const Icon = config.icon;

                                        return (
                                            <motion.div
                                                key={n.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                onClick={() => {
                                                    if (!n.is_read) markAsReadMutation.mutate(n.id);
                                                    if (n.link) navigate(n.link);
                                                }}
                                                className="flex items-start gap-4 p-4 cursor-pointer transition-colors"
                                                style={{
                                                    borderBottom: idx < notifs.length - 1 ? '1px solid var(--color-card-border)' : 'none',
                                                    backgroundColor: !n.is_read ? 'var(--color-brand-light)' : 'transparent',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-hover-bg)'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = !n.is_read ? 'var(--color-brand-light)' : 'transparent'}
                                            >
                                                {/* Icon */}
                                                <div className="p-2 rounded-xl shrink-0 mt-0.5" style={{ backgroundColor: config.bg }}>
                                                    <Icon size={18} style={{ color: config.color }} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                                                            {n.title}
                                                        </h4>
                                                        <span className="text-[10px] font-medium shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                                                            {formatDate(n.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {n.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                                                            style={{ backgroundColor: config.bg, color: config.color }}
                                                        >
                                                            {config.label}
                                                        </span>
                                                        {!n.is_read && (
                                                            <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mark as read button */}
                                                {!n.is_read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsReadMutation.mutate(n.id);
                                                        }}
                                                        className="p-1.5 rounded-lg shrink-0 transition-colors hover:bg-[var(--color-hover-bg)]"
                                                        style={{ color: 'var(--color-text-muted)' }}
                                                        title="Oxunmuş kimi qeyd et"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default Notifications;
