@echo off
echo התקנת OutlookLLM COM Add-in...
echo.

REM Close Outlook if running
taskkill /f /im outlook.exe 2>nul

REM Import registry file
echo מוסיף רישומים לרישום המערכת...
regedit /s install-com-addin.reg

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Outlook
echo פותח Outlook...
start outlook

echo.
echo התקנה הושלמה!
echo אנא ודא שהשרתים רצים:
echo 1. Frontend: https://localhost:3001
echo 2. Backend: http://127.0.0.1:8385
echo.
echo לאחר פתיחת Outlook:
echo File ^> Options ^> Add-ins ^> COM Add-ins ^> Go
echo ודא שהתוסף OutlookLLM מסומן
echo.
pause
