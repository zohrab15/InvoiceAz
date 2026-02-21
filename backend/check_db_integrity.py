import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business, TeamMember
from invoices.models import Invoice

print(f"Total Users: {User.objects.count()}")
print(f"Total Businesses: {Business.objects.count()}")
print(f"Total TeamMembers: {TeamMember.objects.count()}")
print(f"Total Invoices: {Invoice.objects.count()}")

# Check if any team members exist
for tm in TeamMember.objects.all()[:5]:
    print(f"Team Member: {tm.user.email}, Owner: {tm.owner.email}, Role: {tm.role}")

# Check first business
b = Business.objects.first()
if b:
    print(f"\nBusiness: {b.name}, Owner: {b.user.email}")
    inv_count = Invoice.objects.filter(business=b).count()
    print(f"Invoices for this business: {inv_count}")
    
    # Check if any team members for this business owner
    tm_count = TeamMember.objects.filter(owner=b.user).count()
    print(f"Team members for this owner: {tm_count}")

