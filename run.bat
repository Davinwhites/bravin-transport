@echo off
title Bravin Transport Launcher
echo ===================================================
echo   Starting Bravin Transport Web App Simulator...
echo ===================================================
echo.
echo Attempting to start local server...
echo.

:: Check if Python is installed to start a server
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python detected. Starting server on http://localhost:8000...
    start "" "http://localhost:8000/bravin-transport.html"
    python -m http.server 8000
    goto end
)

:: Check if Node is installed (npx)
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node/npx detected. Starting server on http://localhost:8080...
    start "" "http://localhost:8080/bravin-transport.html"
    npx http-server -p 8080
    goto end
)

:: Fallback: Open directly as file if no server is available
echo [WARNING] No local server (Python/Node) detected.
echo Opening app directly in browser (some mobile features like PWA offline installation will be disabled).
echo.
start "" "bravin-transport.html"

:end
pause
