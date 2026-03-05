from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import Business, SubscriptionPlan
from clients.models import Client
from invoices.models import Invoice, Expense
from django.test import override_settings
from django.utils import timezone

User = get_user_model()

@override_settings(SECURE_SSL_REDIRECT=False)
class InvoiceViewSetTestCase(APITestCase):
    def setUp(self):
        plan = SubscriptionPlan.objects.create(name='pro', label='Pro')
        self.user = User.objects.create_user(email='test@invoicesviews.com', password='password', subscription_plan=plan)
        self.business = Business.objects.create(name='Test Business', user=self.user)
        self.client_obj = Client.objects.create(name='Test Client', business=self.business)
        self.client.force_authenticate(user=self.user)

    def test_list_invoices(self):
        Invoice.objects.create(business=self.business, client=self.client_obj, invoice_date=timezone.now().date(), due_date=timezone.now().date())
        url = reverse('invoice-list')
        response = self.client.get(url, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_invoice(self):
        url = reverse('invoice-list')
        data = {
            'client': self.client_obj.id,
            'invoice_date': '2023-01-01',
            'due_date': '2023-01-15',
            'status': 'draft',
            'items': [
                {'description': 'Test Service', 'quantity': 1, 'unit_price': 100.00}
            ]
        }
        response = self.client.post(url, data, format='json', HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Invoice.objects.filter(business=self.business).exists())

@override_settings(SECURE_SSL_REDIRECT=False)
class ExpenseViewSetTestCase(APITestCase):
    def setUp(self):
        plan = SubscriptionPlan.objects.create(name='pro2', label='Pro2')
        self.user = User.objects.create_user(email='test2@invoicesviews.com', password='password', subscription_plan=plan)
        self.business = Business.objects.create(name='Test Business', user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_list_expenses(self):
        Expense.objects.create(business=self.business, description='Office', amount=50.00, date=timezone.now().date())
        url = reverse('expense-list')
        response = self.client.get(url, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_expense(self):
        url = reverse('expense-list')
        data = {
            'description': 'Travel',
            'amount': '120.00',
            'date': '2023-01-01',
            'category': 'travel'
        }
        response = self.client.post(url, data, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Expense.objects.filter(business=self.business, description='Travel').exists())
