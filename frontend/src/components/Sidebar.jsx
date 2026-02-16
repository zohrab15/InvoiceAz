import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    Wallet,
    AlertTriangle,
    TrendingUp,
    Sparkles,
    Calculator,
    Check,
    Building2,
    ChevronDown
} from 'lucide-react';

import { useBusiness } from '../context/BusinessContext';
import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

const Sidebar = ({ isOpen, onClose }) => {
    const { activeBusiness, businesses, switchBusiness } = useBusiness();
    const [isBusinessMenuOpen, setIsBusinessMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const location = useLocation();

    // Close business menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsBusinessMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Ana səhifə' },
        { to: '/invoices', icon: <FileText size={20} />, label: 'Fakturalar' },
        { to: '/expenses', icon: <Wallet size={20} />, label: 'Xərclər' },
        { to: '/clients', icon: <Users size={20} />, label: 'Müştərilər' },
        { to: '/analytics/payments', icon: <TrendingUp size={20} />, label: 'Ödəniş Analitikası' },
        { to: '/analytics/issues', icon: <AlertTriangle size={20} />, label: 'Problemli Fakturalar' },
        { to: '/analytics/forecast', icon: <Sparkles size={20} />, label: 'Trend və Proqnoz' },
        { to: '/analytics/tax', icon: <Calculator size={20} />, label: 'Vergi və Hesabatlar' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed inset-y-0 left-0 w-64 bg-[var(--color-sidebar-bg)] border-r border-[var(--color-sidebar-border)] h-screen flex flex-col z-50 
                transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 border-b relative" ref={menuRef}>
                    <button
                        onClick={() => setIsBusinessMenuOpen(!isBusinessMenuOpen)}
                        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors group"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-[var(--color-brand-light)] rounded-lg flex items-center justify-center text-[var(--color-brand)] flex-shrink-0 overflow-hidden">
                                {activeBusiness?.logo ? (
                                    <img
                                        src={activeBusiness.logo.startsWith('http') ? activeBusiness.logo : `http://localhost:8000${activeBusiness.logo}`}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Building2 size={24} />
                                )}
                            </div>
                            <div className="text-left overflow-hidden">
                                <div className="font-bold text-[var(--color-sidebar-text)] opacity-90 truncate text-sm">
                                    {activeBusiness ? activeBusiness.name : 'Biznes Seçin'}
                                </div>
                                <div className="text-[10px] uppercase font-black tracking-wider text-[var(--color-sidebar-text)] opacity-50">
                                    {activeBusiness ? 'Aktiv Profil' : '---'}
                                </div>
                            </div>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isBusinessMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isBusinessMenuOpen && (
                        <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100]">
                            <div className="p-2 max-h-64 overflow-y-auto space-y-1">
                                {businesses?.map(business => (
                                    <button
                                        key={business.id}
                                        onClick={() => {
                                            switchBusiness(business);
                                            setIsBusinessMenuOpen(false);
                                            if (window.innerWidth < 1024) onClose();
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors ${activeBusiness?.id === business.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <span className="truncate">{business.name}</span>
                                        {activeBusiness?.id === business.id && <Check size={14} />}
                                    </button>
                                ))}

                                <div className="h-px bg-gray-100 my-1"></div>

                                <NavLink
                                    to="/settings"
                                    onClick={() => {
                                        setIsBusinessMenuOpen(false);
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                    className="w-full flex items-center justify-center p-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 uppercase tracking-wider"
                                >
                                    + Yeni Biznes
                                </NavLink>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => {
                                if (window.innerWidth < 1024) onClose();
                            }}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 p-3 rounded-lg transition-colors font-medium text-sm ${isActive
                                    ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)] shadow-lg shadow-[var(--color-brand-shadow)]'
                                    : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand-dark)]'
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
