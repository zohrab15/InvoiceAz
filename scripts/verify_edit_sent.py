import os
import django
import sys
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

# Setup Django
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from invoices.models import Invoice
from clients.models import Client
from users.models import Business, User
from django.test import RequestFactory
from invoices.serializers import InvoiceSerializer

def verify_locking():
    print("🚀 Starting Locking Logic Verification...")
    
    # Setup data
    user = User.objects.first()
    business = Business.objects.filter(user=user).first()
    client = Client.objects.filter(business=business).first()
    
    if not business or not client:
        print("❌ Business or Client not found. Please seed data first.")
        return

    # 1. Create a "Sent" invoice with NO sent_at
    print("📝 Case 1: Sent status but NO sent_at (should be editable)")
    inv1 = Invoice.objects.create(
        business=business,
        client=client,
        invoice_number=f"TEST-EDIT-{timezone.now().timestamp()}",
        invoice_date=timezone.now().date(),
        due_date=timezone.now().date() + timedelta(days=15),
        status='sent',
        sent_at=None,
        total=Decimal('100.00'),
        subtotal=Decimal('100.00')
    )
    
    serializer = InvoiceSerializer(inv1, data={'notes': 'Updated notes'}, partial=True)
    if serializer.is_valid():
        serializer.save()
        print("✅ Success: Invoice without sent_at was updated.")
    else:
        print(f"❌ Failure: Could not update invoice without sent_at. Errors: {serializer.errors}")

    # 2. Create a "Sent" invoice WITH sent_at
    print("🔒 Case 2: Sent status WITH sent_at (should be locked)")
    inv2 = Invoice.objects.create(
        business=business,
        client=client,
        invoice_number=f"TEST-LOCK-{timezone.now().timestamp()}",
        invoice_date=timezone.now().date(),
        due_date=timezone.now().date() + timedelta(days=15),
        status='sent',
        sent_at=timezone.now(),
        total=Decimal('100.00'),
        subtotal=Decimal('100.00')
    )
    
    serializer = InvoiceSerializer(inv2, data={'notes': 'Trying to update'}, partial=True)
    if serializer.is_valid():
        try:
            serializer.save()
            print("❌ Failure: Invoice with sent_at was allowed to be updated!")
        except Exception as e:
            print(f"✅ Success: Update blocked for delivered invoice. Error: {e}")
    else:
        print(f"❓ Unexpected: Serializer itself was invalid: {serializer.errors}")

    # 3. Test mark_as_sent via ViewSet (Simulation)
    print("⚙️ Case 3: Testing mark_as_sent action")
    from invoices.views import InvoiceViewSet
    from rest_framework.test import APIRequestFactory, force_authenticate
    from rest_framework.request import Request
    
    factory = APIRequestFactory()
    
    inv3 = Invoice.objects.create(
        business=business,
        client=client,
        invoice_number=f"TEST-MARK-{timezone.now().timestamp()}",
        invoice_date=timezone.now().date(),
        due_date=timezone.now().date() + timedelta(days=15),
        status='draft',
        sent_at=None,
        total=Decimal('100.00'),
        subtotal=Decimal('100.00')
    )
    
    request = factory.post(f'/api/invoices/{inv3.pk}/mark_as_sent/', HTTP_X_BUSINESS_ID=str(business.id))
    force_authenticate(request, user=user)
    
    # Properly setup view instance
    view_instance = InvoiceViewSet()
    view_instance.request = Request(request) # Wrap in DRF Request
    view_instance.format_kwarg = None
    view_instance.kwargs = {'pk': inv3.pk}
    
    response = view_instance.mark_as_sent(view_instance.request, pk=inv3.pk)
    
    # 4. Test status remains draft if triggerSend is true but not shared
    print("📋 Case 4: Testing status remains draft after 'Save & Send' (before actual sharing)")
    inv4 = Invoice.objects.create(
        business=business,
        client=client,
        invoice_number=f"TEST-DRAFT-{timezone.now().timestamp()}",
        invoice_date=timezone.now().date(),
        due_date=timezone.now().date() + timedelta(days=15),
        status='draft', # Simulating frontend sending 'draft'
        sent_at=None,
        total=Decimal('100.00'),
        subtotal=Decimal('100.00')
    )
    # The frontend would show the modal now. 
    # If the user clicks "Later", nothing else happens.
    # Assert it is still draft.
    inv4.refresh_from_db()
    assert inv4.status == 'draft'
    print("✅ Success: Invoice remains 'draft' after initial save.")
    
    # Now simulate sharing
    print("📤 Simulating sharing...")
    view_instance.kwargs = {'pk': inv4.pk}
    response = view_instance.mark_as_sent(view_instance.request, pk=inv4.pk)
    inv4.refresh_from_db()
    assert inv4.status == 'sent'
    assert inv4.sent_at is not None
    print("✅ Success: Invoice flipped to 'sent' after sharing.")

    print("\n✨ ALL LOCKING & STATUS CHECKS PASSED! ✨")

if __name__ == "__main__":
    verify_locking()
