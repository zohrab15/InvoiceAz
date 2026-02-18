#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

echo "=== START COLLECTSTATIC ==="
python manage.py collectstatic --no-input --verbosity 2
echo "=== END COLLECTSTATIC ==="

echo "=== CHECKING STATICFILES DIR ==="
ls -R staticfiles || echo "staticfiles directory not found"
echo "=== END CHECKING ==="

python manage.py migrate
