# InvoiceAZ Project Blueprint & Architecture (v1.0)

## 1. Layihənin Məqsədi
InvoiceAZ - kiçik və orta sahibkarlar üçün nəzərdə tutulmuş, komanda idarəetməsi, faktura (invoice) yaradılması, xərclərin izlənilməsi və analitika platformasıdır.

## 2. Texnoloji Stack
- **Backend:** Django Rest Framework (DRF)
- **Frontend:** React.js (Vite, Tailwind CSS, Lucide Icons)
- **Məlumat Bazası:** PostgreSQL
- **State Management:** React Query (Məlumat sinxronizasiyası üçün) və Zustand (Auth/Global state üçün)

## 3. Əsas Memarlıq Prinsipləri

### 3.1. Biznes İzolyasiyası (Multi-Business Architecture)
Sistem "Business-Centric" (Biznes mərkəzli) model üzərində qurulub. 
- Bir istifadəçi (Owner) bir neçə fərqli biznes profili yarada bilər.
- Hər bir biznesin öz müştəriləri, fakturaları, xərcləri və **komandası** var.
- **Variant B (Strict Isolation):** Komanda üzvləri (Team Members) yalnız dəvət olunduqları konkret biznesin məlumatlarını görə bilərlər. Business ID (X-Business-ID header vasitəsilə) backend səviyyəsində hər bir sorğuda yoxlanılır.

### 3.2. Çoxsaylı Üzvlük Dəstəyi (Multi-membership Support)
Sistem bir istifadəçinin eyni vaxtda bir neçə fərqli biznesin komandasında olmasını dəstəkləyir.
- **Müstəqil Rollar:** İstifadəçi "Biznes A"-da **Manager**, "Biznes B"-də isə **Sales Rep** ola bilər.
- **Kontekst Keçidi:** İstifadəçi interfeysində (Sidebar) biznesi dəyişən an, sistem avtomatik olaraq həmin biznesə aid olan rol və icazələri aktivləşdirir.
- **Məlumat Məxfiliyi:** Eyni istifadəçi olsa dahi, bir biznesin məlumatları digər biznesin sessiyasına sızmır.

### 3.3. Rol Əsaslı Giriş Nəzarəti (RBAC)
Sistemdə aşağıdakı rollar mövcuddur:
- **OWNER:** Biznesin sahibi. Tam səlahiyyət (Silmə, Plan dəyişmə, Komanda idarəetməsi).
- **MANAGER:** Sahibin sağ əli. Demək olar ki, bütün idarəetmə səlahiyyətləri (ancaq biznesi silə bilməz).
- **ACCOUNTANT:** Maliyyə və Hesabatlar fokuslu. Faktura və xərclərə giriş, lakin texniki sazlamalara məhdudiyyət.
- **SALES_REP:** Satış təmsilçisi. Yalnız öz müştəriləri və fakturaları üzərində işləyir. GPS izləməsi mövcuddur.
- **INVENTORY_MANAGER:** Stok idarəetməsi. Məhsullar və anbar analitikasına giriş.

## 4. Əsas Funksionallıqlar

### 4.1. White-labeling (Ağ Etiket)
Premium plan istifadəçiləri üçün InvoiceAZ brendinqi (footerlərdəki "Powered by InvoiceAZ") gizlədilir. Bu həm PDF fakturalarda, həm də ictimai baxış (Public View) səhifələrində tətbiq olunur.

### 4.2. Faktura və PDF Generasiyası
- Dinamik template-lər (Modern, Classic, Minimal).
- Azərbaycan dilində simvolları (ə, ö, ğ və s.) tam dəstəkləyən Base64 font embedding sistemi.
- Fakturaların statusları (Gözləyən, Ödənilmiş, Gecikmiş).

### 4.3. Komanda və Dəvət Sistemi
- Email vasitəsilə işçilərin dəvət olunması.
- Rolun təyin edilməsi və biznesə bağlanması.
- Qeydiyyatdan keçməmiş istifadəçilər üçün avtomatik qoşulma məntiqi.

## 5. Mədaumat Bazası Modeli (Core Models)
- `User`: CRM istifadəçisi.
- `Business`: Sahibkarın qeydiyyatdan keçirdiyi hər bir şirkət vahidi.
- `TeamMember`: İstifadəçinin hansı biznesdə hansı rola malik olduğunu göstərən bağlayıcı model.
- `TeamMemberInvitation`: Gözləyən komanda dəvətləri.
- `Client`: Müştəri bazası.
- `Invoice` & `InvoiceItem`: Satış sənədləri.
- `SubscriptionPlan`: Limit və imkanların idarə edilməsi.

---
*Qeyd: Bu sənəd canlıdır və layihəyə yeni funksiyalar əlavə olunduqca yenilənir.*
