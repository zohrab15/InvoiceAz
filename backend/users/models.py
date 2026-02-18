from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a Superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=50, unique=True, help_text="Slug name (e.g., 'free', 'pro')")
    label = models.CharField(max_length=100, help_text="Display name (e.g., 'Pulsuz', 'Pro')")
    
    invoices_per_month = models.IntegerField(default=5, null=True, blank=True)
    clients_limit = models.IntegerField(default=10, null=True, blank=True)
    expenses_per_month = models.IntegerField(default=20, null=True, blank=True)
    businesses_limit = models.IntegerField(default=1, null=True, blank=True)
    
    has_forecast_analytics = models.BooleanField(default=False)
    has_csv_export = models.BooleanField(default=False)
    has_premium_pdf = models.BooleanField(default=False)
    has_api_access = models.BooleanField(default=False)
    
    team_members_limit = models.IntegerField(default=0, null=True, blank=True)
    has_custom_themes = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.label

class User(AbstractUser):
    username = None
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, max_length=500)
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='az')
    
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    MEMBERSHIP_CHOICES = (
        ('free', 'Pulsuz'),
        ('pro', 'Pro'),
        ('premium', 'Premium'),
    )
    membership = models.CharField(max_length=10, choices=MEMBERSHIP_CHOICES, default='free')
    is_email_verified = models.BooleanField(default=False)
    
    # Security fields
    totp_secret = models.CharField(max_length=32, blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)
    
    # Timestamps (AbstractUser has date_joined, but docs asked for created_at/updated_at)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

class Business(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='businesses')
    name = models.CharField(max_length=255)
    voen = models.CharField(max_length=20, blank=True, null=True) # Tax ID
    logo = models.ImageField(upload_to='logos/', blank=True, null=True, max_length=500)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Banking
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    iban = models.CharField(max_length=34, blank=True, null=True)
    swift = models.CharField(max_length=11, blank=True, null=True)
    
    # Budgeting
    budget_limit = models.DecimalField(max_digits=12, decimal_places=2, default=1000.00)
    
    default_invoice_theme = models.CharField(max_length=20, default='modern')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Businesses"
