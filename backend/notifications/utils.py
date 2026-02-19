from .models import Notification, NotificationSetting

def create_notification(user, title, message, type='info', link=None, setting_key=None):
    """
    Utility function to create a new notification for a user.
    Checks user's NotificationSetting if setting_key is provided.
    """
    if setting_key:
        settings, _ = NotificationSetting.objects.get_or_create(user=user)
        if not getattr(settings, f"in_app_{setting_key}", True):
            return None

    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=type,
        link=link
    )
