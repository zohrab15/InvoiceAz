import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def generate_referral_codes(apps, schema_editor):
    """Assign unique referral codes to all existing users."""
    User = apps.get_model('users', 'User')
    for user in User.objects.filter(referral_code=''):
        user.referral_code = uuid.uuid4().hex[:8].upper()
        user.save(update_fields=['referral_code'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_alter_teammember_role'),
    ]

    operations = [
        # Step 1: Add referral_code WITHOUT unique constraint, allowing blank
        migrations.AddField(
            model_name='user',
            name='referral_code',
            field=models.CharField(max_length=12, blank=True, default=''),
            preserve_default=False,
        ),
        # Step 2: Populate unique codes for existing rows
        migrations.RunPython(generate_referral_codes, migrations.RunPython.noop),
        # Step 3: Now enforce uniqueness
        migrations.AlterField(
            model_name='user',
            name='referral_code',
            field=models.CharField(max_length=12, unique=True, blank=True),
        ),
        # Step 4: Add remaining referral fields
        migrations.AddField(
            model_name='user',
            name='referral_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='user',
            name='referral_rewarded',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='referred_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='referrals',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Step 5: Create DiscountCoupon model
        migrations.CreateModel(
            name='DiscountCoupon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=20, unique=True)),
                ('discount_percent', models.PositiveSmallIntegerField()),
                ('reason', models.CharField(
                    choices=[('referrer_bonus', 'Referrer Bonus'), ('new_user_bonus', 'New User Bonus')],
                    max_length=20,
                )),
                ('is_used', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='coupons',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
