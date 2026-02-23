from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import TeamMember, TeamMemberInvitation, Business, SubscriptionPlan
from decimal import Decimal

User = get_user_model()

class SalesRepFunctionalTestCase(APITestCase):
    def setUp(self):
        # Create Subscription Plan with team limits
        self.plan, _ = SubscriptionPlan.objects.get_or_create(
            name='premium',
            defaults={
                'label': 'Premium',
                'team_members_limit': 10
            }
        )
        
        # Create Owner
        self.owner = User.objects.create_user(
            email='owner@test.com',
            password='password123',
            first_name='Owner',
            membership='premium',
            subscription_plan=self.plan
        )
        
        # Create Business
        self.business = Business.objects.create(
            user=self.owner,
            name='Test Biz'
        )
        
        # Create another user for Sales Rep
        self.rep_user = User.objects.create_user(
            email='rep@test.com',
            password='password123',
            first_name='Rep'
        )
        
        # AUTH as Owner
        self.client.force_authenticate(user=self.owner)

    def test_owner_can_invite_sales_rep(self):
        """Owner can invite a user to the team by email."""
        url = reverse('team-list')
        data = {
            'email': 'new_rep@test.com',
            'role': 'SALES_REP'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(TeamMemberInvitation.objects.filter(email='new_rep@test.com').exists())

    def test_owner_can_add_existing_user(self):
        """Owner can directly add an existing user as a Sales Rep."""
        url = reverse('team-list')
        data = {
            'email': 'rep@test.com',
            'role': 'SALES_REP'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TeamMember.objects.filter(owner=self.owner, user=self.rep_user).exists())

    def test_owner_can_update_rep_target(self):
        """Owner can set/update a Sales Rep's monthly sales target."""
        member = TeamMember.objects.create(owner=self.owner, user=self.rep_user, role='SALES_REP')
        
        url = reverse('team-detail', args=[member.id])
        data = {'monthly_target': 1000.50}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        member.refresh_from_db()
        self.assertEqual(member.monthly_target, Decimal('1000.50'))

    def test_sales_rep_cannot_update_own_target(self):
        """Sales Rep should not be able to change their own target."""
        member = TeamMember.objects.create(owner=self.owner, user=self.rep_user, role='SALES_REP')
        
        # Authenticate as Rep
        self.client.force_authenticate(user=self.rep_user)
        
        url = reverse('team-detail', args=[member.id])
        data = {'monthly_target': 99999}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sales_rep_can_update_location(self):
        """Sales Rep can update their current GPS coordinates."""
        TeamMember.objects.create(owner=self.owner, user=self.rep_user, role='SALES_REP')
        self.client.force_authenticate(user=self.rep_user)
        
        url = reverse('team_location')
        data = {
            'latitude': 40.123456,
            'longitude': 49.654321
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        member = TeamMember.objects.get(user=self.rep_user)
        self.assertEqual(float(member.last_latitude), 40.123456)
        self.assertEqual(float(member.last_longitude), 49.654321)

    def test_unauthorized_role_cannot_invite(self):
        """Users with roles other than OWNER or MANAGER cannot invite members."""
        accountant_user = User.objects.create_user(email='accountant@test.com', password='password123')
        TeamMember.objects.create(owner=self.owner, user=accountant_user, role='ACCOUNTANT')
        
        self.client.force_authenticate(user=accountant_user)
        
        url = reverse('team-list')
        data = {'email': 'some@test.com', 'role': 'SALES_REP'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_invite_rep(self):
        """Managers have the authority to invite new Sales Representatives."""
        # Create a manager
        manager_user = User.objects.create_user(email='manager@test.com', password='password123')
        TeamMember.objects.create(owner=self.owner, user=manager_user, role='MANAGER')
        
        # Auth as manager
        self.client.force_authenticate(user=manager_user)
        
        url = reverse('team-list')
        data = {'email': 'repv2@test.com', 'role': 'SALES_REP'}
        response = self.client.post(url, data)
        # Note: In the view, inviting as a manager uses the owner of the inviter as the corporate_owner
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(TeamMemberInvitation.objects.filter(inviter=self.owner, email='repv2@test.com').exists())
