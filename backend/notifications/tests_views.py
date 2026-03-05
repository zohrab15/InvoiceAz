from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import Business, SubscriptionPlan
from notifications.models import Notification, NotificationSetting, ActivityLog
from django.test import override_settings

User = get_user_model()

@override_settings(SECURE_SSL_REDIRECT=False)
class NotificationsViewsTestCase(APITestCase):
    def setUp(self):
        plan = SubscriptionPlan.objects.create(name='pro', label='Pro')
        self.user = User.objects.create_user(email='testviews@notifications.com', password='password', subscription_plan=plan)
        self.business = Business.objects.create(name='Test Business', user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_notification_list_and_read(self):
        notif = Notification.objects.create(user=self.user, business=self.business, title='N1', message='M1')
        
        url_list = reverse('notification-list')
        response = self.client.get(url_list, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, dict) and 'results' in response.data:
            self.assertGreaterEqual(len(response.data['results']), 1)
        else:
            self.assertGreaterEqual(len(response.data), 1)

        url_read = reverse('notification-mark-as-read', kwargs={'pk': notif.id})
        response = self.client.post(url_read)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_notification_mark_all_read(self):
        Notification.objects.create(user=self.user, business=self.business, title='N1', message='M1')
        Notification.objects.create(user=self.user, business=self.business, title='N2', message='M2')

        url = reverse('notification-mark-all-as-read')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Notification.objects.filter(user=self.user, is_read=False).exists())

    def test_notification_settings_me(self):
        url = reverse('notification-settings-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        patch_response = self.client.patch(url, {'in_app_invoice_created': False}, format='json')
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertFalse(patch_response.data['in_app_invoice_created'])

    def test_activity_log_list(self):
        ActivityLog.objects.create(business=self.business, user=self.user, description='Action 1')
        url = reverse('activity-logs-list')
        response = self.client.get(url, HTTP_X_BUSINESS_ID=self.business.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, dict) and 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
        else:
            self.assertEqual(len(response.data), 1)
