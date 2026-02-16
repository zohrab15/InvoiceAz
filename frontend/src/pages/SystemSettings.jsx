import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Coins, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SystemSettings = () => {
    const { theme: currentTheme, setTheme, themes } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 pb-12 px-4"
        >
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tənzimləmələr</h2>
                <p className="text-gray-400 text-sm font-medium mt-1">
                    Sistem görünüşü və üstünlüklərini idarə edin
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Theme Selection */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                    <h3 className="font-black text-gray-800 flex items-center gap-3 text-xl tracking-tight">
                        <div className="p-2 bg-pink-50 rounded-lg text-pink-600"><Palette size={24} /></div>
                        Görünüş və Mövzu
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {themes.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg ${currentTheme === t.id ? 'border-primary-blue bg-blue-50/10' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                            >
                                {currentTheme === t.id && (
                                    <div className="absolute top-3 right-3 text-primary-blue">
                                        <Check size={20} className="stroke-[3]" />
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: t.color }} />
                                        <div className="w-8 h-8 rounded-lg shadow-sm opacity-50" style={{ backgroundColor: t.color }} />
                                        <div className="w-8 h-8 rounded-lg shadow-sm opacity-20" style={{ backgroundColor: t.color }} />
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-900">{t.name}</div>
                                        <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-black">
                                            {t.id === 'slate' ? 'Standard' : (t.id === 'money' ? 'Maliyyə' : 'Premium')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Currency Placeholder */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                    <h3 className="font-black text-gray-800 flex items-center gap-3 text-xl tracking-tight">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Coins size={24} /></div>
                        Valyuta Tənzimləmələri
                    </h3>

                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div>
                            <div className="font-bold text-gray-900">Əsas Valyuta</div>
                            <div className="text-xs text-gray-500 mt-1">Bütün hesabatlar bu valyutada göstəriləcək</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-black text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">₼ AZN</span>
                            <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Aktiv</span>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 italic text-xs text-blue-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        Tezliklə: Multi-valyuta dəstəyi (USD, EUR) üzərində işləyirik.
                    </div>
                </div>

                {/* Notifications Placeholder */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                    <h3 className="font-black text-gray-800 flex items-center gap-3 text-xl tracking-tight">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Bell size={20} /></div>
                        Bildirişlər
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Bu bölmə hələ ki, hazırlıq mərhələsindədir.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default SystemSettings;
