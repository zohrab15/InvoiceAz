from rest_framework import viewsets, permissions
from .models import Business, TeamMember, User
from .serializers import BusinessSerializer, TeamMemberSerializer
from .plan_limits import check_business_limit
from rest_framework.exceptions import PermissionDenied

class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Business.objects.filter(user=self.request.user)

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

class TeamMemberViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Owners see their team
        return TeamMember.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            raise PermissionDenied("İstifadəçi e-poçtu tələb olunur.")
        
        try:
            target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise PermissionDenied("Bu e-poçt ilə istifadəçi tapılmadı. İşçi əvvəlcə saytdan qeydiyyatdan keçməlidir.")
            
        if target_user == request.user:
            raise PermissionDenied("Özünüzü komandaya əlavə edə bilməzsiniz.")
            
        if TeamMember.objects.filter(owner=request.user, user=target_user).exists():
           raise PermissionDenied("Bu istifadəçi artıq komandanızdadır.") 
            
        # Create directly without standard serializer validation to avoid 'user required' error
        member = TeamMember.objects.create(
            owner=request.user, 
            user=target_user,
            role=request.data.get('role', 'SALES_REP')
        )
        serializer = self.get_serializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
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
