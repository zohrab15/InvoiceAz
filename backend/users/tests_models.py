from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import SubscriptionPlan, Business, TeamMember, DiscountCoupon, TeamMemberInvitation

User = get_user_model()

class CustomUserManagerTests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(email='normal@user.com', password='foo')
        self.assertEqual(user.email, 'normal@user.com')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password('foo'))

    def test_create_user_no_email(self):
        with self.assertRaisesMessage(ValueError, 'The Email must be set'):
            User.objects.create_user(email='', password='foo')

    def test_create_superuser(self):
        admin_user = User.objects.create_superuser(email='super@user.com', password='foo')
        self.assertEqual(admin_user.email, 'super@user.com')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_create_superuser_is_staff_false(self):
        with self.assertRaisesMessage(ValueError, 'Superuser must have is_staff=True.'):
            User.objects.create_superuser(email='super@user.com', password='foo', is_staff=False)

    def test_create_superuser_is_superuser_false(self):
        with self.assertRaisesMessage(ValueError, 'Superuser must have is_superuser=True.'):
            User.objects.create_superuser(email='super@user.com', password='foo', is_superuser=False)

class UserModelTests(TestCase):
    def test_auto_referral_code_generation(self):
        user = User.objects.create_user(email='test@ref.com', password='foo')
        self.assertTrue(len(user.referral_code) <= 8)
        self.assertTrue(len(user.referral_code) > 0)
        
    def test_user_str(self):
        user = User.objects.create_user(email='teststr@user.com', password='foo')
        self.assertEqual(str(user), 'teststr@user.com')

class SubscriptionPlanTests(TestCase):
    def test_plan_str(self):
        plan = SubscriptionPlan.objects.create(name='test_plan', label='Test Plan Display')
        self.assertEqual(str(plan), 'Test Plan Display')

class BusinessTests(TestCase):
    def test_business_str(self):
        user = User.objects.create_user(email='biz@user.com', password='foo')
        business = Business.objects.create(user=user, name='My Biz MMC')
        self.assertEqual(str(business), 'My Biz MMC')

class TeamMemberTests(TestCase):
    def test_team_member_str(self):
        owner = User.objects.create_user(email='owner@team.com', password='foo')
        member_user = User.objects.create_user(email='member@team.com', password='foo')
        business = Business.objects.create(user=owner, name='Biz')
        tm = TeamMember.objects.create(owner=owner, business=business, user=member_user, role='MANAGER')
        self.assertEqual(str(tm), 'member@team.com (Team of owner@team.com)')

class DiscountCouponTests(TestCase):
    def test_discount_coupon_str(self):
        user = User.objects.create_user(email='coupon@user.com', password='foo')
        coupon = DiscountCoupon.objects.create(
            user=user, code='BONUS20', discount_percent=20, reason='new_user_bonus'
        )
        self.assertEqual(str(coupon), 'BONUS20 - coupon@user.com')

class TeamMemberInvitationTests(TestCase):
    def test_invitation_str(self):
        inviter = User.objects.create_user(email='inviter@sys.com', password='foo')
        invite = TeamMemberInvitation.objects.create(
            email='newguy@sys.com', 
            inviter=inviter, 
            role='MANAGER'
        )
        self.assertEqual(str(invite), 'Invite for newguy@sys.com by inviter@sys.com (MANAGER)')
