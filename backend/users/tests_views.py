from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import override_settings
import pyotp

User = get_user_model()

@override_settings(SECURE_SSL_REDIRECT=False)
class UserViewsTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@views.com', 
            password='oldpassword123',
            first_name='View',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_user_me_get(self):
        url = reverse('user_me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'user@views.com')

    def test_user_me_patch(self):
        url = reverse('user_me')
        response = self.client.patch(url, {'first_name': 'NewName'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'NewName')

    def test_password_change(self):
        url = reverse('change_password')
        data = {
            'old_password': 'oldpassword123',
            'new_password': 'newpassword123',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.user.check_password('newpassword123'))

    def test_password_change_wrong_old(self):
        url = reverse('change_password')
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_account(self):
        url = reverse('delete_account')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(email='user@views.com').exists())

@override_settings(SECURE_SSL_REDIRECT=False)
class TwoFactorAuthTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='2fa@views.com', password='foo')
        self.client.force_authenticate(user=self.user)

    def test_generate_2fa(self):
        url = reverse('2fa_generate')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('secret', response.data)
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.totp_secret)

    def test_enable_2fa(self):
        self.user.totp_secret = pyotp.random_base32()
        self.user.save()
        
        totp = pyotp.TOTP(self.user.totp_secret)
        code = totp.now()
        
        url = reverse('2fa_enable')
        response = self.client.post(url, {'code': code})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_2fa_enabled)

    def test_disable_2fa(self):
        self.user.is_2fa_enabled = True
        self.user.totp_secret = 'SOMESECRET'
        self.user.save()

        url = reverse('2fa_disable')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_2fa_enabled)
        self.assertIsNone(self.user.totp_secret)

@override_settings(SECURE_SSL_REDIRECT=False)
class SessionViewsTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='session@views.com', password='foo')
        self.client.force_authenticate(user=self.user)
        # Create a refresh token to simulate a session
        self.refresh = RefreshToken.for_user(self.user)

    def test_list_sessions(self):
        url = reverse('session_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    def test_revoke_session(self):
        # find the outstanding token
        token = OutstandingToken.objects.get(user=self.user)
        url = reverse('revoke_session', args=[token.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(BlacklistedToken.objects.filter(token=token).exists())

@override_settings(SECURE_SSL_REDIRECT=False)
class LogoutViewTestCase(APITestCase):
    def test_logout(self):
        user = User.objects.create_user(email='logout@views.com', password='foo')
        self.client.force_authenticate(user=user)
        url = reverse('logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
