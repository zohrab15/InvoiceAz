import React, { useState, useRef, useEffect } from 'react';
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

const Header = ({ onMenuClick }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch Notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await client.get('/notifications/');
            return response.data;
        },
        refetchInterval: 30000, // Poll every 30s
        enabled: !!user,
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsReadMutation = useMutation({
        mutationFn: (id) => client.post(`/notifications/${id}/read/`),
        onSuccess: () => queryClient.invalidateQueries(['notifications']),
    });

    // Close on click outside
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
        ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:8000${user.avatar}`)
        : null;

    const menuItems = [
        { icon: <User size={18} />, label: 'Profilim', onClick: () => navigate('/settings?tab=user') },
        { icon: <Shield size={18} />, label: 'Təhlükəsizlik', onClick: () => navigate('/security') },
        { icon: <Settings size={18} />, label: 'Tənzimləmələr', onClick: () => navigate('/system-settings') },
        { icon: <CreditCard size={18} />, label: 'Abunəlik', onClick: () => { } },
        { icon: <BellRing size={18} />, label: 'Bildiriş Tənzimləmələri', onClick: () => { } },
        { icon: <History size={18} />, label: 'Fəaliyyət Tarixçəsi', onClick: () => { } },
        { icon: <HelpCircle size={18} />, label: 'Yardım və Dəstək', onClick: () => { } },
        { icon: <LogOut size={18} />, label: 'Çıxış', onClick: logout, variant: 'danger' },
    ];

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md lg:px-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <User size={24} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-black text-[var(--color-brand)] tracking-tight hidden lg:block">InvoiceAZ</h1>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="relative p-2 text-gray-400 hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] rounded-xl transition-all"
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {isNotifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                            >
                                <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">Bildirişlər</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black">{unreadCount} YENİ</span>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => {
                                                    if (!n.is_read) markAsReadMutation.mutate(n.id);
                                                    if (n.link) navigate(n.link);
                                                    setIsNotifOpen(false);
                                                }}
                                                className={`p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`text-sm font-bold ${n.type === 'error' || n.type === 'warning' ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <BellRing className="mx-auto text-gray-200 mb-2" size={32} />
                                            <p className="text-xs text-gray-400 font-medium">Hələ ki bildiriş yoxdur</p>
                                        </div>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <button className="w-full p-3 text-center text-xs font-bold text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] transition-colors">
                                        Hamısına bax
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1 pl-2 pr-2 hover:bg-gray-50 rounded-2xl transition-all group"
                    >
                        <div className="hidden lg:block text-right">
                            <div className="text-sm font-bold text-gray-900 leading-none">{userDisplayName}</div>
                            <div className="mt-1.5">
                                {user?.membership === 'pro' && (
                                    <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500 text-white rounded-full uppercase tracking-widest shadow-sm shadow-blue-200">Pro</span>
                                )}
                                {user?.membership === 'premium' && (
                                    <span className="text-[9px] font-black px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full uppercase tracking-widest shadow-sm shadow-purple-200">Premium</span>
                                )}
                                {(user?.membership === 'free' || !user?.membership) && (
                                    <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase tracking-widest border border-gray-200">Pulsuz</span>
                                )}
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center text-white font-black shadow-lg shadow-[var(--color-brand-shadow)] group-hover:scale-105 transition-transform overflow-hidden">
                            {userAvatarUrl ? (
                                <img src={userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (userDisplayName || 'A')[0].toUpperCase()
                            )}
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                            >
                                <div className="lg:hidden p-4 border-b bg-gray-50/50">
                                    <div className="font-bold text-gray-900">{userDisplayName}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${user?.membership === 'pro' ? 'bg-blue-500 text-white' : (user?.membership === 'premium' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500')
                                            }`}>
                                            {user?.membership === 'pro' ? 'Pro' : (user?.membership === 'premium' ? 'Premium' : 'Pulsuz')}
                                        </span>
                                        <div className="text-xs text-gray-400 truncate">{user?.email}</div>
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
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${item.variant === 'danger'
                                                ? 'text-red-600 hover:bg-red-50'
                                                : 'text-gray-600 hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand-dark)]'
                                                }`}
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
