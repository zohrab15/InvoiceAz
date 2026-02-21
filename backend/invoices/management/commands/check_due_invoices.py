from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from invoices.models import Invoice
from notifications.utils import create_notification

class Command(BaseCommand):
    help = 'Check for invoices due in 3 days and create notifications'

    def handle(self, *args, **options):
        today = timezone.now().date()
        reminder_date = today + timedelta(days=3)
        
        # 1. Reminders for invoices due in 3 days
        upcoming_invoices = Invoice.objects.filter(
            due_date=reminder_date,
            status__in=['sent', 'viewed']
        ).select_related('business__user', 'client')

        count_upcoming = 0
        for invoice in upcoming_invoices:
            create_notification(
                user=invoice.business.user,
                title="Ödəniş xatırlatması",
                message=f"{invoice.client.name} tərəfindən ödənilməli olan #{invoice.invoice_number} nömrəli fakturanın vaxtına 3 gün qalıb.",
                type='warning',
                link=f"/invoices"
            )
            if invoice.client and invoice.client.assigned_to:
                create_notification(
                    user=invoice.client.assigned_to,
                    title="Ödəniş xatırlatması",
                    message=f"Müştəriniz {invoice.client.name} üçün #{invoice.invoice_number} nömrəli fakturanın ödənişinə 3 gün qalıb.",
                    type='warning',
                    link=f"/invoices"
                )
            count_upcoming += 1

        # 2. Alerts for invoices that became overdue today
        overdue_invoices = Invoice.objects.filter(
            due_date=today,
            status__in=['sent', 'viewed']
        ).select_related('business__user', 'client')

        count_overdue = 0
        for invoice in overdue_invoices:
            # Update status to overdue
            invoice.status = 'overdue'
            invoice.save(update_fields=['status'])
            
            create_notification(
                user=invoice.business.user,
                title="Vaxtı keçmiş ödəniş",
                message=f"#{invoice.invoice_number} nömrəli fakturanın ödəniş vaxtı bu gün bitdi. Status 'Vaxtı keçib' olaraq yeniləndi.",
                type='error',
                link=f"/invoices"
            )
            if invoice.client and invoice.client.assigned_to:
                create_notification(
                    user=invoice.client.assigned_to,
                    title="Vaxtı keçmiş ödəniş",
                    message=f"Müştəriniz {invoice.client.name} üçün #{invoice.invoice_number} nömrəli fakturanın vaxtı bitdi. Status 'Vaxtı keçib' olaraq yeniləndi.",
                    type='error',
                    link=f"/invoices"
                )
            count_overdue += 1

        self.stdout.write(self.style.SUCCESS(
            f'Success: Created {count_upcoming} reminders and handled {count_overdue} overdue invoices.'
        ))
