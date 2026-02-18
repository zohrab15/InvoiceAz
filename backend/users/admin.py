from django.contrib import admin
from .models import SubscriptionPlan, User, Business

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('label', 'name', 'invoices_per_month', 'businesses_limit')
    search_fields = ('name', 'label')

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'voen', 'is_active')
    search_fields = ('name', 'voen', 'user__email')
    list_filter = ('is_active',)
