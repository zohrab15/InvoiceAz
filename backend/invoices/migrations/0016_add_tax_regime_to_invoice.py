from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0015_alter_expense_options_alter_invoice_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='tax_regime_at_creation',
            field=models.CharField(
                choices=[('simplified', 'Sadələşdirilmiş Vergi'), ('vat', 'ƏDV Ödəyicisi')],
                default='simplified',
                help_text='Faktura kəsiləndə biznesin vergi rejimi (tarixçə üçün saxlanılır)',
                max_length=20,
            ),
        ),
    ]
