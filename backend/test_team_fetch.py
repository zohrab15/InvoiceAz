import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from users.models import User, Business, TeamMember
from users.views import TeamMemberViewSet

# Get owner and sales rep
owner = User.objects.get(email='owner@test.com')
sales_rep = User.objects.get(email='sales@test.com')

factory = RequestFactory()
request = factory.get('/users/team/')
request.user = owner

view = TeamMemberViewSet.as_view({'get': 'list'})
response = view(request)

print("Team members for Owner:", response.data)
