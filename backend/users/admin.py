from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
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

@admin.register(User)
class MyUserAdmin(UserAdmin):
    list_display = ('email', 'subscription_plan', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'subscription_plan')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    fieldsets = UserAdmin.fieldsets + (
        ('Plan Information', {'fields': ('subscription_plan', 'membership')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Plan Information', {'fields': ('subscription_plan', 'membership')}),
    )
