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
