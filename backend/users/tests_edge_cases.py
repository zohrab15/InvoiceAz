from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import TeamMember, TeamMemberInvitation, Business, SubscriptionPlan
from decimal import Decimal

User = get_user_model()

class EdgeCaseFunctionalTestCase(APITestCase):
    def setUp(self):
        # 1. Setup Subscription Plans
        self.free_plan, _ = SubscriptionPlan.objects.get_or_create(
            name='free',
            defaults={'label': 'Pulsuz', 'team_members_limit': 0}
        )
        self.pro_plan, _ = SubscriptionPlan.objects.get_or_create(
            name='pro',
            defaults={'label': 'Pro', 'team_members_limit': 10}
        )
        
        # 2. Setup Users
        self.owner = User.objects.create_user(
            email='owner@edge.com',
            password='password123',
            membership='pro',
            subscription_plan=self.pro_plan
        )
        
        # 3. Setup Business
        self.business = Business.objects.create(user=self.owner, name='Edge Test Business')
        
        self.manager = User.objects.create_user(email='manager@edge.com', password='password123')
        TeamMember.objects.create(owner=self.owner, business=self.business, user=self.manager, role='MANAGER')
        
        self.rep1 = User.objects.create_user(email='rep1@edge.com', password='password123')
        self.rep2 = User.objects.create_user(email='rep2@edge.com', password='password123')
        
        self.unrelated_user = User.objects.create_user(email='hacker@edge.com', password='password123')
        
        
        self.client.force_authenticate(user=self.owner)

    def test_plan_limit_enforcement(self):
        """Verify that inviting more members than the plan allows returns an error."""
        # Force a small limit for this specific test
        self.pro_plan.team_members_limit = 2
        self.pro_plan.save()

        # Current members: 1 (manager from setUp). 
        # Add 1 more (Rep 1)
        TeamMember.objects.create(owner=self.owner, business=self.business, user=self.rep1, role='SALES_REP')
        
        # Now try to add a 3rd person (should fail because 1 manager + 1 rep = 2, which is the limit)
        url = reverse('team-list')
        data = {'email': 'rep2@edge.com', 'role': 'SALES_REP'}
        response = self.client.post(url, data, HTTP_X_BUSINESS_ID=str(self.business.id))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get('code'), 'plan_limit')

    def test_duplicate_invitation_prevention(self):
        """Sending the same invitation twice should be blocked."""
        url = reverse('team-list')
        data = {'email': 'external@edge.com', 'role': 'SALES_REP'}
        
        # First one succeeds (creates invitation)
        self.client.post(url, data, HTTP_X_BUSINESS_ID=str(self.business.id))
        # Second one fails
        response = self.client.post(url, data, HTTP_X_BUSINESS_ID=str(self.business.id))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("dəvət göndərilib", str(response.data.get('detail', '')))

    def test_self_invitation_blocked(self):
        """Owner should not be able to invite themselves to their own team."""
        url = reverse('team-list')
        data = {'email': self.owner.email, 'role': 'MANAGER'}
        response = self.client.post(url, data, HTTP_X_BUSINESS_ID=str(self.business.id))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Özünüzü komandaya əlavə edə bilməzsiniz", str(response.data.get('detail', '')))

    def test_manager_cannot_delete_other_manager(self):
        """Cross-manager deletion should be restricted."""
        # Create second manager
        manager2 = User.objects.create_user(email='manager2@edge.com', password='password123')
        tm2 = TeamMember.objects.create(owner=self.owner, business=self.business, user=manager2, role='MANAGER')
        
        # Auth as Manager 1
        self.client.force_authenticate(user=self.manager)
        
        url = reverse('team-detail', args=[tm2.id])
        response = self.client.delete(url, HTTP_X_BUSINESS_ID=str(self.business.id))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Menecerlər digər menecerləri silə bilməz", str(response.data.get('detail', '')))

    def test_manager_cannot_update_own_role(self):
        """A manager should not be able to change their own role or target."""
        tm_manager = TeamMember.objects.get(user=self.manager)
        
        self.client.force_authenticate(user=self.manager)
        url = reverse('team-detail', args=[tm_manager.id])
        
        # Try to change role
        response = self.client.patch(url, {'role': 'ACCOUNTANT'}, HTTP_X_BUSINESS_ID=str(self.business.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthorized_user_cannot_access_team(self):
        """A user not in the team or owner should have zero visibility."""
        self.client.force_authenticate(user=self.unrelated_user)
        
        url = reverse('team-list')
        response = self.client.get(url, HTTP_X_BUSINESS_ID=str(self.business.id))
        
        # They get empty list because queryset filters by owner
        # but let's check a direct detail access instead
        tm_rep = TeamMember.objects.create(owner=self.owner, business=self.business, user=self.rep1, role='SALES_REP')
        url_detail = reverse('team-detail', args=[tm_rep.id])
        response_detail = self.client.get(url_detail, HTTP_X_BUSINESS_ID=str(self.business.id))
        
        self.assertEqual(response_detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_email_case_insensitivity(self):
        """Invitations should handle emails case-insensitively."""
        url = reverse('team-list')
        # Create user with lowercase
        User.objects.create_user(email='case@test.com', password='password123')
        
        # Invite with UPPERCASE
        data = {'email': 'CASE@TEST.COM', 'role': 'SALES_REP'}
        response = self.client.post(url, data, HTTP_X_BUSINESS_ID=str(self.business.id))
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TeamMember.objects.filter(user__email='case@test.com').exists())

    def test_target_limit_boundaries(self):
        """Test numeric boundaries for sales targets."""
        tm_rep = TeamMember.objects.create(owner=self.owner, business=self.business, user=self.rep1, role='SALES_REP')
        url = reverse('team-detail', args=[tm_rep.id])
        
        # 0 is valid
        response = self.client.patch(url, {'monthly_target': 0}, HTTP_X_BUSINESS_ID=str(self.business.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Large number is valid (up to max_digits)
        response = self.client.patch(url, {'monthly_target': 99999999.99}, HTTP_X_BUSINESS_ID=str(self.business.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
