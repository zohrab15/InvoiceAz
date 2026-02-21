import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business, TeamMember
from invoices.models import Invoice
from django.test import RequestFactory
from invoices.views import InvoiceViewSet

def test_user_role(email, role_label):
    user = User.objects.filter(email=email).first()
    if not user:
        print(f"--- {role_label} ({email}) NOT FOUND ---")
        return
        
    print(f"\n--- Testing {role_label}: {email} ---")
    
    # 1. Check Businesses
    from users.views import BusinessViewSet
    factory = RequestFactory()
    request = factory.get('/api/users/business/')
    request.user = user
    res = BusinessViewSet.as_view({'get': 'list'})(request)
    businesses = res.data
    print(f"  Businesses found: {len(businesses)}")
    for b in businesses:
        print(f"    ID: {b['id']}, Name: {b['name']}, Role: {b['user_role']}")
            
    if not businesses:
        return

    # 2. Check Invoices with X-Business-ID
    active_b = businesses[0]
    invoice_req = factory.get('/api/invoices/', HTTP_X_BUSINESS_ID=str(active_b['id']))
    invoice_req.user = user
    # Manually trigger the mixin logic to see if it sets attributes
    view = InvoiceViewSet()
    view.request = invoice_req
    view.format_kwarg = None
    
    # Check if get_active_business works
    biz = view.get_active_business()
    print(f"  Active Business Resolved: {biz.name if biz else 'NONE'}")
    print(f"  Is Team Member: {getattr(invoice_req, '_is_team_member', 'N/A')}")
    if hasattr(invoice_req, '_team_role'):
        print(f"  Team Role: {invoice_req._team_role}")

    # Check Queryset
    qs = view.get_queryset()
    print(f"  Invoices in Queryset: {qs.count() if hasattr(qs, 'count') else len(qs)}")

# Test with first owner and their first employee
owner = User.objects.filter(business__isnull=False).distinct().first()
if owner:
    test_user_role(owner.email, "OWNER")
    # Find an employee
    membership = TeamMember.objects.filter(owner=owner).first()
    if membership:
        test_user_role(membership.user.email, f"TEAM ({membership.role})")
    else:
        print("\n  No team member found for this owner to test.")

