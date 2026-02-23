# InvoiceAZ - Peşəkar Biznes İdarəetmə Platforması

InvoiceAZ, kiçik və orta ölçülü müəssisələr üçün maliyyə əməliyyatlarını, anbar idarəetməsini və komanda fəaliyyətlərini sadələşdirmək üçün hazırlanmış genişmiqyaslı bulud əsaslı (SaaS) platformadır. Müasir texnoloji stek ilə qurulmuş bu sistem, biznes sahiblərinə öz əməliyyatlarını rəqəmsallaşdırmaq üçün kəsintisiz və təhlükəsiz təcrübə təqdim edir.

## 🚀 Əsas Funksiyalar

### 📊 Maliyyə Paneli (Dashboard)
- **Real Vaxt Rejimində Xülasə:** Gəlir, xərc, xalis mənfəət və gözləyən ödənişləri bir baxışda izləyin.
- **Performans Qrafikləri:** Nağd pul axını trendlərinin və maliyyə vəziyyətinin interaktiv vizuallaşdırılması.
- **Son Fəaliyyətlər:** Ən son əməliyyatların, fakturaların və xərc qeydlərinin mərkəzləşdirilmiş siyahısı.

### 📄 Ağıllı Fakturasiya
- **Sürətli Yaradılma:** Avtomatik doldurulan məhsul və müştəri məlumatları ilə sürətli faktura generasiyası.
- **Peşəkar PDF:** Biznes brendinqi və loqoları ilə avtomatik hazırlanan yüksək keyfiyyətli PDF sənədlər.
- **İctimai İzləmə:** Şəffaflıq üçün "baxıldı/baxılmadı" statusu olan paylaşıla bilən ictimai linklər.
- **Həyat Dövrü İdarəetməsi:** Fakturaları "Qaralama" və "Göndərildi" statusundan "Ödənildi" və "Gecikmiş" statusuna qədər izləyin.

### 📦 Anbar və Məhsul İdarəetməsi
- **QR/Barkod Skaner:** Mobil kamera və ya skaner cihazlarından istifadə edərək məhsul axtarışı və satışa əlavə etmə.
- **Stok Nəzarəti:** Satış zamanı məhsul sayının avtomatik azaldılması ilə real vaxtda stok izlənməsi.
- **Kritik Səviyyə Xəbərdarlıqları:** Məhsullar minimum stok səviyyəsindən aşağı düşdükdə vizual indikatorlar və bildirişlər.
- **Toplu İdxal/İxrac:** Excel inteqrasiyası vasitəsilə böyük məhsul siyahılarının rahat idarə edilməsi.

### 💰 Xərc və Büdcə İdarəetməsi
- **Kateqoriya Analizi:** Xərcləri (İcarə, Maaş, Marketinq və s.) daha yaxşı nəzarət üçün kateqoriyalara bölün.
- **Ağıllı Bildirişlər:** Aylıq xərclər təyin edilmiş büdcə limitlərinə yaxınlaşdıqda və ya keçdikdə avtomatik xəbərdarlıqlar.
- **Sənəd Arxivi:** Qəbzlərin və əməliyyat sənədlərinin rəqəmsal arxivləşdirilməsi.

### 📈 Qabaqcıl Analitika və AI
- **Ağıllı Proqnozlaşdırma:** Növbəti 3 ay üçün süni intellekt (AI) əsaslı gəlir və nağd pul axını proqnozları.
- **Vergi Hesabatlılığı:** Rüblük və illik vergi dövrləri üçün avtomatik hazırlanan xülasələr.
- **Problemli Faktura Analizi:** Gecikmiş ödənişləri olan müştərilərin müəyyən edilməsi və xatırlatma alətləri.

### 👥 Komanda və Rol İdarəetməsi (RBAC)
- **Dəqiq İcazələr:** Sahib (Owner), Menecer, Mühasib, Anbar Meneceri və Satış Təmsilçisi kimi öncədən təyin edilmiş rollar.
- **Satış Təmsilçilərinin İzlənməsi:** Sahə nümayəndələri üçün real vaxtda GPS yerləşmə izlənməsi və aylıq satış hədəflərinin idarə edilməsi.
- **Dəvət Sistemi:** Peşəkar təşkilatınızı böyütmək üçün təhlükəsiz e-poçt əsaslı dəvət axını.

## 🛠 Texnoloji Stek

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, TanStack Query (React Query).
- **Backend:** Django 5.1, Django REST Framework (DRF), PostgreSQL.
- **Autentifikasiya:** JWT (JSON Web Tokens), Google OAuth inteqrasiyası, 2FA dəstəyi.
- **State Management:** Zustand.
- **Deployment:** Vercel (Frontend), Render (Backend).

## 🧪 Testləşdirmə və Keyfiyyət Təminatı

Layihə biznes məntiqinə və təhlükəsizliyə yönəlmiş güclü test paketini ehtiva edir:
- **Funksional Testlər:** Dəvət sistemi, rol-əsaslı giriş nəzarəti və əsas API əməliyyatlarının geniş sınağı.
- **Kənar Halların (Edge Case) Testi:** Plan limitlərinin, özünü-referans qorumalarının və məlumat bütövlüyü sərhədlərinin yoxlanılması.

Testləri işə salmaq üçün:
```bash
python manage.py test users.tests_sales_rep
python manage.py test users.tests_edge_cases
```

## 🏗 Quraşdırılma

### Tələblər
- Python 3.10+
- Node.js 18+

### Backend Quraşdırılması
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (və ya Windows-da `venv\Scripts\activate`)
4. `pip install -r requirements.txt`
5. `python manage.py migrate`
6. `python manage.py runserver`

### Frontend Quraşdırılması
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---
*InvoiceAZ - Rəqəmsal mükəmməllik vasitəsilə biznesləri gücləndiririk.*
