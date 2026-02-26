import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from invoices.models import Invoice

print("Invoice Statuses:")
for inv in Invoice.objects.all():
    print(f"ID: {inv.id}, Number: {inv.invoice_number}, Status: {inv.status}")
