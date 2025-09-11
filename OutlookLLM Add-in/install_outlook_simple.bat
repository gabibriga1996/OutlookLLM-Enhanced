@echo off
echo.
echo ====================================================
echo  OutlookLLM Add-in Installation for Outlook
echo ====================================================
echo.

echo Step 1: Checking if both servers are running...
echo.

echo Checking Frontend (port 3000)...
curl -k -s https://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend is running ✓
) else (
    echo Frontend is NOT running ✗
    echo Please start the frontend first: npm start
)

echo.
echo Checking Backend (port 8385)...
curl -s http://localhost:8385/health >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend is running ✓
) else (
    echo Backend is NOT running ✗
    echo Please start the backend first
)

echo.
echo ====================================================
echo  Step 2: Manual Add-in Installation
echo ====================================================
echo.
echo Choose your installation method:
echo.
echo [1] Outlook Desktop Application
echo [2] Outlook Web (outlook.office.com)
echo [3] View instructions only
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto desktop
if "%choice%"=="2" goto web
if "%choice%"=="3" goto instructions
goto instructions

:desktop
echo.
echo === Outlook Desktop Installation ===
echo.
echo 1. Open Outlook desktop application
echo 2. Click "File" in the top menu
echo 3. Click "Manage Add-ins"
echo 4. Click "Add a custom add-in" ^> "Add from file"
echo 5. Browse and select: %~dp0manifest.xml
echo 6. Click "Install"
echo 7. Accept any security prompts
echo.
echo Opening Outlook now...
start outlook
echo.
echo After installation, look for "OutlookLLM" in the ribbon!
goto end

:web
echo.
echo === Outlook Web Installation ===
echo.
echo 1. Go to: https://outlook.office.com
echo 2. Click Settings (gear icon) ^> "View all Outlook settings"
echo 3. Go to "General" ^> "Manage add-ins"
echo 4. Click "Add a custom add-in" ^> "Add from file"
echo 5. Upload: %~dp0manifest.xml
echo 6. Click "Install"
echo.
echo Opening Outlook Web now...
start https://outlook.office.com
echo.
goto end

:instructions
echo.
echo ====================================================
echo  Installation Instructions
echo ====================================================
echo.
echo Your OutlookLLM system is ready! Here's what to do:
echo.
echo === For Outlook Desktop ===
echo 1. Open Outlook desktop application
echo 2. File ^> Manage Add-ins ^> Add a custom add-in ^> Add from file
echo 3. Select: %~dp0manifest.xml
echo 4. Install and accept security prompts
echo.
echo === For Outlook Web ===
echo 1. Go to https://outlook.office.com
echo 2. Settings ^> View all Outlook settings ^> General ^> Manage add-ins
echo 3. Add a custom add-in ^> Add from file ^> Upload manifest.xml
echo.
echo === After Installation ===
echo 1. Compose a new email - look for "OutlookLLM" in ribbon
echo 2. Click "Compose with AI" button
echo 3. Your add-in opens in a task pane!
echo 4. Switch to "Q&A" tab to search your real emails and calendar
echo.

:end
echo.
echo ====================================================
echo  Testing Your Installation
echo ====================================================
echo.
echo After installing the add-in:
echo.
echo 1. Compose a new email in Outlook
echo 2. Look for "OutlookLLM" group in the ribbon
echo 3. Click "Compose with AI" button
echo 4. The add-in should open in a task pane
echo 5. Try the "Q&A" tab to search your emails and calendar!
echo.
echo ====================================================
echo  Troubleshooting
echo ====================================================
echo.
echo If the add-in doesn't appear:
echo - Make sure both frontend and backend are running
echo - Refresh Outlook or restart it
echo - Try clearing Outlook cache
echo.
echo If you see security warnings:
echo - Trust the localhost SSL certificate
echo - Allow mixed content if prompted
echo.
echo Manifest file location: %~dp0manifest.xml
echo.
pause
