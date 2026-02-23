import React from 'react';
import { NavLink } from 'react-router-dom';
import { API_URL } from '../config';
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
    ChevronDown,
    Lock,
    Package,
    BarChart3,
    LifeBuoy,
    Settings
} from 'lucide-react';

import { useBusiness } from '../context/BusinessContext';
import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import usePlanLimits from '../hooks/usePlanLimits';

const Sidebar = ({ isOpen, onClose }) => {
    const { activeBusiness, businesses, switchBusiness } = useBusiness();
    const [isBusinessMenuOpen, setIsBusinessMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const location = useLocation();
    const { isFeatureLocked } = usePlanLimits();

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
        { to: '/products', icon: <Package size={20} />, label: 'Məhsullar' },
        { to: '/expenses', icon: <Wallet size={20} />, label: 'Xərclər' },
        { to: '/clients', icon: <Users size={20} />, label: 'Müştərilər' },
        { to: '/analytics/payments', icon: <TrendingUp size={20} />, label: 'Ödəniş Analitikası' },
        { to: '/analytics/products', icon: <BarChart3 size={20} />, label: 'Məhsul Analitikası' },
        { to: '/analytics/issues', icon: <AlertTriangle size={20} />, label: 'Problemli Fakturalar' },
        { to: '/analytics/forecast', icon: <Sparkles size={20} />, label: 'Trend və Proqnoz', locked: isFeatureLocked('forecast_analytics') },
        { to: '/analytics/tax', icon: <Calculator size={20} />, label: 'Vergi və Hesabatlar' },
        { to: '/system-settings', icon: <Settings size={20} />, label: 'Tənzimləmələr' },
        { to: '/help', icon: <LifeBuoy size={20} />, label: 'Kömək və Dəstək' },
    ];

    const getFilteredNavItems = () => {
        const rawRole = activeBusiness?.user_role;
        const role = String(rawRole || 'OWNER').trim().toUpperCase();

        // Only Owners and Managers get full access
        if (role === 'OWNER' || role === 'MANAGER') return navItems;

        // Default: filter strictly for known roles
        return navItems.filter(item => {
            if (role === 'ACCOUNTANT') {
                return ['Ana səhifə', 'Fakturalar', 'Məhsullar', 'Xərclər', 'Müştərilər', 'Ödəniş Analitikası', 'Məhsul Analitikası', 'Problemli Fakturalar', 'Vergi və Hesabatlar', 'Kömək və Dəstək'].includes(item.label);
            }
            if (role === 'INVENTORY_MANAGER') {
                return ['Ana səhifə', 'Məhsullar', 'Məhsul Analitikası', 'Tənzimləmələr', 'Kömək və Dəstək'].includes(item.label);
            }
            // SALES_REP or any other unrecognized role gets minimum access
            if (role === 'SALES_REP') {
                return ['Ana səhifə', 'Fakturalar', 'Məhsullar', 'Müştərilər', 'Tənzimləmələr', 'Kömək və Dəstək'].includes(item.label);
            }
            return false;
        });
    };

    const filteredNavItems = getFilteredNavItems();
    const roleForFlags = (activeBusiness?.user_role || 'OWNER').toUpperCase();
    const isOwnerOrManager = ['OWNER', 'MANAGER'].includes(roleForFlags);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div
                className={`
                    fixed inset-y-0 left-0 w-64 h-screen flex flex-col z-50 
                    transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{
                    backgroundColor: 'var(--color-sidebar-bg)',
                    borderRight: '1px solid var(--color-sidebar-border)',
                }}
            >
                <div className="p-4 relative" style={{ borderBottom: '1px solid var(--color-sidebar-border)' }} ref={menuRef}>
                    <button
                        onClick={() => setIsBusinessMenuOpen(!isBusinessMenuOpen)}
                        className="w-full flex items-center justify-between p-2 rounded-xl transition-colors group"
                        style={{ '--tw-bg-opacity': 1 }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-hover-bg)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                                style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}
                            >
                                {activeBusiness?.logo ? (
                                    <img
                                        src={activeBusiness.logo.startsWith('http') ? activeBusiness.logo : `${API_URL}${activeBusiness.logo}`}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Building2 size={24} />
                                )}
                            </div>
                            <div className="text-left overflow-hidden">
                                <div className="font-bold truncate text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                    {activeBusiness ? activeBusiness.name : 'Biznes Seçin'}
                                </div>
                                <div className="text-[10px] uppercase font-black tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                                    {activeBusiness ? (activeBusiness.user_role === 'OWNER' ? 'Aktiv Profil' : ({
                                        'MANAGER': 'Menecer',
                                        'ACCOUNTANT': 'Mühasib',
                                        'INVENTORY_MANAGER': 'Anbar Meneceri',
                                        'SALES_REP': 'Satış Təmsilçisi',
                                    }[activeBusiness.user_role] || activeBusiness.user_role)) : '---'}
                                </div>
                            </div>
                        </div>
                        <ChevronDown size={16} className={`transition-transform ${isBusinessMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
                    </button>

                    {/* Dropdown Menu */}
                    {isBusinessMenuOpen && (
                        <div
                            className="absolute top-full left-4 right-4 mt-2 rounded-xl shadow-2xl overflow-hidden z-[100]"
                            style={{ backgroundColor: 'var(--color-dropdown-bg)', border: '1px solid var(--color-dropdown-border)' }}
                        >
                            <div className="p-2 max-h-64 overflow-y-auto space-y-1">
                                {businesses?.map(business => (
                                    <button
                                        key={business.id}
                                        onClick={() => {
                                            switchBusiness(business);
                                            setIsBusinessMenuOpen(false);
                                            if (window.innerWidth < 1024) onClose();
                                        }}
                                        className="w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors"
                                        style={{
                                            color: activeBusiness?.id === business.id ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                                            backgroundColor: activeBusiness?.id === business.id ? 'var(--color-brand-light)' : 'transparent',
                                        }}
                                    >
                                        <span className="truncate">{business.name}</span>
                                        {activeBusiness?.id === business.id && <Check size={14} />}
                                    </button>
                                ))}

                                {isOwnerOrManager && (
                                    <>
                                        <div style={{ height: '1px', backgroundColor: 'var(--color-card-border)', margin: '4px 0' }} />

                                        <NavLink
                                            to="/settings"
                                            onClick={() => {
                                                setIsBusinessMenuOpen(false);
                                                if (window.innerWidth < 1024) onClose();
                                            }}
                                            className="w-full flex items-center justify-center p-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                            style={{ color: 'var(--color-text-muted)' }}
                                        >
                                            + Yeni Biznes
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={(e) => {
                                if (window.innerWidth < 1024) onClose();
                                // Optional: Prevent navigation if locked? For now let them see the locked page
                                // if (item.locked) e.preventDefault(); 
                            }}
                            className={({ isActive }) =>
                                `flex items-center justify-between p-3 rounded-xl transition-all font-medium text-sm ${isActive ? 'shadow-lg' : ''} ${item.locked ? 'opacity-70' : ''}`
                            }
                            style={({ isActive }) => ({
                                backgroundColor: isActive ? 'var(--color-sidebar-active-bg)' : 'transparent',
                                color: isActive ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-text)',
                                boxShadow: isActive ? `0 4px 15px var(--color-brand-shadow)` : 'none',
                            })}
                        >
                            <div className="flex items-center space-x-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            {item.locked && <Lock size={14} className="text-gray-400" />}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
