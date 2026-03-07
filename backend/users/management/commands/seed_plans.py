"""
Seed or update the 3 subscription plans (Free, Pro, Premium) with expert-level limits.
Usage: python manage.py seed_plans
"""
from django.core.management.base import BaseCommand
from users.models import SubscriptionPlan


PLANS = [
    {
        'name': 'free',
        'defaults': {
            'label': 'Pulsuz',
            'description': 'Kiçik bizneslərin başlanğıcı üçün əsas funksiyalar. Kredit kartı tələb olunmur.',
            'sort_order': 1,
            'is_active': True,

            # Qiymət
            'price_monthly': 0,
            'price_yearly': 0,

            # Kəmiyyət limitləri
            'invoices_per_month': 5,
            'clients_limit': 10,
            'expenses_per_month': 15,
            'businesses_limit': 1,
            'products_limit': 20,
            'team_members_limit': 0,
            'warehouses_limit': 1,
            'purchase_orders_per_month': 5,
            'storage_limit_mb': 50,

            # Faktura
            'has_premium_pdf': False,
            'has_custom_themes': False,
            'has_white_label': False,
            'has_email_sending': False,
            'has_etag_xml': False,
            'has_duplicate_invoice': True,
            'has_public_sharing': True,
            'has_overdue_reminders': False,

            # Analitika
            'has_forecast_analytics': False,
            'has_csv_export': False,
            'has_payment_analytics': False,
            'has_tax_reports': False,
            'has_client_ratings': False,
            'has_activity_log': False,

            # Komanda & İnventar
            'has_team_gps': False,
            'has_bulk_operations': False,
            'has_stock_alerts': False,
            'has_multi_currency': False,

            # Əlavə
            'has_api_access': False,
            'has_vip_support': False,
        },
    },
    {
        'name': 'pro',
        'defaults': {
            'label': 'Pro',
            'description': 'Böyüyən biznesləriniz üçün tam analitika, komanda idarəetməsi və premium dizaynlar.',
            'sort_order': 2,
            'is_active': True,

            # Qiymət
            'price_monthly': 19.99,
            'price_yearly': 199.99,

            # Kəmiyyət limitləri
            'invoices_per_month': 100,
            'clients_limit': None,       # Limitsiz
            'expenses_per_month': None,   # Limitsiz
            'businesses_limit': 3,
            'products_limit': 500,
            'team_members_limit': 5,
            'warehouses_limit': 3,
            'purchase_orders_per_month': 50,
            'storage_limit_mb': 500,

            # Faktura
            'has_premium_pdf': True,
            'has_custom_themes': True,
            'has_white_label': False,
            'has_email_sending': True,
            'has_etag_xml': True,
            'has_duplicate_invoice': True,
            'has_public_sharing': True,
            'has_overdue_reminders': True,

            # Analitika
            'has_forecast_analytics': True,
            'has_csv_export': True,
            'has_payment_analytics': True,
            'has_tax_reports': True,
            'has_client_ratings': True,
            'has_activity_log': True,

            # Komanda & İnventar
            'has_team_gps': False,
            'has_bulk_operations': True,
            'has_stock_alerts': True,
            'has_multi_currency': True,

            # Əlavə
            'has_api_access': False,
            'has_vip_support': False,
        },
    },
    {
        'name': 'premium',
        'defaults': {
            'label': 'Premium',
            'description': 'Limitsiz hər şey, API inteqrasiyası, white-label və VIP dəstək. Müəssisə səviyyəli.',
            'sort_order': 3,
            'is_active': True,

            # Qiymət
            'price_monthly': 49.99,
            'price_yearly': 499.99,

            # Kəmiyyət limitləri - hamısı limitsiz (None)
            'invoices_per_month': None,
            'clients_limit': None,
            'expenses_per_month': None,
            'businesses_limit': None,
            'products_limit': None,
            'team_members_limit': None,
            'warehouses_limit': None,
            'purchase_orders_per_month': None,
            'storage_limit_mb': None,

            # Faktura - hamısı açıq
            'has_premium_pdf': True,
            'has_custom_themes': True,
            'has_white_label': True,
            'has_email_sending': True,
            'has_etag_xml': True,
            'has_duplicate_invoice': True,
            'has_public_sharing': True,
            'has_overdue_reminders': True,

            # Analitika - hamısı açıq
            'has_forecast_analytics': True,
            'has_csv_export': True,
            'has_payment_analytics': True,
            'has_tax_reports': True,
            'has_client_ratings': True,
            'has_activity_log': True,

            # Komanda & İnventar - hamısı açıq
            'has_team_gps': True,
            'has_bulk_operations': True,
            'has_stock_alerts': True,
            'has_multi_currency': True,

            # Əlavə - hamısı açıq
            'has_api_access': True,
            'has_vip_support': True,
        },
    },
]


class Command(BaseCommand):
    help = 'Abunəlik planlarını (Pulsuz, Pro, Premium) yarat və ya yenilə.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Mövcud planların bütün sahələrini yenidən yaz (override).',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)

        for plan_data in PLANS:
            name = plan_data['name']
            defaults = plan_data['defaults']

            if force:
                plan, created = SubscriptionPlan.objects.update_or_create(
                    name=name,
                    defaults=defaults,
                )
                action = 'CREATED' if created else 'UPDATED (force)'
            else:
                plan, created = SubscriptionPlan.objects.get_or_create(
                    name=name,
                    defaults=defaults,
                )
                action = 'CREATED' if created else 'already exists (skip)'

            icon = '+' if created else ('~' if force else '=')
            self.stdout.write(f'  [{icon}] {plan.name} - {action}')

        # Assign free plan to users without a plan
        from users.models import User
        free_plan = SubscriptionPlan.objects.filter(name='free').first()
        if free_plan:
            updated = User.objects.filter(subscription_plan__isnull=True).update(subscription_plan=free_plan)
            if updated:
                self.stdout.write(f'  [!] {updated} users assigned free plan.')

        self.stdout.write(self.style.SUCCESS('\nPlans configured successfully!'))
