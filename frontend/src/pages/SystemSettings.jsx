import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Coins, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SystemSettings = () => {
    const { theme: currentTheme, setTheme, themes } = useTheme();

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
                    <h3 className="font-black flex items-center gap-3 text-xl tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Bell size={20} /></div>
                        Bildirişlər
                    </h3>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Bu bölmə hələ ki, hazırlıq mərhələsindədir.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default SystemSettings;
