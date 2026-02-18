#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

# Temporarily disabled collectstatic to debug build hang
# python manage.py collectstatic --no-input

python manage.py migrate
