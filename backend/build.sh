#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

echo "=== BUILD LOGS START ==="
echo "Current Path: $(pwd)"
ls -F

echo "=== START COLLECTSTATIC ==="
python manage.py collectstatic --no-input --verbosity 2
echo "=== END COLLECTSTATIC ==="

echo "=== CHECKING OUTPUT ==="
ls -d staticfiles || echo "staticfiles dir not found"
ls -F staticfiles | head -n 20 || echo "staticfiles is empty or missing"

python manage.py migrate
echo "=== BUILD LOGS END ==="
