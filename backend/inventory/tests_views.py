from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import Business, SubscriptionPlan
from inventory.models import Warehouse, Product
from django.test import override_settings

User = get_user_model()

@override_settings(SECURE_SSL_REDIRECT=False)
class InventoryViewsTestCase(APITestCase):
    def setUp(self):
        plan = SubscriptionPlan.objects.create(name='pro', label='Pro', products_limit=100)
        self.user = User.objects.create_user(email='testviews@inventory.com', password='password', subscription_plan=plan)
        self.business = Business.objects.create(name='Test Business', user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_warehouse_list_and_create(self):
        url = reverse('warehouse-list')
        data = {'name': 'New Warehouse', 'location': 'Baku'}
        
        # Create
        response = self.client.post(url, data, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Warehouse.objects.count(), 1)
        
        # List
        response = self.client.get(url, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_product_list_and_create(self):
        url = reverse('product-list')
        data = {
            'name': 'API Product',
            'sku': 'API-001',
            'base_price': '10.00'
        }
        
        # Create
        response = self.client.post(url, data, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        
        # List
        response = self.client.get(url, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
