from allauth.account.adapter import DefaultAccountAdapter

class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        """
        Saves a new `User` instance using information provided in the
        signup form.
        """
        user = super().save_user(request, user, form, commit=False)
        data = form.cleaned_data
        user.first_name = data.get('first_name', '')
        user.last_name = data.get('last_name', '')
        if commit:
            user.save()
        return user

    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Constructs the email confirmation (activation) url.
        """
        # Frontend URL for verification
        from django.conf import settings
        frontend_url = 'https://invoiceaz.vercel.app' if not settings.DEBUG else 'http://localhost:5173'
        url = f"{frontend_url}/verify-email/{emailconfirmation.key}/"
        return url

    def send_mail(self, template_prefix, email, context):
        """
        Override send_mail to be non-blocking using a thread.
        This prevents registration hangs when SMTP is slow or failing.
        """
        import threading
        thread = threading.Thread(
            target=super().send_mail,
            args=(template_prefix, email, context)
        )
        thread.start()
