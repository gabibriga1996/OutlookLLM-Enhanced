@echo off
echo.
echo ====================================================
echo  OutlookLLM Add-in Installation for Outlook
echo ====================================================
echo.

echo Step 1: Checking if both servers are running...
echo.

echo Checking Frontend (port 3000)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://localhost:3000' -UseBasicParsing -TimeoutSec 5; Write-Host 'Frontend is running ✓' -ForegroundColor Green } catch { Write-Host 'Frontend is NOT running ✗' -ForegroundColor Red; Write-Host 'Please start the frontend first: npm start' }"

echo.
echo Checking Backend (port 8385)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8385/health' -UseBasicParsing -TimeoutSec 5; Write-Host 'Backend is running ✓' -ForegroundColor Green } catch { Write-Host 'Backend is NOT running ✗' -ForegroundColor Red; Write-Host 'Please start the backend first' }"

echo.
echo Step 2: Installing add-in to Outlook...
echo.

echo Opening Microsoft 365 Admin Center for add-in installation...
echo You will need to:
echo 1. Go to the admin center
echo 2. Navigate to Settings > Integrated apps
echo 3. Upload the manifest.xml file
echo 4. Deploy to your organization/users

start https://admin.microsoft.com/

echo.
echo Alternative: Install for development using Office Add-in Dev Tools...
echo.

echo Would you like to use the developer installation method? (Y/N)
set /p choice=

if /i "%choice%"=="Y" goto devinstall
if /i "%choice%"=="y" goto devinstall

echo.
echo Manual Installation Instructions:
echo 1. Open Outlook (desktop or web)
echo 2. Go to Home > Get Add-ins
echo 3. Click "My add-ins"
echo 4. Click "Add a custom add-in" > "Add from file"
echo 5. Browse and select: %~dp0manifest.xml
echo 6. Click "Install"
echo.
goto end

:devinstall
echo.
echo Installing for development...
echo.

echo Checking if Office Add-in Dev Tools are installed...
npm list -g office-addin-dev-certs >nul 2>&1
if %errorlevel% neq 0 (
    echo Office Add-in Dev Tools not found. Installing...
    npm install -g office-addin-dev-certs
    echo.
)

echo Trusting development certificates...
npm run --silent office-addin-dev-certs install --machine 2>nul || echo Note: Certificate installation may require manual setup

echo.
echo Starting sideloading process...
echo.

echo Please follow these steps in Outlook:
echo.
echo === For Outlook Desktop ===
echo 1. Open Outlook desktop application
echo 2. Click "File" > "Manage Add-ins"
echo 3. Click "Add a custom add-in" > "Add from file"
echo 4. Select: %~dp0manifest.xml
echo 5. Click "Install"
echo.
echo === For Outlook Web ===
echo 1. Go to https://outlook.office.com
echo 2. Click Settings (gear icon) > "View all Outlook settings"
echo 3. Go to "General" > "Manage add-ins"
echo 4. Click "Add a custom add-in" > "Add from file"
echo 5. Upload: %~dp0manifest.xml
echo.

:end
echo.
echo ====================================================
echo  Next Steps After Installation:
echo ====================================================
echo.
echo 1. In Outlook, compose a new email
echo 2. Look for "OutlookLLM" group in the ribbon
echo 3. Click "Compose with AI" button
echo 4. Your add-in should open in a task pane!
echo.
echo For reading emails:
echo 1. Open any email in Outlook
echo 2. Look for "OutlookLLM" group in the ribbon
echo 3. Click "Summarize with AI" button
echo.
echo ====================================================
echo  Troubleshooting:
echo ====================================================
echo.
echo If the add-in doesn't appear:
echo - Make sure both frontend and backend are running
echo - Check that SSL certificates are trusted
echo - Try refreshing Outlook or restarting it
echo - Check browser console for any errors
echo.
echo If you see security warnings:
echo - Trust the localhost SSL certificate
echo - Allow mixed content if prompted
echo.
pause
