@echo off
REM Face Recognition API Server Startup Script
REM Double-click this file to start the server

echo ========================================
echo Face Recognition API Server
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo Please install Python 3.8 or higher.
    echo.
    pause
    exit /b 1
)

echo [OK] Python found!
python --version
echo.

REM Check if required modules are installed
echo Checking dependencies...
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Flask not installed!
    echo Run: pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

python -c "import face_recognition" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] face_recognition not installed!
    echo Run: pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

python -c "import cv2" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] opencv-python not installed!
    echo Run: pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo [OK] All dependencies found!
echo.
echo ========================================
echo Starting server on http://localhost:5000
echo ========================================
echo Press Ctrl+C to stop the server
echo.
echo.

python api_server.py

if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start!
    echo Check the error messages above.
    echo.
)

pause

