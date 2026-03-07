from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .plan_limits import get_full_plan_status
from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer
from django.utils import timezone
from dateutil.relativedelta import relativedelta


class PlanStatusView(APIView):
    """Returns the current user's plan, limits, and usage stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Look for business_id in query params or X-Business-ID header
        business_id = request.query_params.get('business_id') or request.headers.get('X-Business-ID')
        status_data = get_full_plan_status(request.user, business_id=business_id)
        
        # Add cancellation info if it exists in the user model but not yet in the status helper
        status_data['subscription']['cancel_at_period_end'] = request.user.cancel_at_period_end
        
        return Response(status_data)


class SubscriptionPlanListView(APIView):
    """Lists all available subscription plans."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = SubscriptionPlan.objects.all()
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data)


class UpdatePlanView(APIView):
    """Updates the user's subscription plan and calculates expiry."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_name = request.data.get('plan')
        interval = request.data.get('interval', 'monthly')  # 'monthly' or 'yearly'

        if interval not in ['monthly', 'yearly']:
            return Response({"error": "Yanlış interval. 'monthly' və ya 'yearly' olmalıdır."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = SubscriptionPlan.objects.get(name=plan_name)
        except SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan tapılmadı."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        user.membership = plan.name
        user.subscription_interval = interval
        user.cancel_at_period_end = False  # Reset cancellation flag on upgrade/change
        
        # Calculate expiry
        now = timezone.now()
        if interval == 'monthly':
            user.subscription_expiry = now + relativedelta(months=1)
        else:
            user.subscription_expiry = now + relativedelta(years=1)
            
        user.save()

        return Response({
            "message": f"Planınız uğurla {plan.name} ({interval}) olaraq yeniləndi.",
            "plan": user.membership,
            "interval": user.subscription_interval,
            "expiry": user.subscription_expiry
        })


class CancelSubscriptionView(APIView):
    """Marks a subscription for cancellation at the end of the period."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.membership == 'free':
            return Response({"error": "Pulsuz plan ləğv edilə bilməz."}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.cancel_at_period_end:
            return Response({"message": "Abunəliyiniz onsuz da ləğv edilmə gözləməsindədir."}, status=status.HTTP_200_OK)

        user.cancel_at_period_end = True
        user.save()

        return Response({
            "message": "Abunəliyiniz ləğv edildi. Müddət bitənə qədər bütün imkanlardan yararlana bilərsiniz.",
            "cancel_at_period_end": True,
            "expiry": user.subscription_expiry
        })
