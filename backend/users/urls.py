from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BusinessViewSet, google_auth_bridge, PasswordChangeView,
    DeleteAccountView, SessionListView, RevokeSessionView,
    Generate2FAView, Enable2FAView, Disable2FAView, UserMeView,
    LogoutAPIView, TeamMemberViewSet, TeamMemberLocationUpdateView,
    RBACDebugView, ReferralStatsView
)
from .plan_views import PlanStatusView

router = DefaultRouter()
router.register(r'business', BusinessViewSet, basename='business')
router.register(r'team', TeamMemberViewSet, basename='team')

urlpatterns = [
    path('team/location/', TeamMemberLocationUpdateView.as_view(), name='team_location'),
    path('', include(router.urls)),
    path('me/', UserMeView.as_view(), name='user_me'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('google/callback/', google_auth_bridge, name='google_auth_bridge'),
    path('change-password/', PasswordChangeView.as_view(), name='change_password'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account'),
    path('sessions/', SessionListView.as_view(), name='session_list'),
    path('sessions/<int:pk>/revoke/', RevokeSessionView.as_view(), name='revoke_session'),
    path('2fa/generate/', Generate2FAView.as_view(), name='2fa_generate'),
    path('2fa/enable/', Enable2FAView.as_view(), name='2fa_enable'),
    path('2fa/disable/', Disable2FAView.as_view(), name='2fa_disable'),
    path('plan/status/', PlanStatusView.as_view(), name='plan_status'),
    path('referral/', ReferralStatsView.as_view(), name='referral_stats'),
    path('debug/rbac/', RBACDebugView.as_view(), name='rbac_debug'),
]
