@echo off
echo =========================================
echo Running Backend Tests with Coverage...
echo =========================================
cd backend
if not exist "venv\Scripts\python.exe" (
    echo Virtual environment not found in backend!
    exit /b 1
)
call venv\Scripts\python.exe -m coverage run manage.py test
if %ERRORLEVEL% NEQ 0 (
    echo Backend tests failed.
    exit /b %ERRORLEVEL%
)
call venv\Scripts\python.exe -m coverage report

echo.
echo =========================================
echo Running Frontend Tests...
echo =========================================
cd ..\frontend
call npm run test
if %ERRORLEVEL% NEQ 0 (
    echo Frontend tests failed.
    exit /b %ERRORLEVEL%
)

cd ..
echo =========================================
echo All tests have completed successfully!
echo =========================================
