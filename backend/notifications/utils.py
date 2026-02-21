from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, NotificationSetting

def create_notification(user, title, message, type='info', link=None, setting_key=None):
    """
    Utility function to create a new notification for a user.
    Checks user's NotificationSetting if setting_key is provided.
    Sends email if email setting is enabled.
    """
    in_app_enabled = True
    email_enabled = False

    if setting_key:
        settings_obj, _ = NotificationSetting.objects.get_or_create(user=user)
        in_app_enabled = getattr(settings_obj, f"in_app_{setting_key}", True)
        email_enabled = getattr(settings_obj, f"email_{setting_key}", False)

    notification = None
    if in_app_enabled:
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            type=type,
            link=link
        )

    if email_enabled and user.email:
        try:
            subject = f"InvoiceAZ: {title}"
            email_body = f"{message}\n\nİzləmək üçün daxil olun: {getattr(settings, 'FRONTEND_URL', 'https://invoiceaz.vercel.app')}{link if link else ''}"
            send_mail(
                subject,
                email_body,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending notification email: {e}")

    return notification
