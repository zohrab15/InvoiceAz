from django.db import models
from users.models import Business
from clients.models import Client
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from notifications.utils import create_notification
import uuid

class Invoice(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('finalized', 'Finalized'),
        ('sent', 'Sent'),
        ('viewed', 'Viewed'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    )
    CURRENCY_CHOICES = (
        ('AZN', 'AZN'),
        ('USD', 'USD'),
        ('EUR', 'EUR'),
    )
    THEME_CHOICES = (
        ('modern', 'Müasir'),
        ('classic', 'Klassik'),
        ('minimal', 'Minimal'),
    )

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='invoices')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='invoices')
    
    # Track the specific user (Sales Rep or Owner) who created the invoice
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_invoices'
    )
    
    invoice_number = models.CharField(max_length=50, unique=True) # E.g. INV-001
    invoice_date = models.DateField()
    due_date = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='AZN')
    
    # Financials
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0) # Percentage
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True, null=True)
    terms = models.TextField(blank=True, null=True)
    
    pdf_file = models.FileField(upload_to='invoices/', blank=True, null=True)
    invoice_theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='modern')
    share_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    viewed_at = models.DateTimeField(blank=True, null=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            from django.db import transaction
            
            with transaction.atomic():
                # Lock the last invoice for the business to prevent race conditions
                last_invoice = Invoice.objects.filter(business=self.business)\
                    .select_for_update()\
                    .order_by('id').last()
                
                if last_invoice:
                    try:
                        # Extract number from format like INV-0001
                        current_num_str = last_invoice.invoice_number.split('-')[-1]
                        last_num = int(current_num_str)
                        self.invoice_number = f"INV-{last_num + 1:04d}"
                    except (IndexError, ValueError):
                        # Fallback count if parsing fails
                        count = Invoice.objects.filter(business=self.business).count()
                        self.invoice_number = f"INV-{count + 1001:04d}"
                else:
                    self.invoice_number = "INV-1001"
                
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    def calculate_totals(self):
        items = self.items.all()
        self.subtotal = sum(item.amount for item in items)
        self.tax_amount = sum(item.amount * (item.tax_rate / 100) for item in items)
        self.total = self.subtotal + self.tax_amount - self.discount
        self.update_payment_status(save=False)
        self.save()

    def update_payment_status(self, save=True):
        payments = self.payments.all()
        self.paid_amount = sum(p.amount for p in payments)
        
        if self.paid_amount >= self.total and self.total > 0:
            self.status = 'paid'
            if not self.paid_at:
                from django.utils import timezone
                self.paid_at = timezone.now()
        elif self.status == 'paid' and self.paid_amount < self.total:
            self.status = 'sent' # Revert to sent if payment removed
            self.paid_at = None
            
        if save:
            self.save()

    def __str__(self):
        return f"{self.invoice_number} - {self.client.name}"

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.SET_NULL, blank=True, null=True, related_name='invoice_items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=50, blank=True, null=True) # e.g. hours, pcs
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    order = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)

class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    receipt_file = models.FileField(upload_to='receipts/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

class Expense(models.Model):
    CATEGORY_CHOICES = (
        ('office', 'Ofis ləvazimatları'),
        ('salary', 'Maaşlar'),
        ('marketing', 'Marketinq'),
        ('rent', 'İcarə və Kommunal'),
        ('travel', 'Ezamiyyət'),
        ('software', 'Proqram və Abunəliklər'),
        ('transport', 'Nəqliyyat və Yanacaq'),
        ('hardware', 'Avadanlıq və Texnika'),
        ('tax', 'Vergi və Dövlət rüsumları'),
        ('bank', 'Bank və Komissiya'),
        ('training', 'Təlim və Tədris'),
        ('other', 'Digər'),
    )
    STATUS_CHOICES = (
        ('paid', 'Ödənilib'),
        ('pending', 'Gözləmədə'),
    )
    CURRENCY_CHOICES = (
        ('AZN', 'AZN'),
        ('USD', 'USD'),
        ('EUR', 'EUR'),
    )
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    vendor = models.CharField(max_length=255, blank=True, null=True) # Təchizatçı
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='AZN')
    date = models.DateField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='paid')
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    
    # Billable to client
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True, related_name='expenses')
    
    notes = models.TextField(blank=True, null=True)
    attachment = models.FileField(upload_to='expenses/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

@receiver(post_save, sender=Payment)
@receiver(post_delete, sender=Payment)
def update_invoice_on_payment(sender, instance, **kwargs):
    instance.invoice.update_payment_status()

@receiver(post_save, sender=Expense)
def check_budget_limit(sender, instance, created, **kwargs):
    if created:
        business = instance.business
        now = timezone.now()
        
        # Calculate total expenses for the current month
        total_monthly_expenses = Expense.objects.filter(
            business=business,
            date__year=now.year,
            date__month=now.month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        if total_monthly_expenses > business.budget_limit:
            create_notification(
                user=business.user,
                title="Büdcə Limiti Keçildi!",
                message=f"{now.strftime('%B')} ayı üçün təyin etdiyiniz {business.budget_limit} ₼ limit keçildi. Cari xərc: {total_monthly_expenses} ₼",
                type='warning',
                link='/expenses'
            )
