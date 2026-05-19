@echo off
echo ========================================
echo   CapitalSweets - Server Launcher
echo ========================================
echo.

REM Copy frontend files to server/public
echo Syncing frontend files...
copy /Y "%~dp0index.html"   "%~dp0server\public\index.html"   >nul
copy /Y "%~dp0style.css"    "%~dp0server\public\style.css"    >nul
copy /Y "%~dp0app.js"       "%~dp0server\public\app.js"       >nul
copy /Y "%~dp0checkout.js"  "%~dp0server\public\checkout.js"  >nul
echo Done.

echo.
echo Stopping existing server (if any)...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo Installing dependencies...
cd /d "%~dp0server"
call npm install --silent

echo.
echo Starting CapitalSweets server...
start "CapitalSweets Server" cmd /k "node server.js"

timeout /t 3 /nobreak >nul
echo.
echo Opening browser...
start chrome "http://localhost:3000"

echo.
echo ========================================
echo   Shop:      http://localhost:3000
echo   Dashboard: http://localhost:3000/dashboard
echo ========================================
timeout /t 5 /nobreak >nul
