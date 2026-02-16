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
        url = f"http://localhost:5173/verify-email/{emailconfirmation.key}/"
        return url
