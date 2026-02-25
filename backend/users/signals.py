import uuid
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


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


@receiver(post_delete, sender='users.TeamMember')
def unassign_clients_on_member_delete(sender, instance, **kwargs):
    """
    When a team member is removed from a business, clients assigned to them
    in that specific business should be unassigned.
    """
    if not instance.user or not instance.business:
        return

    from clients.models import Client
    # Only unassign clients belonging to the business the member was removed from
    Client.objects.filter(
        business=instance.business,
        assigned_to=instance.user
    ).update(assigned_to=None)
