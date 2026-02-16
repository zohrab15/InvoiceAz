import os
import requests

from django.core.files.base import ContentFile

from allauth.account.models import EmailAddress
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from users.models import User

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def save_user(self, request, sociallogin, form=None):
        """
        Saves a new `User` instance using information provided by the
        social login provider.
        """
        user = super().save_user(request, sociallogin, form)
        
        # Auto-verify email for social accounts
        if user.email:
            EmailAddress.objects.get_or_create(
                user=user, 
                email=user.email, 
                defaults={'verified': True, 'primary': True}
            )
            # If it existed but wasn't verified, verify it now
            EmailAddress.objects.filter(user=user, email=user.email).update(verified=True)
            
        return user

    def populate_user(self, request, sociallogin, data):
        """
        Hook that can be used to further populate the user instance.
        """
        user = super().populate_user(request, sociallogin, data)
        
        # Sync profile picture from Google if user has none
        picture_url = sociallogin.account.extra_data.get('picture')
        
        if not user.avatar and picture_url:
            try:
                response = requests.get(picture_url, timeout=10)
                if response.status_code == 200:
                    # Generate a clean filename
                    ext = '.jpg'
                    content_type = response.headers.get('Content-Type', '')
                    if 'image/png' in content_type:
                        ext = '.png'
                    elif 'image/gif' in content_type:
                        ext = '.gif'
                    
                    filename = f"avatar_{user.email.replace('@', '_at_')}{ext}"
                    user.avatar.save(filename, ContentFile(response.content), save=False)
                    
                    # If user already exists in DB, save the field now
                    if user.pk:
                        user.save(update_fields=['avatar'])
                        
                    print(f"Successfully fetched and attached social avatar for {user.email}")
                else:
                    print(f"Failed to fetch social avatar for {user.email}: HTTP {response.status_code}")
            except Exception as e:
                print(f"Error fetching social avatar for {user.email}: {e}")

        # Force username to be None if it's somehow set, though our model ignores it
        if hasattr(user, 'username'):
            user.username = None
        return user

    def authentication_error(self, request, provider_id, error=None, exception=None, extra_context=None):
        """
        Log authentication errors for debugging.
        """
        # print(f"Social Auth Error ({provider_id}): {error}, Exception: {exception}")
        # super().authentication_error(request, provider_id, error, exception, extra_context)
        pass
