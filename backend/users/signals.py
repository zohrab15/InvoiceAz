import uuid
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='users.User')
def auto_create_business_for_new_user(sender, instance, created, **kwargs):
    """
    Auto-create a default business when a new user registers,
    so they immediately have OWNER access and all pages work.
    """
    if not created:
        return
    from users.models import Business
    # Only create if user has no businesses yet
    if not Business.objects.filter(user=instance).exists():
        Business.objects.create(
            user=instance,
            name=f"{instance.first_name or instance.email.split('@')[0]}'s Business",
            is_active=True,
        )


@receiver(post_save, sender='users.User')
def handle_pro_upgrade(sender, instance, **kwargs):
    """
    When a referred user upgrades to Pro or Premium for the first time,
    reward both the referred user (10% coupon) and the referrer (20% coupon).
    Uses referral_rewarded flag to prevent double-rewarding.
    """
    if instance.membership not in ('pro', 'premium'):
        return
    if instance.referral_rewarded:
        return
    if not instance.referred_by_id:
        return

    # Import here to avoid circular imports
    from users.models import DiscountCoupon

    # New user bonus (10%)
    DiscountCoupon.objects.create(
        user=instance,
        code=f"NEW-10-{uuid.uuid4().hex[:6].upper()}",
        discount_percent=10,
        reason='new_user_bonus',
    )

    # Referrer bonus (20%)
    referrer = instance.referred_by
    DiscountCoupon.objects.create(
        user=referrer,
        code=f"REF-20-{uuid.uuid4().hex[:6].upper()}",
        discount_percent=20,
        reason='referrer_bonus',
    )

    # Increment referral_count and mark as rewarded
    # Use update() to avoid triggering this signal again
    sender.objects.filter(pk=referrer.pk).update(
        referral_count=models.F('referral_count') + 1
    )
    sender.objects.filter(pk=instance.pk).update(
        referral_rewarded=True
    )
