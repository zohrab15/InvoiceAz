from rest_framework import viewsets, permissions
from users.models import Business
from users.serializers import BusinessSerializer

class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Business.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_active=True)


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
    """
    user = request.user
    tokens = get_tokens_for_user(user)
    
    # Base frontend URL (adjust if running on different port in production)
    frontend_url = 'http://localhost:5173/auth/callback'
    
    # Construct query parameters
    query_params = urlencode(tokens)
    
    # Redirect to frontend with tokens
    response = HttpResponseRedirect(f'{frontend_url}?{query_params}')
    return response

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import update_session_auth_hash
from .serializers import PasswordChangeSerializer, UserSerializer

class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

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
