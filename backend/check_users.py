import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

def check_users():
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    for u in users:
        print(f" - ID: {u.id} | Email: {u.email} | Date Joined: {u.created_at}")

if __name__ == "__main__":
    check_users()
