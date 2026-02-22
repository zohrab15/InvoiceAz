#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py makemigrations --no-input
python manage.py migrate
python manage.py seed_demo_data
python manage.py update_demo_media
