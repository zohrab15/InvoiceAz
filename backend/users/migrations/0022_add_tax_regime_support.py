from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0021_update_warehouse_limits'),
    ]

    operations = [
        # SubscriptionPlan: ƏDV dəstəyi sahəsi
        migrations.AddField(
            model_name='subscriptionplan',
            name='has_vat_support',
            field=models.BooleanField(default=False, help_text='ƏDV rejimi dəstəyi (yalnız Premium)'),
        ),
        # Business: Vergi rejimi sahələri
        migrations.AddField(
            model_name='business',
            name='tax_regime',
            field=models.CharField(
                choices=[('simplified', 'Sadələşdirilmiş Vergi'), ('vat', 'ƏDV Ödəyicisi')],
                default='simplified',
                help_text='Vergi mükəlləfiyyəti statusu',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='business',
            name='default_vat_rate',
            field=models.IntegerField(
                choices=[(18, '18%'), (0, '0% (ƏDV-dən azad)')],
                default=18,
                help_text='Defolt ƏDV dərəcəsi (yalnız ƏDV rejimində istifadə olunur)',
            ),
        ),
    ]
