from django.contrib import admin
from .models import Invoice, InvoiceItem, Payment, Expense

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0

class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'business', 'client', 'total', 'status', 'invoice_theme', 'created_at')
    list_filter = ('status', 'invoice_theme', 'business')
    search_fields = ('invoice_number', 'client__name', 'business__name')
    inlines = [InvoiceItemInline, PaymentInline]
    readonly_fields = ('share_token', 'paid_amount')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'business', 'amount', 'category', 'status', 'date')
    list_filter = ('category', 'status', 'business')
    search_fields = ('description', 'vendor', 'business__name')
