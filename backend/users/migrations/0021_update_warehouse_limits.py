from django.db import migrations

def update_warehouse_limits(apps, schema_editor):
    SubscriptionPlan = apps.get_model('users', 'SubscriptionPlan')
    
    # Pulsuz (Free)
    SubscriptionPlan.objects.filter(name='free').update(warehouses_limit=1)
    
    # Pro
    SubscriptionPlan.objects.filter(name='pro').update(warehouses_limit=3)
    
    # Premium
    SubscriptionPlan.objects.filter(name='premium').update(warehouses_limit=None)

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0020_add_full_plan_features'),
    ]

    operations = [
        migrations.RunPython(update_warehouse_limits),
    ]
