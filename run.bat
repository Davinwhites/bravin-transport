@echo off
title Bravin Transport Local Server
echo ===================================================
echo   Bravin Transport Local Server Launcher
echo ===================================================
echo.

where php >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] PHP found! Starting PHP development server...
    echo.
    echo Launching: http://localhost:8080/index.html
    start http://localhost:8080/index.html
    php -S localhost:8080
) else (
    echo [NOTICE] PHP not found in system PATH.
    echo.
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Python found! Starting static fallback server...
        echo Launching: http://localhost:8000/index.html
        start http://localhost:8000/index.html
        python -m http.server 8000
    ) else (
        echo [ERROR] Neither PHP nor Python is installed on your system.
        echo Please install PHP or Python to test this application locally.
        echo.
    )
)
pause
