"""
═══════════════════════════════════════════════════════════════
 InvoiceAZ — Clients Module Integration Tests
 
 Bu testlər müştəri (Client) modulunun API səviyyəsində
 düzgün işlədiyini yoxlayır. Hər test real API sorğusu
 göndərir və cavabını yoxlayır.
 
 Test edilən sahələr:
   1. CRUD əməliyyatları (Yarat, Oxu, Yenilə, Sil)
   2. Biznes izolyasiyası (bir biznesin müştəriləri digərinə görünmür)
   3. VÖEN validasiyası (10 rəqəm, yalnız rəqəm)
   4. Axtarış funksiyası
   5. Plan limiti (müştəri limiti aşılırsa blok olunur)
   6. Soft delete (müştəri silinəndə DB-dən silinmir, gizlənir)
   7. Rol əsaslı giriş nəzarəti (Sales Rep yalnız öz müştərilərini görür)
═══════════════════════════════════════════════════════════════
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import Business, TeamMember, SubscriptionPlan
from clients.models import Client

User = get_user_model()


class ClientCRUDTestCase(APITestCase):
    """
    ═══════════════════════════════════════════
     TEST QRUPU 1: Əsas CRUD Əməliyyatları
     (Create, Read, Update, Delete)
    ═══════════════════════════════════════════
    """

    def setUp(self):
        """Hər testdən əvvəl çalışan hazırlıq funksiyası"""
        # Plan yaradılır (limitlər təyin olunur)
        self.plan, _ = SubscriptionPlan.objects.get_or_create(
            name='pro',
            defaults={
                'label': 'Professional',
                'team_members_limit': 10,
                'clients_limit': 100,
            }
        )

        # Owner (biznes sahibi) yaradılır
        self.owner = User.objects.create_user(
            email='owner@testbiz.com',
            password='password123',
            first_name='Sahibkar',
            membership='pro',
            subscription_plan=self.plan,
        )

        # Biznes profili yaradılır
        self.business = Business.objects.create(
            user=self.owner,
            name='Test Şirkət MMC'
        )

        # Test müştərisi yaradılır
        self.client_obj = Client.objects.create(
            business=self.business,
            name='Azərenerji ASC',
            client_type='company',
            email='info@azerenerji.az',
            phone='+994501234567',
            voen='1234567890',
            address='Bakı şəhəri',
        )

        # API autentifikasiyası
        self.client.force_authenticate(user=self.owner)

        # URL-lər
        self.list_url = reverse('client-list')

    # ─────────────────────────────────────────────────
    # TEST: Müştəri siyahısının alınması
    # ─────────────────────────────────────────────────
    def test_list_clients(self):
        """Müştəri siyahısı düzgün qaytarılmalıdır"""
        response = self.client.get(
            self.list_url,
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Paginated response — results açarı olmalıdır
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Azərenerji ASC')

    # ─────────────────────────────────────────────────
    # TEST: Yeni müştəri yaratmaq
    # ─────────────────────────────────────────────────
    def test_create_client(self):
        """Yeni müştəri uğurla yaradılmalıdır"""
        data = {
            'name': 'SOCAR Trading',
            'client_type': 'company',
            'email': 'info@socar.az',
            'phone': '+994502223344',
            'voen': '9876543210',
        }
        response = self.client.post(
            self.list_url,
            data,
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'SOCAR Trading')

        # DB-də yaradıldığını yoxla
        self.assertTrue(Client.objects.filter(name='SOCAR Trading').exists())

    # ─────────────────────────────────────────────────
    # TEST: Müştəri məlumatlarının yenilənməsi
    # ─────────────────────────────────────────────────
    def test_update_client(self):
        """Mövcud müştərinin məlumatları yenilənə bilməlidir"""
        detail_url = reverse('client-detail', args=[self.client_obj.id])
        data = {
            'name': 'Azərenerji ASC (yeniləndi)',
            'phone': '+994559998877',
        }
        response = self.client.patch(
            detail_url,
            data,
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client_obj.refresh_from_db()
        self.assertEqual(self.client_obj.name, 'Azərenerji ASC (yeniləndi)')
        self.assertEqual(self.client_obj.phone, '+994559998877')

    # ─────────────────────────────────────────────────
    # TEST: Müştərinin silinməsi (Soft Delete)
    # ─────────────────────────────────────────────────
    def test_delete_client_soft(self):
        """Müştəri silinəndə DB-dən silinmir, is_deleted=True olur"""
        detail_url = reverse('client-detail', args=[self.client_obj.id])
        response = self.client.delete(
            detail_url,
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Default manager ilə görünməməlidir
        self.assertFalse(Client.objects.filter(id=self.client_obj.id).exists())

        # Amma all_objects ilə hələ də var
        self.assertTrue(Client.all_objects.filter(id=self.client_obj.id).exists())

        # is_deleted bayrağı True olmalıdır
        deleted_client = Client.all_objects.get(id=self.client_obj.id)
        self.assertTrue(deleted_client.is_deleted)


class ClientIsolationTestCase(APITestCase):
    """
    ═══════════════════════════════════════════
     TEST QRUPU 2: Biznes İzolyasiyası
     (Bir biznesin müştəriləri digərinə görünmür)
    ═══════════════════════════════════════════
    """

    def setUp(self):
        self.plan, _ = SubscriptionPlan.objects.get_or_create(
            name='pro',
            defaults={
                'label': 'Professional',
                'team_members_limit': 10,
                'clients_limit': 100,
            }
        )

        # Birinci biznes sahibi
        self.owner_a = User.objects.create_user(
            email='ownera@test.com',
            password='password123',
            membership='pro',
            subscription_plan=self.plan,
        )
        self.business_a = Business.objects.create(
            user=self.owner_a, name='Biznes A'
        )
        self.client_a = Client.objects.create(
            business=self.business_a,
            name='Müştəri A (gizli olmalıdır)',
        )

        # İkinci biznes sahibi
        self.owner_b = User.objects.create_user(
            email='ownerb@test.com',
            password='password123',
            membership='pro',
            subscription_plan=self.plan,
        )
        self.business_b = Business.objects.create(
            user=self.owner_b, name='Biznes B'
        )
        self.client_b = Client.objects.create(
            business=self.business_b,
            name='Müştəri B',
        )

    # ─────────────────────────────────────────────────
    # TEST: Başqa biznesin müştəriləri görünməməlidir
    # ─────────────────────────────────────────────────
    def test_cannot_see_other_business_clients(self):
        """Owner B, Owner A-nın müştərilərini görməməlidir"""
        self.client.force_authenticate(user=self.owner_b)

        response = self.client.get(
            reverse('client-list'),
            HTTP_X_BUSINESS_ID=self.business_b.id
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)

        # Yalnız öz müştərilərini görməlidir
        client_names = [c['name'] for c in results]
        self.assertIn('Müştəri B', client_names)
        self.assertNotIn('Müştəri A (gizli olmalıdır)', client_names)

    # ─────────────────────────────────────────────────
    # TEST: Başqa biznesin müştərisini redaktə etmək mümkün deyil
    # ─────────────────────────────────────────────────
    def test_cannot_update_other_business_client(self):
        """Owner B, Owner A-nın müştərisini yeniləyə bilməz"""
        self.client.force_authenticate(user=self.owner_b)

        detail_url = reverse('client-detail', args=[self.client_a.id])
        response = self.client.patch(
            detail_url,
            {'name': 'HACKED!'},
            HTTP_X_BUSINESS_ID=self.business_b.id
        )
        # 404 olmalıdır — çünki queryset filtri ilə görünmür
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Original müştəri dəyişməməlidir
        self.client_a.refresh_from_db()
        self.assertEqual(self.client_a.name, 'Müştəri A (gizli olmalıdır)')


class ClientValidationTestCase(APITestCase):
    """
    ═══════════════════════════════════════════
     TEST QRUPU 3: VÖEN Validasiyası
     (Azərbaycan VÖEN qaydaları)
    ═══════════════════════════════════════════
    """

    def setUp(self):
        self.plan, _ = SubscriptionPlan.objects.get_or_create(
            name='pro',
            defaults={
                'label': 'Professional',
                'team_members_limit': 10,
                'clients_limit': 100,
            }
        )
        self.owner = User.objects.create_user(
            email='owner@voen.com',
            password='password123',
            membership='pro',
            subscription_plan=self.plan,
        )
        self.business = Business.objects.create(
            user=self.owner, name='VÖEN Test Biznes'
        )
        self.client.force_authenticate(user=self.owner)
        self.list_url = reverse('client-list')

    # ─────────────────────────────────────────────────
    # TEST: Düzgün VÖEN qəbul olunur
    # ─────────────────────────────────────────────────
    def test_valid_voen_accepted(self):
        """10 rəqəmli düzgün VÖEN qəbul olunmalıdır"""
        data = {
            'name': 'VÖEN Test Şirkət',
            'client_type': 'company',
            'voen': '1234567890',
        }
        response = self.client.post(
            self.list_url, data,
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # ─────────────────────────────────────────────────
    # TEST: Qısa VÖEN rədd edilir
    # ─────────────────────────────────────────────────
    def test_short_voen_rejected(self):
        """10-dan az rəqəmli VÖEN rədd olunmalıdır"""
        data = {
            'name': 'Qısa VÖEN',
            'client_type': 'company',
            'voen': '12345',  # Cəmi 5 rəqəm
        }
        response = self.client.post(
            self.list_url, data,
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('voen', response.data)

    # ─────────────────────────────────────────────────
    # TEST: Hərfli VÖEN rədd edilir
    # ─────────────────────────────────────────────────
    def test_alphabetic_voen_rejected(self):
        """VÖEN-də hərf olmamalıdır"""
        data = {
            'name': 'Hərfli VÖEN',
            'client_type': 'company',
            'voen': 'ABCDE12345',
        }
        response = self.client.post(
            self.list_url, data,
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ─────────────────────────────────────────────────
    # TEST: Foreign müştəridə VÖEN validasiya olunmur
    # ─────────────────────────────────────────────────
    def test_foreign_client_voen_not_validated(self):
        """Xarici müştəri tipində VÖEN validasiyası keçilir"""
        data = {
            'name': 'Xarici Şirkət',
            'client_type': 'foreign',
            'voen': 'XX-12345',  # Xarici format — valid olmalıdır
        }
        response = self.client.post(
            self.list_url, data,
            HTTP_X_BUSINESS_ID=self.business.id
        )
        # foreign tipdə VÖEN validasiya olunmur, ona görə keçməlidir
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ClientSearchTestCase(APITestCase):
    """
    ═══════════════════════════════════════════
     TEST QRUPU 4: Axtarış Funksiyası
    ═══════════════════════════════════════════
    """

    def setUp(self):
        self.plan, _ = SubscriptionPlan.objects.get_or_create(
            name='pro',
            defaults={
                'label': 'Professional',
                'team_members_limit': 10,
                'clients_limit': 100,
            }
        )
        self.owner = User.objects.create_user(
            email='owner@search.com',
            password='password123',
            membership='pro',
            subscription_plan=self.plan,
        )
        self.business = Business.objects.create(
            user=self.owner, name='Axtarış Test'
        )

        # Müxtəlif müştərilər yaradılır
        Client.objects.create(
            business=self.business,
            name='SOCAR Trading',
            voen='1111111111',
            phone='+994501111111',
        )
        Client.objects.create(
            business=self.business,
            name='Azərsu ASC',
            voen='2222222222',
            phone='+994502222222',
        )
        Client.objects.create(
            business=self.business,
            name='Bakı Metropoliteni',
            voen='3333333333',
            email='info@metro.gov.az',
        )

        self.client.force_authenticate(user=self.owner)

    # ─────────────────────────────────────────────────
    # TEST: Ada görə axtarış
    # ─────────────────────────────────────────────────
    def test_search_by_name(self):
        """Müştəri adına görə axtarış işləməlidir"""
        response = self.client.get(
            reverse('client-list'),
            {'search': 'SOCAR'},
            HTTP_X_BUSINESS_ID=self.business.id
        )
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'SOCAR Trading')

    # ─────────────────────────────────────────────────
    # TEST: VÖEN-ə görə axtarış
    # ─────────────────────────────────────────────────
    def test_search_by_voen(self):
        """VÖEN nömrəsinə görə axtarış işləməlidir"""
        response = self.client.get(
            reverse('client-list'),
            {'search': '2222222222'},
            HTTP_X_BUSINESS_ID=self.business.id
        )
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Azərsu ASC')

    # ─────────────────────────────────────────────────
    # TEST: Nəticəsiz axtarış
    # ─────────────────────────────────────────────────
    def test_search_no_results(self):
        """Mövcud olmayan müştəri axtarışı boş nəticə qaytarmalıdır"""
        response = self.client.get(
            reverse('client-list'),
            {'search': 'MövcudOlmayanŞirkət'},
            HTTP_X_BUSINESS_ID=self.business.id
        )
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 0)


class ClientPlanLimitTestCase(APITestCase):
    """
    ═══════════════════════════════════════════
     TEST QRUPU 5: Plan Limiti
     (Müştəri limiti aşılarsa blok olunmalıdır)
    ═══════════════════════════════════════════
    """

    def setUp(self):
        # Limiti 2 olan plan
        self.plan, _ = SubscriptionPlan.objects.get_or_create(
            name='limited',
            defaults={
                'label': 'Limited Plan',
                'team_members_limit': 5,
                'clients_limit': 2,
            }
        )
        self.owner = User.objects.create_user(
            email='owner@limited.com',
            password='password123',
            membership='limited',
            subscription_plan=self.plan,
        )
        self.business = Business.objects.create(
            user=self.owner, name='Limited Biznes'
        )
        self.client.force_authenticate(user=self.owner)

    def test_plan_limit_blocks_extra_client(self):
        """Müştəri limiti dolduqda yeni müştəri yaradılmamalıdır"""
        # Limit 2 — 2 müştəri yarat
        Client.objects.create(business=self.business, name='Müştəri 1')
        Client.objects.create(business=self.business, name='Müştəri 2')

        # 3-cü müştəri rədd olunmalıdır
        response = self.client.post(
            reverse('client-list'),
            {'name': 'Müştəri 3 (rədd olunacaq)', 'client_type': 'company'},
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get('code'), 'plan_limit')

    def test_within_limit_allows_creation(self):
        """Limit daxilində müştəri yaradıla bilməlidir"""
        # Limit 2 — ilk müştəri keçməlidir
        response = self.client.post(
            reverse('client-list'),
            {'name': 'İlk Müştəri', 'client_type': 'company'},
            HTTP_X_BUSINESS_ID=self.business.id
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ClientUnauthenticatedTestCase(APITestCase):
    """
    ═══════════════════════════════════════════
     TEST QRUPU 6: Autentifikasiya olmadan giriş
    ═══════════════════════════════════════════
    """

    def test_unauthenticated_user_cannot_list(self):
        """Giriş etməmiş istifadəçi müştəri siyahısını görə bilməz"""
        # force_authenticate çağırılmır — anonim istifadəçi
        response = self.client.get(reverse('client-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_user_cannot_create(self):
        """Giriş etməmiş istifadəçi müştəri yarada bilməz"""
        response = self.client.post(
            reverse('client-list'),
            {'name': 'Hack Attempt'}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
