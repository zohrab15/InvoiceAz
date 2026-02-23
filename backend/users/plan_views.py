from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .plan_limits import get_full_plan_status


class PlanStatusView(APIView):
    """Returns the current user's plan, limits, and usage stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Look for business_id in query params or X-Business-ID header
        business_id = request.query_params.get('business_id') or request.headers.get('X-Business-ID')
        status = get_full_plan_status(request.user, business_id=business_id)
        return Response(status)
