#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
python manage.py seed_demo_data
# Removed update_demo_media to preserve user-uploaded logos during testing
