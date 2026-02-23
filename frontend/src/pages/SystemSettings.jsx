import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Coins, Bell, Moon, Sun, Mail, AppWindow, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import { useToast } from '../components/Toast';
import { useBusiness } from '../context/BusinessContext';

const SystemSettings = () => {
    const { theme: currentTheme, setTheme, themes } = useTheme();
    const { activeBusiness } = useBusiness();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const showToast = useToast();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await client.get('/notifications/settings/me/');
            setSettings(response.data);
        } catch (error) {
            console.error('Bildiriş ayarlarını yükləmək mümkün olmadı:', error);
            showToast('Bildiriş ayarlarını yükləmək mümkün olmadı', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSetting = async (key) => {
        if (!settings || saving) return;

        const newValue = !settings[key];
        setSaving(true);

        try {
            const response = await client.patch('/notifications/settings/me/', { [key]: newValue });
            setSettings(response.data);
            showToast('Ayarlar yeniləndi', 'success');
        } catch (error) {
            console.error('Ayarı yeniləmək mümkün olmadı:', error);
            showToast('Ayarı yeniləmək mümkün olmadı', 'error');
        } finally {
            setSaving(false);
        }
    };

    const NotificationToggle = ({ id, label, description, icon: Icon, isEmail = false }) => {
        const key = isEmail ? `email_${id}` : `in_app_${id}`;
        const isActive = settings?.[key];

        return (
            <div className="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-[var(--color-hover-bg)] group">
                <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${isEmail
                            ? (isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-blue-500/10 text-blue-500')
                            : (isActive ? 'bg-[var(--color-brand)] text-white shadow-lg shadow-[var(--color-brand-shadow)]' : 'bg-purple-500/10 text-purple-600')
                        }`}>
                        <Icon size={20} className={isActive ? 'scale-110' : ''} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate leading-none mb-1" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
                        <div className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{description}</div>
                    </div>
                </div>
                <button
                    onClick={() => toggleSetting(key)}
                    disabled={saving || loading}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isActive ? 'bg-[var(--color-brand)]' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xl ring-0 transition duration-300 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 pb-12 px-4"
        >
            <div className="p-6 rounded-3xl" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Tənzimləmələr</h2>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Sistem görünüşü və üstünlüklərini idarə edin
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Theme Selection */}
                <div className="p-8 rounded-3xl space-y-8" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                    <h3 className="font-black flex items-center gap-3 text-xl tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}><Palette size={24} /></div>
                        Görünüş və Mövzu
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {themes.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`relative p-5 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${currentTheme === t.id ? 'ring-2' : ''}`}
                                style={{
                                    backgroundColor: currentTheme === t.id ? 'var(--color-brand-light)' : 'var(--color-hover-bg)',
                                    border: currentTheme === t.id ? `2px solid var(--color-brand)` : '2px solid transparent',
                                    ringColor: currentTheme === t.id ? 'var(--color-brand)' : 'transparent',
                                }}
                            >
                                {currentTheme === t.id && (
                                    <div className="absolute top-3 right-3" style={{ color: 'var(--color-brand)' }}>
                                        <Check size={18} className="stroke-[3]" />
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    {/* Theme preview */}
                                    <div className="w-full h-16 rounded-xl overflow-hidden flex shadow-inner" style={{ border: '1px solid var(--color-card-border)' }}>
                                        <div className="w-1/4 h-full" style={{ backgroundColor: t.preview[1] }} />
                                        <div className="flex-1 h-full flex flex-col p-1.5 gap-1" style={{ backgroundColor: t.preview[2] }}>
                                            <div className="w-full h-2 rounded" style={{ backgroundColor: t.preview[0], opacity: 0.7 }} />
                                            <div className="w-3/4 h-1.5 rounded" style={{ backgroundColor: t.preview[0], opacity: 0.3 }} />
                                            <div className="w-1/2 h-1.5 rounded" style={{ backgroundColor: t.preview[0], opacity: 0.15 }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-black text-sm flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                            {t.id === 'dark' && <Moon size={14} />}
                                            {t.name}
                                        </div>
                                        <div className="text-[10px] uppercase tracking-widest font-black mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                            {t.subtitle}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Currency */}
                <div className="p-8 rounded-3xl space-y-8" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                    <h3 className="font-black flex items-center gap-3 text-xl tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Coins size={24} /></div>
                        Valyuta Tənzimləmələri
                    </h3>

                    <div className="p-6 rounded-2xl flex items-center justify-between" style={{ backgroundColor: 'var(--color-hover-bg)', border: '1px solid var(--color-card-border)' }}>
                        <div>
                            <div className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Əsas Valyuta</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Bütün hesabatlar bu valyutada göstəriləcək</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-black px-4 py-2 rounded-xl" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>₼ AZN</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>Aktiv</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl italic text-xs flex items-center gap-2" style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)', border: '1px solid var(--color-card-border)' }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-brand)' }} />
                        Tezliklə: Multi-valyuta dəstəyi (USD, EUR) üzərində işləyirik.
                    </div>
                </div>

                {/* Notifications */}
                <div className="p-8 rounded-3xl space-y-8" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                    <div className="flex items-center justify-between">
                        <h3 className="font-black flex items-center gap-3 text-xl tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Bell size={24} /></div>
                            Bildirişlər
                        </h3>
                        {saving && <Loader2 size={16} className="animate-spin text-[var(--color-brand)]" />}
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 size={32} className="animate-spin text-[var(--color-brand)] opacity-50" />
                        </div>
                    ) : (() => {
                        const role = (activeBusiness?.user_role || 'OWNER').toUpperCase();
                        const isInventoryManager = role === 'INVENTORY_MANAGER';
                        const isOwnerOrManager = ['OWNER', 'MANAGER'].includes(role);
                        const isAccountant = role === 'ACCOUNTANT';
                        const isSalesRep = role === 'SALES_REP';

                        const showInventorySettings = isOwnerOrManager || isInventoryManager;

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* In-App Notifications */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                                        <AppWindow size={14} /> Sistem Daxili Bildirişlər
                                    </h4>
                                    <div className="space-y-2 border-t border-[var(--color-card-border)] pt-4">
                                        {!isInventoryManager && !isSalesRep && (
                                            <>
                                                <NotificationToggle id="invoice_created" label="Yeni Faktura" description="Yeni faktura yaradıldıqda bildir" icon={Bell} />
                                                <NotificationToggle id="invoice_viewed" label="Faktura Baxıldı" description="Müştəri fakturaya baxdıqda bildir" icon={Bell} />
                                                <NotificationToggle id="payment_received" label="Yeni Ödəniş" description="Ödəniş qəbul edildikdə bildir" icon={Bell} />
                                                <NotificationToggle id="client_created" label="Yeni Müştəri" description="Yeni müştəri əlavə edildikdə bildir" icon={Bell} />
                                                <NotificationToggle id="expense_created" label="Yeni Xərc" description="Yeni xərc əlavə edildikdə bildir" icon={Bell} />
                                                <NotificationToggle id="overdue_invoice" label="Gecikən Ödəniş xatırlatması" description="Fakturanın ödəniş müddəti bitdikdə bildir" icon={Bell} />
                                            </>
                                        )}
                                        {isSalesRep && (
                                            <>
                                                <NotificationToggle id="overdue_invoice" label="Gecikən Ödəniş Xatırlatması" description="Təhkim olunduğunuz müştərinin faktura ödənişi gecikdikdə bildir" icon={Bell} />
                                                <NotificationToggle id="target_reached" label="Aylıq Hədəf Statusu" description="Aylıq hədəfinizə yaxınlaşdıqda və ya tamamladıqda bildir" icon={Bell} />
                                                <NotificationToggle id="invoice_viewed" label="Faktura Baxıldı" description="Müştəri fakturaya baxdıqda bildir" icon={Bell} />
                                                <NotificationToggle id="payment_received" label="Yeni Ödəniş" description="Müştəriniz ödəniş etdikdə bildir" icon={Bell} />
                                            </>
                                        )}
                                        {showInventorySettings && (
                                            <NotificationToggle id="low_stock" label="Kritik Stok" description="Məhsul sayı limitdən aşağı düşdükdə bildir" icon={Bell} />
                                        )}
                                    </div>
                                </div>

                                {/* Email Notifications */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                                        <Mail size={14} /> E-poçt Bildirişləri
                                    </h4>
                                    <div className="space-y-2 border-t border-[var(--color-card-border)] pt-4">
                                        {!isInventoryManager && !isSalesRep && (
                                            <>
                                                <NotificationToggle id="invoice_viewed" label="Faktura Baxıldı" description="Müştəri fakturaya baxdıqda email göndər" icon={Mail} isEmail />
                                                <NotificationToggle id="payment_received" label="Yeni Ödəniş" description="Ödəniş qəbul edildikdə email göndər" icon={Mail} isEmail />
                                                <NotificationToggle id="overdue_invoice" label="Gecikən Ödəniş xatırlatması" description="Fakturanın ödəniş müddəti bitdikdə email göndər" icon={Mail} isEmail />
                                            </>
                                        )}
                                        {isSalesRep && (
                                            <>
                                                <NotificationToggle id="overdue_invoice" label="Gecikən Ödəniş Xatırlatması" description="Təhkim olunduğunuz müştərinin faktura ödənişi gecikdikdə email göndər" icon={Mail} isEmail />
                                            </>
                                        )}
                                        {showInventorySettings && (
                                            <NotificationToggle id="low_stock" label="Kritik Stok" description="Məhsul sayı limitdən aşağı düşdükdə email göndər" icon={Mail} isEmail />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </motion.div>
    );
};

export default SystemSettings;
