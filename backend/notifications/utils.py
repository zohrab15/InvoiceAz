from .models import Notification

def create_notification(user, title, message, type='info', link=None):
    """
    Utility function to create a new notification for a user.
    """
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=type,
        link=link
    )
