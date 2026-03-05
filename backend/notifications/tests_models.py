from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import Business
from notifications.models import Notification, NotificationSetting, ActivityLog
from notifications.utils import create_notification, log_activity

User = get_user_model()

class NotificationsModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@notifications.com', password='password')
        self.business = Business.objects.create(name='Test Business', user=self.user)

    def test_notification_creation(self):
        notification = Notification.objects.create(
            user=self.user,
            business=self.business,
            title='Test Title',
            message='Test Message'
        )
        self.assertEqual(str(notification), f"{self.user.email} - Test Title")

    def test_notification_setting_creation(self):
        setting, _ = NotificationSetting.objects.get_or_create(user=self.user)
        self.assertEqual(str(setting), f"Settings for {self.user.email}")
        self.assertTrue(setting.in_app_invoice_created)

    def test_activity_log_creation(self):
        log = ActivityLog.objects.create(
            business=self.business,
            user=self.user,
            action='LOGIN',
            module='AUTH',
            description='User logged in'
        )
        self.assertIn('Giriş', str(log))
        self.assertIn('User logged in', str(log))

    def test_utils_create_notification(self):
        notification = create_notification(
            user=self.user,
            business=self.business,
            title='Util Title',
            message='Util Message',
            type='success'
        )
        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, 'Util Title')

    def test_utils_log_activity(self):
        log = log_activity(
            business=self.business,
            user=self.user,
            action='UPDATE',
            module='SETTINGS',
            description='Updated settings'
        )
        self.assertEqual(log.action, 'UPDATE')
        self.assertEqual(log.user_role, 'OWNER')
