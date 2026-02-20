import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Lock, ChevronLeft, AlertTriangle, Eye, Database, Globe, UserCheck, CreditCard, Scale, Clock, Mail, Server, Trash2, Download, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const LegalPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isPrivacy = location.pathname === '/privacy';

    const termsContent = {
        title: "İstifadə Qaydaları",
        subtitle: "InvoiceAZ platformasından istifadə qaydaları və şərtləri",
        icon: <FileText size={32} />,
        lastUpdated: "19 fevral 2026",
        sections: [
            {
                title: "1. Ümumi Müddəalar",
                icon: <Scale size={18} />,
                content: "Bu İstifadə Qaydaları (bundan sonra «Qaydalar») InvoiceAZ platformasından (bundan sonra «Platforma» və ya «Xidmət») istifadə şərtlərini müəyyən edir. Platformada qeydiyyatdan keçməklə və ya xidmətlərdən istifadə etməklə siz bu Qaydaların bütün müddəaları ilə razılaşdığınızı təsdiq edirsiniz. Əgər bu şərtlərlə razı deyilsinizsə, Platformadan istifadə etməməyiniz xahiş olunur.",
                subsections: [
                    "1.1. InvoiceAZ — Azərbaycan Respublikasında qeydiyyatdan keçmiş və fəaliyyət göstərən SaaS (Software as a Service) tipli bulud əsaslı faktura idarəetmə platformasıdır.",
                    "1.2. Bu Qaydalar istifadəçi ilə InvoiceAZ arasında bağlanan hüquqi razılaşma statusu daşıyır.",
                    "1.3. InvoiceAZ bu Qaydaları istənilən vaxt dəyişdirmək hüququnu özündə saxlayır. Dəyişikliklər Platformada dərc edildiyi andan qüvvəyə minir."
                ]
            },
            {
                title: "2. Xidmətin Təsviri",
                icon: <Globe size={18} />,
                content: "InvoiceAZ bizneslər üçün aşağıdakı xidmətləri təqdim edən bulud əsaslı proqram təminatıdır:",
                subsections: [
                    "2.1. Elektron faktura yaratma, redaktə etmə və göndərmə",
                    "2.2. Müştəri və təchizatçı bazasının idarə edilməsi",
                    "2.3. Gəlir və xərclərin izlənməsi və hesabatların formalaşdırılması",
                    "2.4. Vergi hesabatlarının avtomatik hazırlanması",
                    "2.5. Ödəniş izləmə və xatırlatma sistemləri",
                    "2.6. Məhsul və xidmət kataloqu idarəetməsi",
                    "2.7. Maliyyə proqnozlaşdırma və analitika alətləri",
                    "2.8. Xidmət mütəmadi olaraq yenilənir və funksionallıqlar əvvəlcədən xəbərdarlıq edilməklə dəyişdirilə bilər."
                ]
            },
            {
                title: "3. Qeydiyyat və Hesab",
                icon: <UserCheck size={18} />,
                content: "Platformadan tam istifadə etmək üçün qeydiyyatdan keçmək tələb olunur.",
                subsections: [
                    "3.1. İstifadəçi qeydiyyat zamanı doğru və aktual məlumatlar təqdim etməyi öhdəsinə götürür.",
                    "3.2. Hər bir istifadəçi yalnız bir hesab yarada bilər. Çoxsaylı saxta hesabların yaradılması qadağandır.",
                    "3.3. İstifadəçi öz giriş məlumatlarının (email və şifrə) məxfiliyini qorumağa borcludur.",
                    "3.4. Hesab üzərindən edilən bütün əməliyyatlar (faktura yaratma, ödəniş, silmə) hesab sahibinin məsuliyyətindədir.",
                    "3.5. Hesaba icazəsiz girişdən şübhələndikdə istifadəçi dərhal InvoiceAZ dəstək xidmətinə müraciət etməlidir.",
                    "3.6. InvoiceAZ bu Qaydaları pozan hesabları xəbərdarlıq etmədən bloklamaq və ya silmək hüququnu özündə saxlayır."
                ]
            },
            {
                title: "4. Abunəlik Planları və Ödəniş",
                icon: <CreditCard size={18} />,
                content: "Platforma müxtəlif tarif planları təqdim edir:",
                subsections: [
                    "4.1. Pulsuz plan — Ayda 10-a qədər faktura, əsas funksiyalar daxildir.",
                    "4.2. Pro plan — Ayda 100-ə qədər faktura, genişləndirilmiş hesabat və analitika, prioritet dəstək.",
                    "4.3. Premium plan — Limitsiz faktura, bütün funksiyalar, 24/7 dəstək (tezliklə).",
                    "4.4. Ödənişli planlara keçid edildikdə ödəniş qabaqcadan (advance) həyata keçirilir.",
                    "4.5. Abunəlik müddəti bitdikdə avtomatik olaraq yenilənə bilər (istifadəçi tənzimləyə bilər).",
                    "4.6. Ödənişin gecikdirilməsi xidmətin müvəqqəti dayandırılmasına səbəb ola bilər. Məlumatlarınız 30 gün ərzində saxlanılır.",
                    "4.7. Geri ödəniş yalnız xidmətin texniki səbəblərdən istifadəyə yararsız olduğu hallarda, InvoiceAZ-ın təsdiq etdiyi müddət üçün həyata keçirilə bilər."
                ]
            },
            {
                title: "5. İstifadəçi Öhdəlikləri",
                icon: <AlertTriangle size={18} />,
                content: "Platformadan istifadə zamanı istifadəçi aşağıdakılara riayət etməyi öhdəsinə götürür:",
                subsections: [
                    "5.1. Fakturalarda göstərilən vergi məlumatları, VÖEN, məbləğ və digər maliyyə göstəricilərinin Azərbaycan Respublikasının qanunvericiliyinə uyğunluğuna görə tam məsuliyyət istifadəçiyə aiddir.",
                    "5.2. Platformanı qeyri-qanuni məqsədlər üçün, o cümlədən saxta faktura yaratmaq, vergi qaçaqmalçılığı və ya dələduzluq üçün istifadə etmək qəti qadağandır.",
                    "5.3. Platformanın normal fəaliyyətinə mane olan hər hansı hərəkət (DDoS hücum, skript və bot istifadəsi, məlumat oğurluğu cəhdi) qadağandır.",
                    "5.4. İstifadəçi Platformada yerləşdirdiyi bütün məlumatların (şirkət adı, loqo, faktura məzmunu) üçüncü tərəflərin hüquqlarını pozmadığını təmin etməlidir."
                ]
            },
            {
                title: "6. Məsuliyyətin Məhdudlaşdırılması",
                icon: <Shield size={18} />,
                content: "InvoiceAZ xidmətlərinin keyfiyyətini yüksək səviyyədə saxlamağa çalışır, lakin aşağıdakı hallarda məsuliyyət daşımır:",
                subsections: [
                    "6.1. Texniki nasazlıqlar, server problemləri və ya üçüncü tərəf xidmətlərinin (bulud infrastrukturu, ödəniş provayderləri) işindəki fasilələr nəticəsində yaranan zərərlər.",
                    "6.2. İstifadəçinin öz təqsiri ilə (zəif şifrə, hesab məlumatlarının paylaşılması) baş verən məlumat itkisi və ya icazəsiz giriş.",
                    "6.3. Fakturalarda istifadəçi tərəfindən daxil edilən yanlış vergi və ya maliyyə məlumatları nəticəsində yarana biləcək hüquqi problemlər.",
                    "6.4. Fors-major hallar (təbii fəlakətlər, müharibə, hökumət qərarları, internet infrastrukturunun pozulması).",
                    "6.5. InvoiceAZ hər hansı bir halda istifadəçinin dolayı, təsadüfi və ya mənəvi zərərlərinə görə məsuliyyət daşımır.",
                    "6.6. InvoiceAZ-ın maksimum məsuliyyəti istifadəçinin son 12 ay ərzində ödədiyi abunəlik haqqı ilə məhdudlaşır."
                ]
            },
            {
                title: "7. Əqli Mülkiyyət Hüquqları",
                icon: <Lock size={18} />,
                content: "Platforma ilə bağlı bütün əqli mülkiyyət hüquqları InvoiceAZ-a məxsusdur.",
                subsections: [
                    "7.1. Platformanın dizaynı, mənbə kodu, alqoritmləri, loqosu, ticarət nişanı və bütün vizual elementləri InvoiceAZ-ın müstəsna mülkiyyətidir.",
                    "7.2. İstifadəçilər Platformanın heç bir hissəsini kopyalaya, dəyişdirə, dekompilyasiya edə, əks mühəndislik edə və ya kommersiya məqsədilə istifadə edə bilməzlər.",
                    "7.3. İstifadəçilərin Platforma vasitəsilə yaratdığı məzmun (fakturalar, müştəri məlumatları) istifadəçinin mülkiyyəti olaraq qalır."
                ]
            },
            {
                title: "8. Xidmətin Dayandırılması və Hesabın Bağlanması",
                icon: <Trash2 size={18} />,
                content: "Aşağıdakı hallarda xidmət dayandırıla və ya hesab bağlana bilər:",
                subsections: [
                    "8.1. İstifadəçinin öz istəyi ilə — İstifadəçi istənilən vaxt hesabını silə bilər. Silinmə tələbi alındıqdan sonra məlumatlar 30 gün ərzində bərpa edilə bilər, sonra isə bütövlükdə silinir.",
                    "8.2. InvoiceAZ tərəfindən — Bu Qaydaların kobud şəkildə pozulması, qeyri-qanuni fəaliyyət aşkar edilməsi və ya uzun müddət (180 gündən artıq) aktiv olmayan hesablar bağlana bilər.",
                    "8.3. Hesab bağlanmadan əvvəl istifadəçiyə e-poçt vasitəsilə xəbərdarlıq edilir (təcili hallar istisna)."
                ]
            },
            {
                title: "9. Mübahisələrin Həlli",
                icon: <Scale size={18} />,
                content: "Bu Qaydalarla bağlı yaranan mübahisələr aşağıdakı qaydada həll edilir:",
                subsections: [
                    "9.1. Tərəflər ilk növbədə mübahisəni danışıqlar yolu ilə həll etməyə çalışırlar.",
                    "9.2. Danışıqlar nəticə vermədikdə, mübahisə Azərbaycan Respublikasının qanunvericiliyinə uyğun olaraq müvafiq məhkəmə orqanlarında həll edilir.",
                    "9.3. Bu Qaydalar Azərbaycan Respublikasının qanunları ilə tənzimlənir və şərh edilir."
                ]
            },
            {
                title: "10. Əlaqə Məlumatları",
                icon: <Mail size={18} />,
                content: "Bu Qaydalarla bağlı suallarınız və ya təklifləriniz varsa, bizimlə əlaqə saxlaya bilərsiniz:",
                subsections: [
                    "E-poçt: support@invoiceaz.com",
                    "Dəstək mərkəzi: Platformadaxili «Kömək» bölməsi",
                    "Cavab müddəti: İş günləri ərzində 24 saat"
                ]
            }
        ]
    };

    const privacyContent = {
        title: "Məxfilik Siyasəti",
        subtitle: "Məlumatlarınızın qorunması və təhlükəsizliyi bizim əsas prioritetimizdir",
        icon: <Shield size={32} />,
        lastUpdated: "19 fevral 2026",
        sections: [
            {
                title: "1. Giriş",
                icon: <Eye size={18} />,
                content: "Bu Məxfilik Siyasəti InvoiceAZ platformasının (bundan sonra «Platforma») istifadəçilərinin şəxsi və kommersiya məlumatlarının necə toplandığını, istifadə edildiyini, saxlandığını və qorunduğunu izah edir. Biz Azərbaycan Respublikasının «Fərdi məlumatlar haqqında» Qanununa və beynəlxalq məlumat mühafizəsi standartlarına (GDPR prinsipləri) uyğun fəaliyyət göstəririk.",
                subsections: [
                    "1.1. Bu Siyasət Platformadan istifadə edən bütün fiziki və hüquqi şəxslərə şamil olunur.",
                    "1.2. Platformada qeydiyyatdan keçməklə siz bu Məxfilik Siyasətinin şərtlərini qəbul etmiş olursunuz."
                ]
            },
            {
                title: "2. Toplanılan Məlumatlar",
                icon: <Database size={18} />,
                content: "Platformadan istifadə zamanı aşağıdakı kateqoriyalarda məlumatlar toplanılır:",
                subsections: [
                    "2.1. Şəxsi məlumatlar — Ad, soyad, e-poçt ünvanı, telefon nömrəsi, profil şəkli.",
                    "2.2. Biznes məlumatları — Şirkət adı, VÖEN (Vergi Ödəyicisinin Eyniləşdirmə Nömrəsi), hüquqi ünvan, bank hesab detalları (IBAN, SWIFT, hesab nömrəsi), şirkət loqosu.",
                    "2.3. Maliyyə məlumatları — Yaradılmış fakturalar, müştəri ödəniş tarixçəsi, gəlir və xərc qeydləri, vergi hesabatları.",
                    "2.4. Texniki məlumatlar — IP ünvanı, brauzer tipi və versiyası, əməliyyat sistemi, giriş vaxtı, istifadə olunan səhifələr, sessiyanın müddəti.",
                    "2.5. Müştəri məlumatları — İstifadəçinin Platformaya daxil etdiyi müştərilərin ad, əlaqə və ünvan məlumatları."
                ]
            },
            {
                title: "3. Məlumatların Toplanma Üsulları",
                icon: <Globe size={18} />,
                content: "Məlumatlar aşağıdakı üsullarla toplanılır:",
                subsections: [
                    "3.1. Birbaşa — Qeydiyyat, profil redaktəsi, faktura yaratma və digər əməliyyatlar zamanı istifadəçi tərəfindən daxil edilən məlumatlar.",
                    "3.2. Avtomatik — Brauzer çərəzləri (cookies), server logları və analitika alətləri vasitəsilə toplanan texniki məlumatlar.",
                    "3.3. Üçüncü tərəf xidmətləri — Google OAuth vasitəsilə giriş zamanı Google tərəfindən təqdim olunan profil məlumatları."
                ]
            },
            {
                title: "4. Məlumatların İstifadə Məqsədləri",
                icon: <FileText size={18} />,
                content: "Toplanılan məlumatlar yalnız aşağıdakı məqsədlər üçün istifadə olunur:",
                subsections: [
                    "4.1. Platformanın əsas funksiyalarının təmin edilməsi — faktura yaratma, müştəri idarəetməsi, hesabat formalaşdırma.",
                    "4.2. Hesabın təhlükəsizliyinin təmin edilməsi — şübhəli girişlərin aşkarlanması, iki faktorlu autentifikasiya.",
                    "4.3. Xidmətin təkmilləşdirilməsi — istifadə statistikalarının analizi, UX araşdırmaları.",
                    "4.4. Bildirişlərin göndərilməsi — ödəniş xatırlatmaları, sistem yenilikləri, abunəlik statusu haqqında məlumatlar.",
                    "4.5. Hüquqi öhdəliklərin yerinə yetirilməsi — qanunvericiliyin tələb etdiyi hallarda məlumatların saxlanılması və təqdim edilməsi."
                ]
            },
            {
                title: "5. Məlumatların Qorunması və Təhlükəsizlik Tədbirləri",
                icon: <Lock size={18} />,
                content: "Məlumatlarınızın təhlükəsizliyi üçün aşağıdakı tədbirlər həyata keçirilir:",
                subsections: [
                    "5.1. Bütün məlumat ötürülmələri 256-bit SSL/TLS şifrələmə texnologiyası ilə qorunur.",
                    "5.2. Şifrələr bcrypt alqoritmi ilə həşlənir və heç vaxt açıq mətn şəklində saxlanılmır.",
                    "5.3. Məlumat bazaları müasir firewall və DDoS mühafizə sistemləri ilə təmin olunub.",
                    "5.4. Serverlər mütəmadi olaraq təhlükəsizlik yeniləmələri ilə güncəllənir.",
                    "5.5. Giriş icazələri rol əsaslı (RBAC) sistemlə idarə olunur.",
                    "5.6. Mütəmadi penetrasiya testləri və təhlükəsizlik auditləri həyata keçirilir.",
                    "5.7. Bütün məlumatların avtomatik ehtiyat nüsxələri (backup) gündəlik olaraq yaradılır."
                ]
            },
            {
                title: "6. Məlumatların Üçüncü Tərəflərlə Paylaşılması",
                icon: <AlertTriangle size={18} />,
                content: "InvoiceAZ istifadəçi məlumatlarının məxfiliyinə hörmətlə yanaşır:",
                subsections: [
                    "6.1. İstifadəçilərin kommersiya məlumatları, müştəri siyahıları, faktura detalları və maliyyə göstəriciləri heç bir halda reklam şirkətlərinə, data brokerlərinə və ya rəqiblərə satılmır və ya paylaşılmır.",
                    "6.2. Məlumatlar yalnız aşağıdakı hallarda üçüncü tərəflərlə paylaşıla bilər:\n   • Qanun tələbi — Məhkəmə qərarı və ya hüquq-mühafizə orqanlarının rəsmi sorğusu əsasında.\n   • Texniki xidmət təminatçıları — Yalnız xidmətin göstərilməsi üçün zəruri olan həcmdə (hosting provayderləri, e-poçt xidmətləri) və onlarla bağlanmış məxfilik müqavilələri çərçivəsində.\n   • İstifadəçinin razılığı — İstifadəçi açıq şəkildə razılıq verdikdə.",
                    "6.3. Hər hansı məcburi məlumat paylaşımı baş verdikdə, qanunvericiliyin icazə verdiyi həddə, istifadəçi bu barədə məlumatlandırılacaq."
                ]
            },
            {
                title: "7. Çərəzlər (Cookies) və İzləmə",
                icon: <Server size={18} />,
                content: "Platforma məhdud və şəffaf şəkildə çərəzlərdən istifadə edir:",
                subsections: [
                    "7.1. Zəruri çərəzlər — Sessiyanın idarə edilməsi, autentifikasiya tokenləri, dil üstünlüyü. Bu çərəzlər olmadan Platforma düzgün işləyə bilməz.",
                    "7.2. Funksional çərəzlər — Tema seçimi (qaranlıq/işıqlı rejim), son baxılmış səhifələr kimi istifadəçi təcrübəsini yaxşılaşdıran çərəzlər.",
                    "7.3. Platforma üçüncü tərəf reklam çərəzlərindən istifadə etmir.",
                    "7.4. İstifadəçi brauzer tənzimləmələri vasitəsilə çərəzləri idarə edə bilər, lakin bu Platformanın bəzi funksiyalarını məhdudlaşdıra bilər."
                ]
            },
            {
                title: "8. Məlumatların Saxlanma Müddəti",
                icon: <Clock size={18} />,
                content: "Məlumatlar müəyyən qaydalar əsasında saxlanılır:",
                subsections: [
                    "8.1. Aktiv hesab məlumatları — Hesab aktiv olduğu müddətdə saxlanılır.",
                    "8.2. Silinmiş hesab məlumatları — Hesab silindikdən sonra 30 gün ərzində bərpa imkanı ilə, sonra isə bütövlükdə silinir.",
                    "8.3. Maliyyə məlumatları — Azərbaycan Respublikasının vergi qanunvericiliyinə uyğun olaraq minimum 5 il müddətində arxivdə saxlanıla bilər.",
                    "8.4. Texniki loglar — Təhlükəsizlik məqsədilə 90 gün müddətində saxlanılır, sonra avtomatik silinir."
                ]
            },
            {
                title: "9. İstifadəçi Hüquqları",
                icon: <UserCheck size={18} />,
                content: "İstifadəçilər aşağıdakı hüquqlara malikdirlər:",
                subsections: [
                    "9.1. Giriş hüququ — Haqqınızda toplanılan bütün məlumatları görüntüləmək.",
                    "9.2. Düzəliş hüququ — Şəxsi və biznes məlumatlarınızı istənilən vaxt yeniləmək və düzəltmək.",
                    "9.3. Silmə hüququ — Hesabınızı və bütün əlaqəli məlumatları silmək tələb etmək.",
                    "9.4. İxrac hüququ — Bütün məlumatlarınızı maşın oxuna bilən formatda (JSON, CSV) yükləmək.",
                    "9.5. Etiraz hüququ — Məlumatların müəyyən məqsədlər üçün istifadəsinə etiraz etmək.",
                    "9.6. Bildiriş hüququ — Məlumat pozuntusu baş verdikdə 72 saat ərzində xəbərdarlıq almaq.",
                    "9.7. Bu hüquqlardan istifadə etmək üçün support@invoiceaz.com ünvanına müraciət edə bilərsiniz."
                ]
            },
            {
                title: "10. Uşaqların Məxfiliyi",
                icon: <Shield size={18} />,
                content: "InvoiceAZ 18 yaşdan kiçik şəxslərə xidmət göstərmir. Əgər 18 yaşdan kiçik bir şəxsin məlumatlarının toplandığı aşkar edilərsə, bu məlumatlar dərhal silinəcəkdir.",
                subsections: []
            },
            {
                title: "11. Dəyişikliklər və Yeniliklər",
                icon: <Bell size={18} />,
                content: "Bu Məxfilik Siyasəti vaxtaşırı yenilənə bilər:",
                subsections: [
                    "11.1. Əhəmiyyətli dəyişikliklər barədə istifadəçilərə e-poçt və Platformadaxili bildirişlər vasitəsilə xəbər verilir.",
                    "11.2. Dəyişikliklərdən sonra Platfomadan istifadəyə davam etmək yenilənmiş siyasəti qəbul etmək hesab olunur.",
                    "11.3. Əvvəlki versiyalar arxivdə saxlanılır və sorğu əsasında təqdim edilə bilər."
                ]
            },
            {
                title: "12. Əlaqə",
                icon: <Mail size={18} />,
                content: "Məxfilik ilə bağlı sual və narahatlıqlarınız üçün bizimlə əlaqə saxlayın:",
                subsections: [
                    "E-poçt: support@invoiceaz.com",
                    "Dəstək mərkəzi: Platformadaxili «Kömək» bölməsi",
                    "Cavab müddəti: İş günləri ərzində 24 saat"
                ]
            }
        ]
    };

    const content = isPrivacy ? privacyContent : termsContent;

    return (
        <div className="theme-dark min-h-screen bg-[var(--color-page-bg)] text-[var(--color-text-primary)]">
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

                    {/* Table of Contents */}
                    <div className="mt-8 w-full max-w-2xl p-6 rounded-2xl text-left"
                        style={{ backgroundColor: 'var(--color-badge-bg)', border: '1px solid var(--color-card-border)' }}>
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
                            Mündəricat
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {content.sections.map((section, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        document.getElementById(`section-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    className="flex items-center gap-2 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors hover:opacity-80 text-left"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    <span style={{ color: 'var(--color-brand)' }}>{section.icon}</span>
                                    <span>{section.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-4">
                    {content.sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            id={`section-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="p-6 sm:p-8 rounded-3xl scroll-mt-8"
                            style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
                        >
                            <h2 className="text-lg font-black mb-4 flex items-center gap-3" style={{ color: 'var(--color-text-primary)' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-brand)' }}>
                                    {section.icon}
                                </div>
                                {section.title}
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-left mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                                {section.content}
                            </p>
                            {section.subsections && section.subsections.length > 0 && (
                                <div className="space-y-2 pl-4" style={{ borderLeft: '2px solid var(--color-brand)', borderRadius: '0' }}>
                                    {section.subsections.map((sub, subIdx) => (
                                        <p key={subIdx} className="text-xs sm:text-sm leading-relaxed pl-4" style={{ color: 'var(--color-text-secondary)' }}>
                                            {sub}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 p-8 rounded-3xl text-center"
                    style={{ backgroundColor: 'var(--color-badge-bg)', border: '1px dashed var(--color-card-border)' }}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                            Son yenilənmə: {content.lastUpdated}
                        </p>
                    </div>
                    <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
                        Bu sənəd hüquqi məsləhət deyil. Hüquqi suallarınız üçün mütəxəssislə məsləhətləşməniz tövsiyə olunur.
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
        </div>
    );
};

export default LegalPage;
