from rest_framework import viewsets, permissions
from .models import Business, TeamMember, User, TeamMemberInvitation
from .serializers import BusinessSerializer, TeamMemberSerializer, TeamMemberInvitationSerializer
from .plan_limits import check_business_limit, get_plan_limits
from rest_framework.exceptions import PermissionDenied

class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Direct owner
        owned = Business.objects.filter(user=user)
        
        # Team memberships in specific businesses
        team_business_ids = TeamMember.objects.filter(user=user).values_list('business_id', flat=True)
        team_businesses = Business.objects.filter(id__in=team_business_ids)
        
        return (owned | team_businesses).distinct()

    def update(self, request, *args, **kwargs):
        business = self.get_object()
        if request.user != business.user:
            is_manager = TeamMember.objects.filter(business=business, user=request.user, role='MANAGER').exists()
            if not is_manager:
                raise PermissionDenied("Bu biznes məlumatlarını yalnız sahib və ya menecer redaktə edə bilər.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        business = self.get_object()
        if request.user != business.user:
            raise PermissionDenied("Yalnız biznes sahibi biznesi silə bilər.")
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        limit_check = check_business_limit(self.request.user)
        if not limit_check['allowed']:
            raise PermissionDenied({
                "code": "plan_limit",
                "detail": f"Hazırkı planınızda maksimum {limit_check['limit']} biznes yarada bilərsiniz.",
                "limit": limit_check['limit']
            })
        serializer.save(user=self.request.user, is_active=True)

from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .mixins import BusinessContextMixin

from rest_framework.decorators import action

class TeamMemberViewSet(BusinessContextMixin, viewsets.ModelViewSet):
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        business = self.get_active_business()
        if not business:
            return Response({"detail": "Aktiv biznes seçilməyib."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            member = TeamMember.objects.get(business=business, user=request.user)
            serializer = self.get_serializer(member)
            return Response(serializer.data)
        except TeamMember.DoesNotExist:
            return Response({"detail": "Bu biznesin üzvü deyilsiniz."}, status=status.HTTP_404_NOT_FOUND)

    def get_queryset(self):
        # Determine business context
        business = self.get_active_business()
        if not business:
            return TeamMember.objects.none()
            
        # Return all members belonging to THIS specific business
        from django.db.models import Case, When, Value, IntegerField
        
        return TeamMember.objects.filter(business=business).annotate(
            role_order=Case(
                When(role='MANAGER', then=Value(1)),
                When(role='ACCOUNTANT', then=Value(2)),
                When(role='INVENTORY_MANAGER', then=Value(3)),
                When(role='SALES_REP', then=Value(4)),
                default=Value(5),
                output_field=IntegerField(),
            )
        ).order_by('role_order', '-created_at')

    def create(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        role_code = request.data.get('role', 'SALES_REP')
        
        if not email:
            raise PermissionDenied("İstifadəçi e-poçtu tələb olunur.")
        
        # Determine business context
        business = self.get_active_business()
        if not business:
            raise PermissionDenied("Bu əməliyyat üçün aktiv biznes seçilməlidir.")

        # inviter check
        if request.user != business.user:
            inviter_membership = TeamMember.objects.filter(business=business, user=request.user, role='MANAGER').first()
            if not inviter_membership:
                raise PermissionDenied("Komandaya işçi əlavə etmək üçün səlahiyyətiniz yoxdur.")
            corporate_owner = business.user
        else:
            corporate_owner = request.user

        # Plan check
        plan = get_plan_limits(corporate_owner)
        limit = getattr(plan, 'team_members_limit', 0) or 0
        current_count = TeamMember.objects.filter(owner=corporate_owner).count()
        current_pending = TeamMemberInvitation.objects.filter(inviter=corporate_owner, is_used=False).count()
        
        if (current_count + current_pending) >= limit and corporate_owner.email != 'demo_user@invoice.az':
            raise PermissionDenied({
                "code": "plan_limit",
                "detail": f"Hazırkı planınızda maksimum {limit} komanda üzvü ola bilər. Lütfən planınızı yeniləyin.",
                "limit": limit
            })

        try:
            target_user = User.objects.get(email__iexact=email)
            if target_user == request.user:
                raise PermissionDenied("Özünüzü komandaya əlavə edə bilməzsiniz.")
            if target_user == corporate_owner:
                raise PermissionDenied("Biznes sahibini komandaya əlavə edə bilməzsiniz.")
            if TeamMember.objects.filter(business=business, user=target_user).exists():
                raise PermissionDenied("Bu istifadəçi artıq bu biznesin komandasındadır.")
            
            # Create record directly for this business
            member = TeamMember.objects.create(
                owner=corporate_owner, 
                business=business,
                user=target_user,
                role=role_code
            )
            serializer = self.get_serializer(member)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            # Create invitation instead for this business
            if TeamMemberInvitation.objects.filter(business=business, email__iexact=email, is_used=False).exists():
                raise PermissionDenied("Bu biznes üçün bu e-poçta artıq dəvət göndərilib.")
            
            invitation = TeamMemberInvitation.objects.create(
                inviter=corporate_owner,
                business=business,
                email=email,
                role=role_code
            )
            return Response({
                "detail": "İstifadəçi tapılmadı, lakin dəvət qeydə alındı. İstifadəçi qeydiyyatdan keçdikdə avtomatik komandaya əlavə olunacaq.",
                "invitation_id": invitation.id
            }, status=status.HTTP_202_ACCEPTED)

    def perform_update(self, serializer):
        # Determine current user's role in this organization
        instance = serializer.instance
        if self.request.user == instance.owner:
            serializer.save()
            return

        try:
            inviter_membership = TeamMember.objects.get(owner=instance.owner, user=self.request.user)
            if inviter_membership.role != 'MANAGER':
                raise PermissionDenied("Yalnız sahib və ya menecerlər işçi məlumatlarını yeniləyə bilər.")
            
            # Managers cannot promote/demote other managers or update their own role/target via this view
            if instance.user == self.request.user:
                # Allow them to update their own location maybe? 
                # But for target/role, we should be careful.
                # Actually, TeamMemberLocationUpdateView handles location.
                # So we restrict all updates to self via this viewset for safety.
                raise PermissionDenied("Öz məlumatlarınızı (rol, hədəf) özünüz dəyişə bilməzsiniz.")
                
            serializer.save()
        except TeamMember.DoesNotExist:
            raise PermissionDenied("Təşkilatda deyilsiniz.")

    def perform_destroy(self, instance):
        if self.request.user != instance.owner:
            try:
                inviter_membership = TeamMember.objects.get(owner=instance.owner, user=self.request.user)
                if inviter_membership.role != 'MANAGER':
                    raise PermissionDenied("Yalnız sahib və ya menecerlər işçiləri silə bilər.")
                if instance.role == 'MANAGER':
                    raise PermissionDenied("Menecerlər digər menecerləri silə bilməz.")
            except TeamMember.DoesNotExist:
                raise PermissionDenied("Təşkilatda deyilsiniz.")
        instance.delete()

class TeamMemberInvitationViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMemberInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only owners/managers see invitations for their org
        try:
            membership = TeamMember.objects.get(user=self.request.user)
            owner = membership.owner
            if membership.role != 'MANAGER':
                 return TeamMemberInvitation.objects.none()
        except TeamMember.DoesNotExist:
            owner = self.request.user
            
        return TeamMemberInvitation.objects.filter(inviter=owner, is_used=False)

    def perform_destroy(self, instance):
        # Verify permission
        try:
            membership = TeamMember.objects.get(user=self.request.user)
            if membership.owner != instance.inviter or membership.role != 'MANAGER':
                raise PermissionDenied("İcazə yoxdur.")
        except TeamMember.DoesNotExist:
            if instance.inviter != self.request.user:
                raise PermissionDenied("İcazə yoxdur.")
        
        instance.delete()

class TeamMemberLocationUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        
        if lat is None or lng is None:
            return Response({"error": "Latitude and longitude required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update all memberships for this user (they might belong to multiple teams, though usually 1)
        memberships = TeamMember.objects.filter(user=request.user)
        if not memberships.exists():
            return Response({"error": "You are not a team member"}, status=status.HTTP_403_FORBIDDEN)
            
        memberships.update(
            last_latitude=lat,
            last_longitude=lng,
            last_location_update=timezone.now()
        )
        
        return Response({"status": "Location updated successfully"})


import os
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import HttpResponseRedirect
from urllib.parse import urlencode

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@login_required
def google_auth_bridge(request):
    """
    Bridge view to convert session-based social login to JWT for frontend.
    Redirects back to frontend with tokens in URL. 
    Frontend will handle storing these and clearing the URL.
    """
    user = request.user
    tokens = get_tokens_for_user(user)
    
    default_frontend = 'http://localhost:5173'
    frontend_base = os.environ.get('FRONTEND_URL', default_frontend if settings.DEBUG else 'https://invoiceaz.vercel.app').rstrip('/')
    
    # Use URL query parameters as localStorage is not shared across domains
    params = urlencode({
        'access': tokens['access'],
        'refresh': tokens['refresh']
    })
    
    return HttpResponseRedirect(f"{frontend_base}/auth/callback?{params}")

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import update_session_auth_hash, logout as django_logout
from .serializers import PasswordChangeSerializer, UserSerializer

@method_decorator(csrf_exempt, name='dispatch')
class LogoutAPIView(APIView):
    authentication_classes = [] # Don't check session/CSRF for this
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        django_logout(request)
        return Response({"detail": "Sessiya təmizləndi."}, status=status.HTTP_200_OK)

class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            update_session_auth_hash(request, user)  # Keep user logged in
            return Response({"detail": "Şifrə uğurla dəyişdirildi."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        # Allauth/Django standard: related data with CASCADE will be deleted
        # Business, Invoices, Clients all have CASCADE to user/business
        user.delete()
        return Response({"detail": "Hesab və bütün bağlı məlumatlar silindi."}, status=status.HTTP_204_NO_CONTENT)

from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken

class SessionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = OutstandingToken.objects.filter(user=request.user)
        # Filter out already blacklisted tokens
        blacklisted_ids = BlacklistedToken.objects.filter(
            token__user=request.user
        ).values_list('token_id', flat=True)
        
        active_sessions = sessions.exclude(id__in=blacklisted_ids)
        
        data = []
        for session in active_sessions:
            data.append({
                "id": session.id,
                "created_at": session.created_at,
                "expires_at": session.expires_at,
                # In a real app we might store user-agent in a custom field or via a middleware
                "device": "Brauzer Sessiyası" 
            })
        return Response(data)

class RevokeSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            token = OutstandingToken.objects.get(id=pk, user=request.user)
            BlacklistedToken.objects.get_or_create(token=token)
            return Response({"detail": "Sessiya sonlandırıldı."})
        except OutstandingToken.DoesNotExist:
            return Response({"detail": "Sessiya tapılmadı."}, status=status.HTTP_404_NOT_FOUND)

import pyotp

class Generate2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.totp_secret:
            user.totp_secret = pyotp.random_base32()
            user.save()
        
        totp = pyotp.TOTP(user.totp_secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name="InvoiceAZ"
        )
        
        return Response({
            "secret": user.totp_secret,
            "provisioning_uri": provisioning_uri
        })

class Enable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get('code')
        
        if not user.totp_secret:
            return Response({"detail": "Əvvəlcə 2FA kodu yaradılmalıdır."}, status=status.HTTP_400_BAD_REQUEST)
        
        totp = pyotp.TOTP(user.totp_secret)
        if totp.verify(code):
            # Replay protection: Prevent using the same code twice within 60s
            from django.core.cache import cache
            cache_key = f"2fa_used_{user.id}_{code}"
            if cache.get(cache_key):
                return Response({"detail": "Bu kod artıq istifadə olunub."}, status=status.HTTP_400_BAD_REQUEST)
            
            cache.set(cache_key, True, 60) # Block this code for 60 seconds
            
            user.is_2fa_enabled = True
            user.save()
            return Response({"detail": "İki mərhələli doğrulama aktiv edildi."})
        
        return Response({"detail": "Yanlış kod."}, status=status.HTTP_400_BAD_REQUEST)

class Disable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.is_2fa_enabled = False
        user.totp_secret = None
        user.save()
        return Response({"detail": "İki mərhələli doğrulama söndürüldü."})

from .serializers import DiscountCouponSerializer

class ReferralStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        coupons = DiscountCouponSerializer(
            user.coupons.order_by('-created_at'), many=True
        )
        return Response({
            'referral_code': user.referral_code,
            'referral_link': f"https://invoiceaz.az/register?ref={user.referral_code}",
            'referral_count': user.referral_count,
            'coupons': coupons.data,
        })


class RBACDebugView(APIView):
    """Temporary debug endpoint to inspect RBAC state for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # All TeamMember records where this user IS the member
        memberships = TeamMember.objects.filter(user=user)
        membership_data = [
            {
                'id': m.id,
                'owner_email': m.owner.email,
                'owner_id': m.owner.id,
                'role': m.role,
            }
            for m in memberships
        ]
        
        # All TeamMember records where this user IS the owner (they invited someone)
        owned_members = TeamMember.objects.filter(owner=user)
        owned_data = [
            {
                'id': m.id,
                'member_email': m.user.email,
                'member_id': m.user.id,
                'role': m.role,
            }
            for m in owned_members
        ]
        
        # All businesses this user should see
        owned_businesses = Business.objects.filter(user=user)
        direct_team_owners = TeamMember.objects.filter(user=user).values_list('owner_id', flat=True)
        grand_owners = TeamMember.objects.filter(user_id__in=direct_team_owners).values_list('owner_id', flat=True)
        all_owner_ids = set(direct_team_owners) | set(grand_owners)
        team_businesses = Business.objects.filter(user_id__in=all_owner_ids)
        all_businesses = (owned_businesses | team_businesses).distinct()
        
        biz_data = []
        for b in all_businesses:
            role = 'OWNER' if b.user_id == user.id else None
            if not role:
                tm = TeamMember.objects.filter(owner_id=b.user_id, user_id=user.id).first()
                if not tm:
                    sub_ids = TeamMember.objects.filter(owner_id=b.user_id).values_list('user_id', flat=True)
                    tm = TeamMember.objects.filter(owner_id__in=sub_ids, user_id=user.id).first()
                role = tm.role if tm else 'UNKNOWN'
            biz_data.append({
                'id': b.id,
                'name': b.name,
                'owner_email': b.user.email,
                'your_role': role,
            })
        
        return Response({
            'user_email': user.email,
            'user_id': user.id,
            'memberships_as_member': membership_data,
            'memberships_as_owner': owned_data,
            'direct_team_owner_ids': list(direct_team_owners),
            'grand_owner_ids': list(grand_owners),
            'visible_businesses': biz_data,
        })
