from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import SubscriptionPlan, User, Business, TeamMember, DiscountCoupon, TeamMemberInvitation, CancellationReason


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        'colored_label', 'name', 'price_display', 'invoices_per_month_display',
        'clients_limit_display', 'team_members_limit_display',
        'feature_count', 'is_active', 'sort_order',
    )
    list_editable = ('is_active', 'sort_order')
    list_filter = ('is_active',)
    search_fields = ('name', 'label')
    ordering = ('sort_order', 'price_monthly')

    fieldsets = (
        ('Əsas Məlumatlar', {
            'fields': ('name', 'label', 'description', 'sort_order', 'is_active'),
            'description': 'Planın identifikasiya və göstərilmə məlumatları.',
        }),
        ('Qiymətləndirmə', {
            'fields': ('price_monthly', 'price_yearly'),
            'description': 'AZN ilə aylıq və illik qiymətlər.',
        }),
        ('Kəmiyyət Limitləri', {
            'fields': (
                ('invoices_per_month', 'expenses_per_month'),
                ('clients_limit', 'products_limit'),
                ('businesses_limit', 'warehouses_limit'),
                ('team_members_limit', 'purchase_orders_per_month'),
                'storage_limit_mb',
            ),
            'description': 'Boş buraxılmış sahələr LİMİTSİZ deməkdir. 0 = heç biri.',
        }),
        ('Faktura Xüsusiyyətləri', {
            'fields': (
                ('has_premium_pdf', 'has_custom_themes'),
                ('has_email_sending', 'has_etag_xml'),
                ('has_duplicate_invoice', 'has_public_sharing'),
                ('has_white_label', 'has_overdue_reminders'),
            ),
            'description': 'Faktura yaratma, göndərmə və paylaşma ilə bağlı xüsusiyyətlər.',
        }),
        ('Analitika & Hesabatlar', {
            'fields': (
                ('has_forecast_analytics', 'has_csv_export'),
                ('has_payment_analytics', 'has_tax_reports'),
                ('has_client_ratings', 'has_activity_log'),
            ),
            'description': 'Analitika, hesabat və eksport imkanları.',
        }),
        ('Komanda & İnventar', {
            'fields': (
                ('has_team_gps', 'has_bulk_operations'),
                ('has_stock_alerts', 'has_multi_currency'),
            ),
            'description': 'Komanda idarəetməsi və anbar xüsusiyyətləri.',
        }),
        ('Əlavə Xüsusiyyətlər', {
            'fields': (
                ('has_api_access', 'has_vip_support'),
            ),
            'description': 'API inteqrasiyası və dəstək səviyyəsi.',
        }),
    )

    def colored_label(self, obj):
        colors = {
            'free': '#6b7280',
            'pro': '#3b82f6',
            'premium': '#f59e0b',
        }
        color = colors.get(obj.name, '#6b7280')
        return format_html(
            '<span style="background:{}; color:white; padding:3px 10px; border-radius:12px; font-weight:bold; font-size:11px;">{}</span>',
            color, obj.label
        )
    colored_label.short_description = 'Plan'
    colored_label.admin_order_field = 'label'

    def price_display(self, obj):
        if obj.price_monthly == 0:
            return format_html('<span style="color:#22c55e; font-weight:bold;">PULSUZ</span>')
        return format_html(
            '<span style="font-weight:bold;">₼{}/ay</span> <span style="color:#6b7280;">| ₼{}/il</span>',
            obj.price_monthly, obj.price_yearly
        )
    price_display.short_description = 'Qiymət'
    price_display.admin_order_field = 'price_monthly'

    def _limit_display(self, value):
        if value is None:
            return format_html('<span style="color:#22c55e; font-weight:bold;">Limitsiz</span>')
        if value == 0:
            return format_html('<span style="color:#ef4444;">&#10005;</span>')
        return format_html('<b>{}</b>', value)

    def invoices_per_month_display(self, obj):
        return self._limit_display(obj.invoices_per_month)
    invoices_per_month_display.short_description = 'Faktura/ay'

    def clients_limit_display(self, obj):
        return self._limit_display(obj.clients_limit)
    clients_limit_display.short_description = 'Müştəri'

    def team_members_limit_display(self, obj):
        return self._limit_display(obj.team_members_limit)
    team_members_limit_display.short_description = 'Komanda'

    def feature_count(self, obj):
        features = [
            obj.has_premium_pdf, obj.has_custom_themes, obj.has_white_label,
            obj.has_email_sending, obj.has_etag_xml, obj.has_duplicate_invoice,
            obj.has_public_sharing, obj.has_overdue_reminders,
            obj.has_forecast_analytics, obj.has_csv_export, obj.has_payment_analytics,
            obj.has_tax_reports, obj.has_client_ratings, obj.has_activity_log,
            obj.has_team_gps, obj.has_bulk_operations, obj.has_stock_alerts,
            obj.has_multi_currency, obj.has_api_access, obj.has_vip_support,
        ]
        active = sum(1 for f in features if f)
        total = len(features)
        if active == total:
            color = '#22c55e'
        elif active > total // 2:
            color = '#3b82f6'
        else:
            color = '#6b7280'
        return format_html(
            '<span style="color:{}; font-weight:bold;">{}/{}</span>',
            color, active, total
        )
    feature_count.short_description = 'Xüsusiyyətlər'


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'voen', 'default_currency', 'default_invoice_theme', 'is_active')
    search_fields = ('name', 'voen', 'user__email')
    list_filter = ('is_active', 'default_invoice_theme', 'default_currency')
    list_editable = ('is_active',)
    raw_id_fields = ('user',)


@admin.register(User)
class MyUserAdmin(UserAdmin):
    list_display = ('email', 'full_name_display', 'plan_badge', 'subscription_interval', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'subscription_plan', 'membership', 'subscription_interval')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'referral_code')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Şəxsi məlumatlar', {'fields': ('first_name', 'last_name', 'phone', 'avatar', 'timezone', 'language')}),
        ('Abunəlik', {'fields': ('subscription_plan', 'membership', 'subscription_interval', 'subscription_expiry', 'cancel_at_period_end')}),
        ('Referral', {'fields': ('referral_code', 'referred_by', 'referral_count', 'referral_rewarded')}),
        ('Təhlükəsizlik', {'fields': ('is_email_verified', 'is_2fa_enabled', 'totp_secret')}),
        ('İcazələr', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Tarixlər', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'subscription_plan'),
        }),
    )

    def full_name_display(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or '---'
    full_name_display.short_description = 'Ad Soyad'

    def plan_badge(self, obj):
        plan = obj.subscription_plan
        if not plan:
            return format_html('<span style="color:#6b7280;">Pulsuz</span>')
        colors = {'free': '#6b7280', 'pro': '#3b82f6', 'premium': '#f59e0b'}
        color = colors.get(plan.name, '#6b7280')
        return format_html(
            '<span style="background:{}; color:white; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">{}</span>',
            color, plan.label
        )
    plan_badge.short_description = 'Plan'
    plan_badge.admin_order_field = 'subscription_plan'


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'owner', 'business', 'role', 'monthly_target', 'created_at')
    list_editable = ('role', 'monthly_target')
    list_filter = ('role', 'business')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'owner__email')
    raw_id_fields = ('user', 'owner', 'business')


@admin.register(TeamMemberInvitation)
class TeamMemberInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'inviter', 'business', 'role', 'is_used', 'created_at')
    list_filter = ('is_used', 'role')
    search_fields = ('email', 'inviter__email')
    raw_id_fields = ('inviter', 'business')


@admin.register(DiscountCoupon)
class DiscountCouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'user', 'discount_percent', 'reason', 'is_used', 'created_at', 'used_at')
    list_filter = ('is_used', 'reason')
    search_fields = ('code', 'user__email')
    raw_id_fields = ('user',)
    readonly_fields = ('code', 'discount_percent', 'reason', 'created_at')


@admin.register(CancellationReason)
class CancellationReasonAdmin(admin.ModelAdmin):
    list_display = ('user', 'reason', 'feedback_preview', 'created_at')
    list_filter = ('reason',)
    search_fields = ('user__email', 'feedback')
    raw_id_fields = ('user',)
    readonly_fields = ('user', 'reason', 'feedback', 'created_at')

    def feedback_preview(self, obj):
        if obj.feedback:
            return obj.feedback[:80] + ('...' if len(obj.feedback) > 80 else '')
        return '---'
    feedback_preview.short_description = 'Rəy'
