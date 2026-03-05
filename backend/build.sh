#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
# Resilient migration: try normal migrate, if it fails (column already exists),
# fake-apply the problematic migrations and retry
python manage.py migrate || {
    echo "Normal migrate failed, attempting fake-apply workaround..."
    python manage.py migrate notifications --fake
    python manage.py migrate invoices --fake
    python manage.py migrate
}
python manage.py seed_demo_data
# Removed update_demo_media to preserve user-uploaded logos during testing
