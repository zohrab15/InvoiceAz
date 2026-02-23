from django.db import models
from django.conf import settings

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('info', 'Məlumat'),
        ('success', 'Uğurlu'),
        ('warning', 'Xəbərdarlıq'),
        ('error', 'Xəta'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES, default='info')
    category = models.CharField(max_length=50, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"

class NotificationSetting(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_settings')
    
    # In-app notifications
    in_app_invoice_created = models.BooleanField(default=True)
    in_app_invoice_viewed = models.BooleanField(default=True)
    in_app_payment_received = models.BooleanField(default=True)
    in_app_client_created = models.BooleanField(default=True)
    in_app_expense_created = models.BooleanField(default=True)
    in_app_low_stock = models.BooleanField(default=True)
    
    # Email notifications
    email_invoice_viewed = models.BooleanField(default=True)
    email_payment_received = models.BooleanField(default=True)
    email_low_stock = models.BooleanField(default=True)

    def __str__(self):
        return f"Settings for {self.user.email}"
