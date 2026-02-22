import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../context/BusinessContext';
import client from '../api/client';
import { useToast } from '../components/Toast';
import { Save, Building2, Landmark, Check, Plus, User, Shield, Trash2, AlertTriangle, Users, Gift } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import UserSettings from '../components/settings/UserSettings';
import TeamSettings from '../components/settings/TeamSettings';
import PhoneInput from '../components/common/PhoneInput';
import { useLocation } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import usePlanLimits from '../hooks/usePlanLimits';
import useAuthStore from '../store/useAuthStore';
import ReferralTab from '../components/ReferralTab';
import { Lock, FileText } from 'lucide-react';

const BusinessSettings = () => {
    const queryClient = useQueryClient();
    const { token, user } = useAuthStore();
    const showToast = useToast();
    const { switchBusiness, refetchBusinesses } = useBusiness();
    const location = useLocation();
    const [upgradeConfig, setUpgradeConfig] = useState({ isOpen: false, title: '', message: '' });
    const { theme: currentTheme } = useTheme();
    const { checkLimit, canUseThemes } = usePlanLimits();

    const [activeTab, setActiveTab] = useState('user'); // 'user', 'business'
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Sync active tab with search params
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get('tab');
        if (tab && ['user', 'business', 'referral'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location]);

    const initialFormState = {
        name: '',
        voen: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        website: '',
        bank_name: '',
        iban: '',
        swift: '',
        default_invoice_theme: 'modern',
    };
    const [formData, setFormData] = useState(initialFormState);

    const { data: businesses, isLoading } = useQuery({
        queryKey: ['business', token],
        queryFn: async () => {
            const res = await client.get('/users/business/');
            return res.data;
        },
        enabled: !!token,
    });

    useEffect(() => {
        if (businesses && businesses.length > 0 && !selectedBusiness && !isCreating) {
            setSelectedBusiness(businesses[0]);
            setFormData(businesses[0]);
        }
    }, [businesses, selectedBusiness, isCreating]);

    const handleNewBusiness = () => {
        const check = checkLimit('businesses');
        if (!check.allowed) {
            setUpgradeConfig({
                isOpen: true,
                title: 'Limitə çatdınız! 🚀',
                message: `Hazırkı planınızda maksimum ${check.limit} Biznes Profili yarada bilərsiniz. Limitsiz imkanlar üçün Pro plana keçin.`
            });
            return;
        }
        setIsCreating(true);
        setSelectedBusiness(null);
        setFormData(initialFormState);
        setLogoPreview(null);
        setLogoFile(null);
    };

    const handleSelectBusiness = (business) => {
        setIsCreating(false);
        setSelectedBusiness(business);
        setFormData(business);
        setLogoPreview(business.logo);
        setLogoFile(null);
    };


    const mutation = useMutation({
        mutationFn: (data) => {
            const fd = new FormData();

            // Append all fields to FormData
            Object.keys(data).forEach(key => {
                if (key === 'logo' || key === 'user') return; // Handled separately or read-only
                if (data[key] !== null && data[key] !== undefined) {
                    fd.append(key, data[key]);
                }
            });

            if (logoFile) {
                fd.append('logo', logoFile);
            }

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (!data.id) {
                return client.post('/users/business/', fd, config);
            }
            return client.patch(`/users/business/${data.id}/`, fd, config);
        },
        onSuccess: async (response) => {
            const savedBusiness = response.data;

            // 1. Invalidate and refetch immediately to sync everything
            await queryClient.invalidateQueries(['business', token]);
            await refetchBusinesses();

            showToast('Məlumatlar uğurla yadda saxlanıldı!');

            // 2. Update local state to show the new data immediately
            setIsCreating(false);
            setSelectedBusiness(savedBusiness);
            setFormData(savedBusiness);
            switchBusiness(savedBusiness);

            setLogoFile(null);
        },
        onError: (error) => {
            console.error('Business save error:', error);
            const rawError = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            showToast(`Xəta Detalı: ${rawError}`, 'error');
        }
    });


    const deleteMutation = useMutation({
        mutationFn: (id) => client.delete(`/users/business/${id}/`),
        onSuccess: async () => {
            await queryClient.invalidateQueries(['business', token]);
            await refetchBusinesses();
            showToast('Biznes uğurla silindi.');
            setShowDeleteConfirm(false);
            setSelectedBusiness(null);
            setFormData(initialFormState);
            setIsCreating(false);
        },
        onError: (error) => {
            console.error('Business delete error:', error);
            showToast('Biznesi silmək mümkün olmadı.', 'error');
        }
    });

    const handleDeleteBusiness = () => {
        if (selectedBusiness?.id) {
            deleteMutation.mutate(selectedBusiness.id);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const isBusinessLoading = isLoading;

    const rawRole = selectedBusiness?.user_role || 'OWNER';
    const isRestricted = rawRole === 'SALES_REP' || rawRole === 'INVENTORY_MANAGER' || rawRole === 'ACCOUNTANT';

    const tabs = [
        { id: 'user', name: 'Şəxsi Hesab', icon: <User size={18} /> },
        ...(!isRestricted ? [
            { id: 'business', name: 'Biznes Profilləri', icon: <Building2 size={18} /> },
            { id: 'team', name: 'Komanda', icon: <Users size={18} /> },
        ] : []),
        { id: 'referral', name: 'Referral', icon: <Gift size={18} /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 pb-12 px-4"
        >
            <div
                className="p-6 rounded-3xl sticky top-4 z-20"
                style={{
                    backgroundColor: 'var(--color-card-bg)',
                    border: '1px solid var(--color-card-border)',
                    boxShadow: 'var(--color-card-shadow)'
                }}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Hesab və Biznes</h2>
                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            Hesab və biznes tənzimləmələrini idarə edin
                        </p>
                    </div>

                    <div className="flex p-1.5 rounded-2xl" style={{ backgroundColor: 'var(--color-hover-bg)', border: '1px solid var(--color-card-border)' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'shadow-sm ring-1 ring-black/[0.05]'
                                    : ''
                                    }`}
                                style={{
                                    backgroundColor: activeTab === tab.id ? 'var(--color-card-bg)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--color-brand)' : 'var(--color-text-muted)'
                                }}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'user' && (
                    <motion.div
                        key="user-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                    >
                        <UserSettings />
                    </motion.div>
                )}

                {activeTab === 'team' && (
                    <motion.div
                        key="team-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                    >
                        <TeamSettings />
                    </motion.div>
                )}

                {activeTab === 'referral' && (
                    <motion.div
                        key="referral-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="p-6 rounded-3xl"
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            border: '1px solid var(--color-card-border)',
                        }}
                    >
                        <ReferralTab />
                    </motion.div>
                )}

                {activeTab === 'business' && (
                    <motion.div
                        key="business-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-8"
                    >
                        {isBusinessLoading ? (
                            <div className="h-48 flex items-center justify-center text-gray-400">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <Building2 size={32} />
                                </motion.div>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="flex justify-between items-center backdrop-blur-sm p-4 rounded-2xl"
                                    style={{
                                        backgroundColor: 'var(--color-hover-bg)',
                                        border: '1px solid var(--color-card-border)'
                                    }}
                                >
                                    <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                        {isCreating ? 'Yeni Biznes' : (businesses?.length > 1 ? 'Biznes Seçin' : 'Biznes Məlumatları')}
                                    </h3>
                                    <div className="flex gap-2">
                                        {businesses?.length > 0 && (
                                            <button
                                                onClick={handleNewBusiness}
                                                className="px-4 py-2 rounded-xl flex items-center space-x-2 transition-all font-bold text-xs"
                                                style={{ backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-card-border)' }}
                                            >
                                                <Plus size={16} />
                                                <span>Yeni</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSubmit}
                                            disabled={mutation.isPending}
                                            className="bg-[var(--color-brand)] text-white px-6 py-2 rounded-xl flex items-center space-x-2 hover:bg-[var(--color-brand-dark)] shadow-lg shadow-[var(--color-brand-shadow)] transition-all font-bold text-xs disabled:opacity-50"
                                        >
                                            {mutation.isPending ? (
                                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                                            ) : <Save size={16} />}
                                            <span>Saxla</span>
                                        </button>
                                    </div>
                                </div>

                                {businesses && businesses.length > 1 && (
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {businesses.map(b => (
                                            <div
                                                key={b.id}
                                                onClick={() => handleSelectBusiness(b)}
                                                className={`min-w-[180px] p-4 rounded-2xl border-2 cursor-pointer transition-all shadow-sm`}
                                                style={{
                                                    backgroundColor: selectedBusiness?.id === b.id ? 'var(--color-brand-light)' : 'var(--color-card-bg)',
                                                    borderColor: selectedBusiness?.id === b.id ? 'var(--color-brand)' : 'var(--color-card-border)'
                                                }}
                                            >
                                                <div className="font-bold truncate text-sm" style={{ color: 'var(--color-text-primary)' }}>{b.name}</div>
                                                <div className="text-[10px] font-black mt-1 uppercase tracking-tighter" style={{ color: 'var(--color-text-muted)' }}>{b.voen || 'VÖEN yoxdur'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Reusing existing business form fields but organized for readability */}
                                    <div
                                        className="p-8 rounded-3xl space-y-8"
                                        style={{
                                            backgroundColor: 'var(--color-card-bg)',
                                            border: '1px solid var(--color-card-border)',
                                            boxShadow: 'var(--color-card-shadow)'
                                        }}
                                    >
                                        <div className="flex flex-col items-center pb-6 border-b" style={{ borderColor: 'var(--color-card-border)' }}>
                                            <div className="relative group">
                                                <div
                                                    className="w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-dashed overflow-hidden group-hover:border-primary-blue transition-colors"
                                                    style={{ backgroundColor: 'var(--color-hover-bg)', borderColor: 'var(--color-card-border)', color: 'var(--color-text-muted)' }}
                                                >
                                                    {logoPreview ? (
                                                        <img src={logoPreview.startsWith('http') ? logoPreview : (logoPreview.startsWith('blob') ? logoPreview : `${API_URL}${logoPreview}`)} alt="Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 size={32} />
                                                    )}
                                                </div>
                                                <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-xl cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                                                    <Plus size={16} />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                                </label>
                                            </div>
                                            <p className="mt-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Şirkət Logosu</p>
                                        </div>

                                        <h3 className="font-black flex items-center gap-3 text-lg tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}><Building2 size={20} /></div>
                                            Rəsmi Məlumatlar
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>Şirkət adı / Fərdi Sahibkar</label>
                                                <input
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-2.5 outline-none transition-all font-bold"
                                                    style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>VÖEN</label>
                                                    <input
                                                        name="voen"
                                                        value={formData.voen}
                                                        onChange={handleChange}
                                                        className="w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-2.5 outline-none transition-all font-bold"
                                                        style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <PhoneInput
                                                        label="Əlaqə Nömrəsi"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>Faktiki Ünvan</label>
                                                <textarea
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-2.5 outline-none transition-all font-bold"
                                                    style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                                                    rows="2"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>E-poçt</label>
                                                <input
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-2.5 outline-none transition-all font-bold"
                                                    style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                                                />
                                            </div>
                                            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-card-border)' }}>
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                                                    Standart Faktura Mövzusu
                                                    {!canUseThemes && <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />}
                                                </label>
                                                <div className="relative mt-1.5">
                                                    <select
                                                        name="default_invoice_theme"
                                                        disabled={!canUseThemes}
                                                        value={formData.default_invoice_theme || 'modern'}
                                                        onChange={handleChange}
                                                        className={`w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-2.5 outline-none transition-all font-bold appearance-none cursor-pointer ${!canUseThemes ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                                                    >
                                                        <option value="modern">Müasir (Göy)</option>
                                                        <option value="classic">Klassik (Formal)</option>
                                                        <option value="minimal">Minimal (İncə)</option>
                                                    </select>
                                                    {!canUseThemes && (
                                                        <div onClick={() => setUpgradeConfig({
                                                            isOpen: true,
                                                            title: 'Professional Dizaynlar 🎨',
                                                            message: 'Biznesiniz üçün standart faktura mövzusunu təyin etmək və professional dizaynlardan yararlanmaq üçün Pro plana keçin.'
                                                        })} className="absolute inset-0 z-10 cursor-pointer" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="p-8 rounded-3xl space-y-8"
                                        style={{
                                            backgroundColor: 'var(--color-card-bg)',
                                            border: '1px solid var(--color-card-border)',
                                            boxShadow: 'var(--color-card-shadow)'
                                        }}
                                    >
                                        <h3 className="font-black flex items-center gap-3 text-lg tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Landmark size={20} /></div>
                                            Ödəniş Rekvizitləri
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>Xidmət etdyiniz Bank</label>
                                                <input
                                                    name="bank_name"
                                                    value={formData.bank_name}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-2.5 outline-none transition-all font-bold"
                                                    style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>Hesab Nömrəsi (IBAN)</label>
                                                <input
                                                    name="iban"
                                                    value={formData.iban}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-2.5 outline-none transition-all font-bold font-mono tracking-wider"
                                                    style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                                                    placeholder="AZ00..."
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--color-text-muted)' }}>SWIFT / BIC</label>
                                                <input
                                                    name="swift"
                                                    value={formData.swift}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-transparent focus:border-primary-blue rounded-xl p-2.5 outline-none transition-all font-bold"
                                                    style={{ backgroundColor: 'var(--color-hover-bg)', color: 'var(--color-text-primary)' }}
                                                />
                                            </div>
                                        </div>

                                        <div
                                            className="mt-8 pt-8 border-t text-[10px] italic flex items-start gap-2"
                                            style={{ borderColor: 'var(--color-card-border)', color: 'var(--color-text-muted)' }}
                                        >
                                            <Check size={14} className="text-green-500 shrink-0" />
                                            <p>Bu məlumatlar bütün hesab-fakturaların aşağı hissəsində (footer) avtomatik əks olunacaq.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                {!isCreating && selectedBusiness && (
                                    <div
                                        className="rounded-3xl p-8 space-y-6"
                                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}
                                    >
                                        <div className="flex items-center gap-3" style={{ color: 'var(--color-error)' }}>
                                            <AlertTriangle size={24} />
                                            <h3 className="font-black text-xl tracking-tight">Təhlükəli Zona</h3>
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="font-bold" style={{ color: 'var(--color-error)' }}>Biznesi Sil</div>
                                                <p className="text-sm font-medium max-w-md" style={{ color: 'var(--color-error)', opacity: 0.7 }}>
                                                    Bu biznes profilini və ona bağlı olan bütün faktura, xərc və müştəri məlumatlarını daimi olaraq silmək istədiyinizdən əminsiniz? Bu addım geri qaytarıla bilməz.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {showDeleteConfirm ? (
                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(false)}
                                                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                                                        >
                                                            Ləğv et
                                                        </button>
                                                        <button
                                                            onClick={handleDeleteBusiness}
                                                            disabled={deleteMutation.isPending}
                                                            className="bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-100 flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {deleteMutation.isPending ? 'Silinir...' : 'Bəli, Sil'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                        className="bg-white text-red-600 border border-red-200 px-6 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <Trash2 size={18} />
                                                        Sil
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

            </AnimatePresence>
            <UpgradeModal
                isOpen={upgradeConfig.isOpen}
                onClose={() => setUpgradeConfig({ ...upgradeConfig, isOpen: false })}
                title={upgradeConfig.title}
                message={upgradeConfig.message}
            />
        </motion.div>
    );
};

export default BusinessSettings;
