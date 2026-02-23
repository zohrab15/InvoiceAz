import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config';
import {
    Bell,
    User,
    Settings,
    LogOut,
    Shield,
    CreditCard,
    BellRing,
    History,
    HelpCircle,
    ChevronDown,
    Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

const Header = ({ onMenuClick }) => {
    const { activeBusiness } = useBusiness();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', activeBusiness?.id],
        queryFn: async () => {
            const response = await client.get('/notifications/', {
                params: { business_id: activeBusiness?.id }
            });
            return response.data;
        },
        refetchInterval: 30000,
        enabled: !!user && !!activeBusiness?.id,
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Role-based filtering of notifications
    const getFilteredNotifications = () => {
        const rawRole = activeBusiness?.user_role;
        const role = (rawRole || 'OWNER').toUpperCase();

        return notifications.filter(notif => {
            // Restriction: SALES_REP and ACCOUNTANT should not see stock/inventory notifications
            if (role === 'SALES_REP' || role === 'ACCOUNTANT') {
                if (notif.category === 'inventory') return false;
            }
            return true;
        });
    };

    const filteredNotifications = getFilteredNotifications();
    const displayUnreadCount = filteredNotifications.filter(n => !n.is_read).length;

    const markAsReadMutation = useMutation({
        mutationFn: (id) => client.post(`/notifications/${id}/mark_as_read/`),
        onSuccess: () => queryClient.invalidateQueries(['notifications']),
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => client.post('/notifications/mark_all_as_read/'),
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            setIsNotifOpen(false);
        },
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const userDisplayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : (user?.name || 'İstifadəçi');

    const userAvatarUrl = user?.avatar
        ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`)
        : null;

    // Filter menu items by role
    const getFilteredMenuItems = () => {
        const rawRole = activeBusiness?.user_role;
        const role = (rawRole || 'OWNER').toUpperCase();

        const items = [
            { icon: <User size={18} />, label: 'Profilim', onClick: () => navigate('/settings?tab=user') },
            { icon: <Shield size={18} />, label: 'Təhlükəsizlik', onClick: () => navigate('/security') },
            { icon: <Settings size={18} />, label: 'Tənzimləmələr', onClick: () => navigate('/system-settings') },
            { icon: <CreditCard size={18} />, label: 'Abunəlik', onClick: () => navigate('/pricing'), privileged: true },
            { icon: <BellRing size={18} />, label: 'Bildiriş Tənzimləmələri', onClick: () => navigate('/system-settings') },
            { icon: <History size={18} />, label: 'Fəaliyyət Tarixçəsi', onClick: () => navigate('/notifications') },
            { icon: <HelpCircle size={18} />, label: 'Yardım və Dəstək', onClick: () => navigate('/help') },
            { icon: <LogOut size={18} />, label: 'Çıxış', onClick: logout, variant: 'danger' },
        ];

        if (role === 'OWNER' || role === 'MANAGER') return items;

        return items.filter(item => !item.privileged);
    };

    const menuItems = getFilteredMenuItems();

    return (
        <header
            className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-3 backdrop-blur-md lg:px-8"
            style={{
                backgroundColor: 'var(--color-header-bg)',
                borderBottom: '1px solid var(--color-header-border)'
            }}
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <Menu size={24} />
                </button>
                <h1
                    className="text-xl font-black tracking-tight hidden lg:block cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--color-brand)' }}
                    onClick={() => {
                        if (window.location.pathname === '/dashboard') window.location.reload();
                        else navigate('/dashboard');
                    }}
                >
                    InvoiceAZ
                </h1>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="relative p-2 rounded-xl transition-all"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <Bell size={22} />
                        {displayUnreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" style={{ border: '2px solid var(--color-page-bg)' }}></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {isNotifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-[-40px] sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 rounded-2xl shadow-2xl overflow-hidden"
                                style={{ backgroundColor: 'var(--color-dropdown-bg)', border: '1px solid var(--color-dropdown-border)' }}
                            >
                                <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-hover-bg)' }}>
                                    <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Bildirişlər</h3>
                                    {displayUnreadCount > 0 && (
                                        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-black">{displayUnreadCount} YENİ</span>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {filteredNotifications.length > 0 ? (
                                        filteredNotifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => {
                                                    if (!n.is_read) markAsReadMutation.mutate(n.id);
                                                    if (n.link) navigate(n.link);
                                                    setIsNotifOpen(false);
                                                }}
                                                className="p-4 cursor-pointer transition-colors"
                                                style={{
                                                    borderBottom: '1px solid var(--color-card-border)',
                                                    backgroundColor: !n.is_read ? 'var(--color-brand-light)' : 'transparent',
                                                }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-bold" style={{ color: n.type === 'error' || n.type === 'warning' ? '#ef4444' : 'var(--color-text-primary)' }}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                                        {(() => {
                                                            try {
                                                                const d = new Date(n.created_at);
                                                                if (isNaN(d.getTime())) return '---';
                                                                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                            } catch (e) {
                                                                return '---';
                                                            }
                                                        })()}
                                                    </span>
                                                </div>
                                                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{n.message}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <BellRing className="mx-auto mb-2" size={32} style={{ color: 'var(--color-text-muted)' }} />
                                            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Hələ ki bildiriş yoxdur</p>
                                        </div>
                                    )}
                                </div>
                                {displayUnreadCount > 0 && (
                                    <button
                                        onClick={() => markAllAsReadMutation.mutate()}
                                        className="w-full p-3 text-center text-xs font-bold transition-colors hover:bg-[var(--color-hover-bg)]"
                                        style={{ color: 'var(--color-brand)', borderTop: '1px solid var(--color-card-border)' }}
                                    >
                                        Hamısını oxunmuş kimi qeyd et
                                    </button>
                                )}
                                <button
                                    onClick={() => { navigate('/notifications'); setIsNotifOpen(false); }}
                                    className="w-full p-3 text-center text-xs font-bold transition-colors hover:bg-[var(--color-hover-bg)]"
                                    style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-card-border)' }}
                                >
                                    Hamısına bax
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1 pl-2 pr-2 rounded-2xl transition-all group"
                    >
                        <div className="hidden lg:block text-right">
                            <div className="text-sm font-bold leading-none" style={{ color: 'var(--color-text-primary)' }}>{userDisplayName}</div>
                            <div className="mt-1.5">
                                {user?.membership === 'pro' && (
                                    <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500 text-white rounded-full uppercase tracking-widest shadow-sm">Pro</span>
                                )}
                                {user?.membership === 'premium' && (
                                    <span className="text-[9px] font-black px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full uppercase tracking-widest shadow-sm">Premium</span>
                                )}
                                {(user?.membership === 'free' || !user?.membership) && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest" style={{ backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-card-border)' }}>Pulsuz</span>
                                )}
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center text-white font-black shadow-lg group-hover:scale-105 transition-transform overflow-hidden" style={{ boxShadow: `0 4px 15px var(--color-brand-shadow)` }}>
                            {userAvatarUrl ? (
                                <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (userDisplayName || 'A')[0].toUpperCase()
                            )}
                        </div>
                        <ChevronDown size={16} className={`transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-32px)] rounded-2xl shadow-2xl overflow-hidden"
                                style={{ backgroundColor: 'var(--color-dropdown-bg)', border: '1px solid var(--color-dropdown-border)' }}
                            >
                                <div className="lg:hidden p-4" style={{ borderBottom: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-hover-bg)' }}>
                                    <div className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{userDisplayName}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${user?.membership === 'pro' ? 'bg-blue-500 text-white' : (user?.membership === 'premium' ? 'bg-purple-500 text-white' : '')}`}
                                            style={(!user?.membership || user?.membership === 'free') ? { backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-text-muted)' } : {}}
                                        >
                                            {user?.membership === 'pro' ? 'Pro' : (user?.membership === 'premium' ? 'Premium' : 'Pulsuz')}
                                        </span>
                                        <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    {menuItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                item.onClick();
                                                setIsProfileOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors"
                                            style={{
                                                color: item.variant === 'danger' ? '#ef4444' : 'var(--color-text-secondary)',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = item.variant === 'danger' ? 'rgba(239,68,68,0.1)' : 'var(--color-hover-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;
