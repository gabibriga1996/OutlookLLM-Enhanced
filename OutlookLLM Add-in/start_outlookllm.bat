@echo off
echo.
echo ====================================================
echo  Starting OutlookLLM Complete System
echo ====================================================
echo.

echo Starting Backend Server (Port 8385)...
start "OutlookLLM Backend" powershell -Command "cd 'c:\Develop\OutlookLLM\OutlookLLM Backend'; & 'C:/Users/User/AppData/Local/Programs/Python/Python38/python.exe' simple_mock_backend.py"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server (Port 3000)...
start "OutlookLLM Frontend" powershell -Command "cd 'c:\Develop\OutlookLLM\OutlookLLM Add-in'; npm start"

echo.
echo Waiting 10 seconds for frontend to start...
timeout /t 10 /nobreak >nul

echo.
echo ====================================================
echo  System Status Check
echo ====================================================
echo.

echo Checking Backend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8385/health' -UseBasicParsing -TimeoutSec 5; Write-Host 'Backend is running ✓' -ForegroundColor Green } catch { Write-Host 'Backend failed to start ✗' -ForegroundColor Red }"

echo.
echo Checking Frontend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://localhost:3000' -UseBasicParsing -TimeoutSec 5; Write-Host 'Frontend is running ✓' -ForegroundColor Green } catch { Write-Host 'Frontend failed to start ✗' -ForegroundColor Red }"

echo.
echo ====================================================
echo  Ready for Outlook Integration!
echo ====================================================
echo.
echo Your OutlookLLM system is now running:
echo - Frontend: https://localhost:3000
echo - Backend:  http://localhost:8385
echo.
echo Next step: Run install_outlook_addin.bat to connect to Outlook
echo.
pause
