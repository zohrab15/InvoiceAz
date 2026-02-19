import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Lock, ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const LegalPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isPrivacy = location.pathname === '/privacy';

    const termsContent = {
        title: "İstifadə Qaydaları",
        subtitle: "InvoiceAZ platformasından istifadə qaydaları və şərtləri",
        icon: <FileText size={32} />,
        sections: [
            {
                title: "1. Giriş",
                content: "InvoiceAZ tərəfindən təqdim olunan xidmətlərdən istifadə etməzdən əvvəl bu qaydaları diqqətlə oxumağınız xahiş olunur. Platformadan istifadə etməklə siz bura daxil edilmiş bütün şərtlərlə razılaşdığınızı təsdiq edirsiniz."
            },
            {
                title: "2. Xidmətin Təsviri",
                content: "InvoiceAZ bizneslər üçün faktura yaratma, satış izləmə və xərclərin idarə edilməsi xidmətini təqdim edən bulud əsaslı proqram təminatıdır (SaaS). Xidmət mütəmadi olaraq yenilənir və funksionallıqlar dəyişdirilə bilər."
            },
            {
                title: "3. İstifadəçi Hesabı və Məsuliyyət",
                content: "İstifadəçi hesab açarkən təqdim etdiyi məlumatların doğruluğuna görə məsuliyyət daşıyır. Şifrənin məxfi saxlanılması və hesabla bağlı bütün fəaliyyətlər istifadəçinin öhdəliyindədir. Fakturalarda qeyd olunan vergi və maliyyə məlumatlarının Azərbaycan Respublikasının qanunvericiliyinə uyğunluğu tamamilə istifadəçinin məsuliyyətidir."
            },
            {
                title: "4. Abunəlik və Ödəniş Şərtləri",
                content: "Xidmətlər seçilmiş tarif paketinə (Pulsuz, Pro, Premium) uyğun olaraq təqdim edilir. Abunəlik ödənişləri qabaqcadan (advance) həyata keçirilir. Ödənişlərin gecikdirilməsi xidmətin müvəqqəti dayandırılmasına səbəb ola bilər."
            },
            {
                title: "5. Məsuliyyətin Məhdudlaşdırılması",
                content: "InvoiceAZ proqram təminatında baş verə biləcək texniki xətalar və ya məlumat itkisi nəticəsində yaranan dolayı zərərlərə görə məsuliyyət daşımır. Biz məlumatlarınızın ehtiyat nüsxələrini mütəmadi olaraq saxlasaq da, istifadəçilərə öz kritik məlumatlarını əlavə olaraq arxivləşdirməyi tövsiyə edirik."
            },
            {
                title: "6. Əqli Mülkiyyət",
                content: "Platformanın dizaynı, kodu, loqosu və bütün texniki strukturu InvoiceAZ-a məxsusdur. İstifadəçilərə proqram kodunu kopyalamaq, dəyişdirmək və ya təkrar satmaq qadağandır."
            }
        ]
    };

    const privacyContent = {
        title: "Məxfilik Siyasəti",
        subtitle: "Məlumatlarınızın qorunması bizim prioritetimizdir",
        icon: <Shield size={32} />,
        sections: [
            {
                title: "1. Toplanılan Məlumatlar",
                content: "Biz istifadəçilərin qeydiyyat zamanı daxil etdiyi şəxsi məlumatları (ad, soyad, email, telefon) və biznes məlumatlarını (VÖEN, şirkət adı, bank detalları) toplayırıq. Həmçinin, sistem vasitəsilə yaradılan faktura və müştəri məlumatları təhlükəsiz serverlərdə saxlanılır."
            },
            {
                title: "2. Məlumatların İstifadə Məqsədi",
                content: "Toplanılan məlumatlar yalnız xidmətin göstərilməsi, fakturaların formalaşdırılması, statistik hesabatların hazırlanması və sistem yenilikləri haqqında bildirişlərin göndərilməsi üçün istifadə olunur."
            },
            {
                title: "3. Məlumatların Qorunması və Təhlükəsizlik",
                content: "Məlumatlar SSL şifrələmə texnologiyası vasitəsilə qorunur. Bütün məlumat bazaları müasir firewall və təhlükəsizlik protokolları ilə əhatə olunub. Şəxsi və kommersiya məlumatlarınıza yalnız sizin təyin etdiyiniz giriş məlumatları vasitəsilə daxil olmaq mümkündür."
            },
            {
                title: "4. Məlumatların Üçüncü Tərəflərlə Paylaşılmaması",
                content: "InvoiceAZ istifadəçilərin kommersiya məlumatlarını, müştəri siyahılarını və faktura tarixçəsini heç bir halda üçüncü tərəflərə (reklam şirkətləri və ya rəqiblərinizə) satmır və ya paylaşmır. Məlumatlar yalnız hüquq-mühafizə orqanlarının qanuni sorğusu əsasında təqdim edilə bilər."
            },
            {
                title: "5. Çərəzlər (Cookies) İstifadəsi",
                content: "Sistemdən istifadə təcrübənizi yaxşılaşdırmaq üçün çərəzlərdən istifadə olunur. Çərəzlər sessiyanın saxlanılması və dil üstünlüklərinin xatırlanması üçün texniki mahiyyət daşıyır."
            },
            {
                title: "6. İstifadəçi Hüquqları",
                content: "İstifadəçilər istənilən vaxt öz hesablarını silmək və ya məlumatlarını sistemdən ixrac etmək hüququna malikdirlər. Hesab silindikdə bütün əlaqəli kommersiya məlumatları da sistemdən tamamilə təmizlənir."
            }
        ]
    };

    const content = isPrivacy ? privacyContent : termsContent;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pb-24 max-w-4xl mx-auto px-4"
        >
            {/* Header */}
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
                    {content.icon}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                    {content.title}
                </h1>
                <p className="max-w-xl text-sm sm:text-base font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {content.subtitle}
                </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-4">
                {content.sections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-6 sm:p-8 rounded-3xl"
                        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                    >
                        <h2 className="text-lg font-black mb-4 flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: 'var(--color-brand)' }}></div>
                            {section.title}
                        </h2>
                        <p className="text-sm sm:text-base leading-relaxed text-left" style={{ color: 'var(--color-text-secondary)' }}>
                            {section.content}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="mt-12 p-8 rounded-3xl text-center"
                style={{ backgroundColor: 'var(--color-badge-bg)', border: '1px dashed var(--color-card-border)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    Son yenilənmə: 19 fevral 2026-cı il
                </p>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={() => navigate(isPrivacy ? '/terms' : '/privacy')}
                        className="text-xs font-bold hover:underline"
                        style={{ color: 'var(--color-brand)' }}
                    >
                        {isPrivacy ? "İstifadə Qaydalarına bax" : "Məxfilik Siyasətinə bax"}
                    </button>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>•</span>
                    <button
                        onClick={() => navigate('/help')}
                        className="text-xs font-bold hover:underline"
                        style={{ color: 'var(--color-brand)' }}
                    >
                        Dəstək mərkəzi
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default LegalPage;
