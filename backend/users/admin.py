from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import SubscriptionPlan, User, Business, TeamMember, DiscountCoupon

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('label', 'name', 'invoices_per_month', 'businesses_limit')
    search_fields = ('name', 'label')

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'voen', 'default_invoice_theme', 'is_active')
    search_fields = ('name', 'voen', 'user__email')
    list_filter = ('is_active', 'default_invoice_theme')

@admin.register(User)
class MyUserAdmin(UserAdmin):
    list_display = ('email', 'subscription_plan', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'subscription_plan')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'avatar', 'timezone', 'language')}),
        ('Plan Information', {'fields': ('subscription_plan', 'membership')}),
        ('Referral', {'fields': ('referral_code', 'referred_by', 'referral_count', 'referral_rewarded')}),
        ('Security', {'fields': ('is_email_verified', 'is_2fa_enabled', 'totp_secret')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'subscription_plan', 'membership'),
        }),
    )

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'owner', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__email', 'owner__email')
    raw_id_fields = ('user', 'owner')

@admin.register(DiscountCoupon)
class DiscountCouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'user', 'discount_percent', 'reason', 'is_used', 'created_at', 'used_at')
    list_filter = ('is_used', 'reason')
    search_fields = ('code', 'user__email')
    raw_id_fields = ('user',)
    readonly_fields = ('code', 'discount_percent', 'reason', 'created_at')
