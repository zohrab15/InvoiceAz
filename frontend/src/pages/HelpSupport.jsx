import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle,
    MessageCircle,
    Mail,
    ChevronDown,
    FileText,
    Video,
    LifeBuoy,
    ExternalLink,
    ArrowRight
} from 'lucide-react';

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
    const faqs = [
        {
            question: "Yeni fakturanı necə yarada bilərəm?",
            answer: "Fakturalar səhifəsinə daxil olub 'Yeni Faktura' düyməsinə basın. Müştəri məlumatlarını, malları və onların qiymətini daxil etdikdən sonra 'Yadda saxla' düyməsinə basaraq fakturanı hazırlaya bilərsiniz."
        },
        {
            question: "Fakturaya öz loqomu necə əlavə edərəm?",
            answer: "Tənzimləmələr -> Biznes Profili bölməsinə daxil olun. Orada loqo yükləmək üçün xüsusi sahə var. Yüklədiyiniz loqo avtomatik olaraq bütün yeni fakturalarınızda görünəcək."
        },
        {
            question: "Fakturanı PDF formatında necə endirə bilərəm?",
            answer: "Yaradılmış fakturanın üzərinə klikləyərək detallar səhifəsinə keçin. Yuxarı sağ küncdə 'PDF Endir' düyməsini görəcəksiniz."
        },
        {
            question: "Abunəlik planımı necə dəyişə bilərəm?",
            answer: "Profil menyusundan 'Abunəlik' bölməsinə keçərək mövcud planları müqayisə edə və sizə uyğun olanı seçə bilərsiniz."
        },
        {
            question: "Məlumatlarımın təhlükəsizliyinə necə zəmanət verilir?",
            answer: "Bütün məlumatlar şifrələnmiş şəkildə saxlanılır və SSL sertifikatı ilə qorunur. Biznes məlumatlarınızın məxfiliyi bizim üçün prioritetdir."
        }
    ];

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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-20 max-w-5xl mx-auto px-4"
        >
            {/* Header Section */}
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))', color: 'white' }}>
                    <LifeBuoy size={32} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                    Sizə necə kömək edə bilərik?
                </h1>
                <p className="max-w-xl mx-auto text-sm sm:text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    Suallarınız var? Biz buradayıq. Tez-tez verilən suallara baxa bilər və ya birbaşa bizimlə əlaqə saxlaya bilərsiniz.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FAQ Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 sm:p-8 rounded-3xl"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                        <div className="flex items-center gap-3 mb-8">
                            <HelpCircle size={20} className="text-blue-500" />
                            <h2 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>Tez-tez Verilən Suallar</h2>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--color-card-border)' }}>
                            {faqs.map((faq, index) => (
                                <FAQItem key={index} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>
                    </div>

                    {/* Quick Resources */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                            onClick={() => navigate('/terms')}
                            className="p-6 rounded-2xl flex items-center gap-4 group cursor-pointer transition-all hover:-translate-y-1"
                            style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>İstifadə Qaydaları</h4>
                                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Sənədlərin tam siyahısı</p>
                            </div>
                            <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div
                            onClick={() => navigate('/privacy')}
                            className="p-6 rounded-2xl flex items-center gap-4 group cursor-pointer transition-all hover:-translate-y-1"
                            style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
                            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Məxfilik Siyasəti</h4>
                                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Məlumatların qorunması</p>
                            </div>
                            <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                    </div>
                </div>

                {/* Contact Sidebar */}
                <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest px-2" style={{ color: 'var(--color-text-muted)' }}>Birbaşa Əlaqə</h2>
                    {contactMethods.map((method, index) => (
                        <motion.a
                            key={index}
                            href={method.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -4 }}
                            className="block p-6 rounded-3xl transition-all shadow-sm hover:shadow-xl relative overflow-hidden group"
                            style={{
                                backgroundColor: 'var(--color-card-bg)',
                                border: '1px solid var(--color-card-border)'
                            }}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                {method.icon}
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                                style={{ backgroundColor: method.bg, color: method.color }}>
                                {method.icon}
                            </div>
                            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>{method.title}</h3>
                            <p className="text-xs mb-6 font-medium" style={{ color: 'var(--color-text-muted)' }}>{method.desc}</p>

                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: method.color }}>
                                <span>{method.action}</span>
                                <ExternalLink size={14} />
                            </div>
                        </motion.a>
                    ))}

                    <div className="p-6 rounded-3xl mt-8 text-center"
                        style={{ background: 'var(--color-badge-bg)', border: '1px dashed var(--color-card-border)' }}>
                        <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            İş saatları: Bazar ertəsi - Cümə<br />
                            09:00 - 18:00
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default HelpSupport;
