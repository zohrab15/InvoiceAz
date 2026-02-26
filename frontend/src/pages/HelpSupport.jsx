import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
    Search, Mail, MessageSquare, Phone,
    FileText, HelpCircle, ChevronRight, ChevronDown, ChevronLeft,
    ArrowLeft, ArrowRight, Globe, LifeBuoy, Zap, Lock,
    Plus, Minus, ExternalLink,
    CreditCard, Users, ShieldCheck, MessageCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="border-b last:border-b-0 transition-all"
            style={{ borderColor: 'var(--color-card-border)' }}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-5 text-left group"
            >
                <span className="font-bold text-sm sm:text-base pr-4" style={{ color: 'var(--color-text-primary)' }}>
                    {question}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    <ChevronDown size={20} />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const HelpSupport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const { token } = useAuthStore();
    const forceDark = !token || location.state?.fromLanding;

    const categories = [
        { id: 'all', label: 'Hamısı', icon: <LifeBuoy size={18} /> },
        { id: 'general', label: 'Ümumi', icon: <Zap size={18} /> },
        { id: 'billing', label: 'Ödənişlər', icon: <CreditCard size={18} /> },
        { id: 'account', label: 'Hesab', icon: <Users size={18} /> },
        { id: 'security', label: 'Təhlükəsizlik', icon: <ShieldCheck size={18} /> }
    ];

    const allFaqs = [
        // General
        {
            category: 'general',
            question: "Yeni fakturanı necə yarada bilərəm?",
            answer: "Fakturalar səhifəsinə daxil olub 'Yeni Faktura' düyməsinə basın. Müştəri məlumatlarını, malları və onların qiymətini daxil etdikdən sonra 'Yadda saxla' düyməsinə basaraq fakturanı hazırlaya bilərsiniz."
        },
        {
            category: 'general',
            question: "Fakturaya öz loqomu necə əlavə edərəm?",
            answer: "Tənzimləmələr -> Biznes Profili bölməsinə daxil olun. Orada loqo yükləmək üçün xüsusi sahə var. Yüklədiyiniz loqo avtomatik olaraq bütün yeni fakturalarınızda görünəcək."
        },
        {
            category: 'general',
            question: "Fakturanı PDF formatında necə endirə bilərəm?",
            answer: "Yaradılmış fakturanın üzərinə klikləyərək detallar səhifəsinə keçin. Yuxarı sağ küncdə 'PDF Endir' düyməsini görəcəksiniz."
        },
        // Billing
        {
            category: 'billing',
            question: "Abunəlik planımı necə dəyişə bilərəm?",
            answer: "Profil menyusundan 'Qiymətləndirmə' və ya 'Tənzimləmələr' bölməsinə keçərək mövcud planları müqayisə edə və sizə uyğun olanı seçə bilərsiniz."
        },
        {
            category: 'billing',
            question: "Ödəniş üsulları hansılardır?",
            answer: "Hazırda VISA, MasterCard və digər yerli bank kartları ilə ödənişləri qəbul edirik. Ödənişlər təhlükəsiz ödəniş şlüzü vasitəsilə həyata keçirilir."
        },
        // Account
        {
            category: 'account',
            question: "Şifrəmi unutmuşam, nə etməliyəm?",
            answer: "Giriş səhifəsində 'Şifrəni unutmusunuz?' linkinə klikləyin. E-poçt ünvanınızı daxil etdikdən sonra sizə şifrəni yeniləmək üçün təlimat göndəriləcək."
        },
        {
            category: 'account',
            question: "Hesabımı necə silə bilərəm?",
            answer: "Hesabınızı silmək üçün Tənzimləmələr -> Təhlükəsizlik bölməsinə daxil olun və ya support@invoiceaz.app ünvanına müraciət edin. Nəzərə alın ki, hesab silindikdə bütün məlumatlarınız tamamilə təmizlənir."
        },
        // Security
        {
            category: 'security',
            question: "Məlumatlarımın təhlükəsizliyinə necə zəmanət verilir?",
            answer: "Bütün məlumatlar 256-bit SSL şifrələmə texnologiyası ilə qorunur. Biznes məlumatlarınızın məxfiliyi bizim üçün prioritetdir və heç bir halda üçüncü tərəflərlə paylaşılmır."
        }
    ];

    const filteredFaqs = allFaqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const contactMethods = [
        {
            icon: <MessageCircle size={24} />,
            title: "WhatsApp Dəstək",
            desc: "7/24 operativ suallar üçün",
            action: "Mesaj yaz",
            link: "https://wa.me/994517640324",
            color: "#25D366",
            bg: "rgba(37, 211, 102, 0.1)"
        },
        {
            icon: <Mail size={24} />,
            title: "Email Dəstək",
            desc: "Rəsmi sorğular və təkliflər üçün",
            action: "Email göndər",
            link: "mailto:support@invoiceaz.app",
            color: "#3b82f6",
            bg: "rgba(59, 130, 246, 0.1)"
        }
    ];

    return (
        <div className={`${forceDark ? 'theme-dark' : ''} min-h-screen bg-[var(--color-page-bg)] text-[var(--color-text-primary)]`}>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="pb-24 max-w-5xl mx-auto px-4"
            >
                {/* Header Section */}
                <div className="py-12 flex flex-col items-center text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-colors self-start"
                        style={{ backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-text-muted)' }}
                    >
                        <ChevronLeft size={16} />
                        <span>Geri</span>
                    </button>

                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
                        style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))', color: 'white' }}>
                        <LifeBuoy size={32} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                        Sizə necə kömək edə bilərik?
                    </h1>
                    <p className="max-w-xl text-sm sm:text-base font-medium mb-10" style={{ color: 'var(--color-text-muted)' }}>
                        Suallarınız var? Biz buradayıq. Tez-tez verilən suallara baxa bilər və ya birbaşa bizimlə əlaqə saxlaya bilərsiniz.
                    </p>

                    {/* Search Bar */}
                    <div className="relative w-full max-w-2xl group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors"
                            size={20} style={{ color: searchQuery ? 'var(--color-brand)' : 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Sualınızı bura yazın (məs: loqo əlavə etmək)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 pl-14 pr-6 rounded-2xl outline-none border transition-all font-medium"
                            style={{
                                backgroundColor: 'var(--color-card-bg)',
                                borderColor: 'var(--color-card-border)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap justify-center gap-2 mt-8">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                                style={{
                                    backgroundColor: activeCategory === cat.id ? 'var(--color-brand)' : 'var(--color-badge-bg)',
                                    color: activeCategory === cat.id ? 'white' : 'var(--color-text-secondary)',
                                    border: activeCategory === cat.id ? 'none' : '1px solid var(--color-card-border)'
                                }}
                            >
                                {cat.icon}
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* FAQ Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 sm:p-8 rounded-3xl"
                            style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                            <div className="flex items-center gap-3 mb-8">
                                <HelpCircle size={20} style={{ color: 'var(--color-brand)' }} />
                                <h2 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>Tez-tez Verilən Suallar</h2>
                            </div>

                            {filteredFaqs.length > 0 ? (
                                <div className="divide-y" style={{ borderColor: 'var(--color-card-border)' }}>
                                    {filteredFaqs.map((faq, index) => (
                                        <FAQItem key={index} question={faq.question} answer={faq.answer} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <Search size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
                                    <p className="font-bold" style={{ color: 'var(--color-text-secondary)' }}>Axtarışa uyğun sual tapılmadı.</p>
                                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Zəhmət olmasa başqa ifadə ilə yoxlayın.</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Resources */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                                onClick={() => navigate('/terms')}
                                className="p-6 rounded-3xl flex items-center gap-4 group cursor-pointer transition-all hover:-translate-y-1"
                                style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                                <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-500">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>İstifadə Qaydaları</h4>
                                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Sənədlərin tam siyahısı</p>
                                </div>
                                <ArrowRight size={18} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                            </div>
                            <div
                                onClick={() => navigate('/privacy')}
                                className="p-6 rounded-3xl flex items-center gap-4 group cursor-pointer transition-all hover:-translate-y-1"
                                style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500">
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Məxfilik Siyasəti</h4>
                                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Məlumatların qorunması</p>
                                </div>
                                <ArrowRight size={18} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Contact Sidebar */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest px-2 mb-4" style={{ color: 'var(--color-text-muted)' }}>Birbaşa Əlaqə</h2>
                        {contactMethods.map((method, index) => (
                            <motion.a
                                key={index}
                                href={method.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ y: -4 }}
                                className="block p-7 rounded-3xl transition-all shadow-sm hover:shadow-xl relative overflow-hidden group"
                                style={{
                                    backgroundColor: 'var(--color-card-bg)',
                                    border: '1px solid var(--color-card-border)'
                                }}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    {method.icon}
                                </div>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                                    style={{ backgroundColor: method.bg, color: method.color }}>
                                    {method.icon}
                                </div>
                                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>{method.title}</h3>
                                <p className="text-xs mb-8 font-medium leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{method.desc}</p>

                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: method.color }}>
                                    <span>{method.action}</span>
                                    <ExternalLink size={14} />
                                </div>
                            </motion.a>
                        ))}

                        <div className="p-8 rounded-3xl mt-8 text-center"
                            style={{ background: 'var(--color-badge-bg)', border: '1px dashed var(--color-card-border)' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Dəstək Saatları</p>
                            <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                Bazar ertəsi - Cümə<br />
                                <span className="text-lg block mt-1">09:00 - 18:00</span>
                            </p>
                            <div className="mt-6 flex justify-center gap-3">
                                <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Hazırda Aktivdir</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default HelpSupport;
