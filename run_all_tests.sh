#!/bin/bash

echo "========================================="
echo "Running Backend Tests with Coverage..."
echo "========================================="
cd backend || exit 1

if [ ! -f "venv/Scripts/python.exe" ]; then
    echo "Virtual environment not found in backend!"
    exit 1
fi

./venv/Scripts/python.exe -m coverage run manage.py test
BACKEND_STATUS=$?

echo "Generating Coverage Report..."
./venv/Scripts/python.exe -m coverage report

echo ""
echo "========================================="
echo "Running Frontend Tests..."
echo "========================================="
cd ../frontend || exit 1

npm run test
FRONTEND_STATUS=$?

echo "========================================="
echo "Test Summary:"
if [ $BACKEND_STATUS -ne 0 ]; then echo "Backend Tests: FAILED"; else echo "Backend Tests: PASSED"; fi
if [ $FRONTEND_STATUS -ne 0 ]; then echo "Frontend Tests: FAILED"; else echo "Frontend Tests: PASSED"; fi
echo "========================================="

if [ $BACKEND_STATUS -ne 0 ] || [ $FRONTEND_STATUS -ne 0 ]; then
    exit 1
fi
