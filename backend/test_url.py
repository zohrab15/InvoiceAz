import requests
import json

# Replace with actual token and business ID if testing against a live server
# For local testing, we might need a more complex setup.
# But I can check the URL resolution in Django.

print("Testing URL resolution...")
try:
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    from django.urls import resolve, reverse
    
    url = '/api/clients/bulk-assign/'
    match = resolve(url)
    print(f"URL {url} resolved to: {match.func}")
    print(f"View name: {match.view_name}")
    print(f"URL name: {match.url_name}")
    
except Exception as e:
    print(f"Error: {e}")
