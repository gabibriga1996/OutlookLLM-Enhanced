# OutlookLLM COM Add-in Installation Script
# תסריט התקנת תוסף COM עבור Outlook Desktop

Write-Host "התקנת OutlookLLM COM Add-in..." -ForegroundColor Green

# Check if Outlook is running
$outlookProcesses = Get-Process -Name "OUTLOOK" -ErrorAction SilentlyContinue
if ($outlookProcesses) {
    Write-Host "סוגר את Outlook..." -ForegroundColor Yellow
    Stop-Process -Name "OUTLOOK" -Force
    Start-Sleep -Seconds 3
}

# Install registry entries
Write-Host "מוסיף רישומים לרישום המערכת..." -ForegroundColor Yellow
try {
    # Add WEF Developer key
    $wefPath = "HKCU:\SOFTWARE\Microsoft\Office\16.0\WEF\Developer\eb774e01-2b8b-4518-8a0b-0475615abdd0\OutlookAddinManifest"
    if (!(Test-Path $wefPath)) {
        New-Item -Path $wefPath -Force | Out-Null
    }
    
    $manifestPath = "C:\develop\llm\OutlookLLM\OutlookLLM Add-in\manifest-com.xml"
    Set-ItemProperty -Path $wefPath -Name "FileName" -Value $manifestPath
    Set-ItemProperty -Path $wefPath -Name "UseDirectLoading" -Value 1 -Type DWord
    
    # Add COM Add-in key
    $addinPath = "HKCU:\SOFTWARE\Microsoft\Office\Outlook\Addins\OutlookLLM"
    if (!(Test-Path $addinPath)) {
        New-Item -Path $addinPath -Force | Out-Null
    }
    
    Set-ItemProperty -Path $addinPath -Name "FriendlyName" -Value "OutlookLLM COM Add-in"
    Set-ItemProperty -Path $addinPath -Name "Description" -Value "COM Add-in for Outlook with AI features"
    Set-ItemProperty -Path $addinPath -Name "LoadBehavior" -Value 3 -Type DWord
    Set-ItemProperty -Path $addinPath -Name "CommandLineSafe" -Value 1 -Type DWord
    
    Write-Host "רישומים נוספו בהצלחה!" -ForegroundColor Green
} catch {
    Write-Host "שגיאה בהוספת רישומים: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check if servers are running
Write-Host "בודק שרתים..." -ForegroundColor Yellow

$frontendRunning = $false
$backendRunning = $false

try {
    $response = Invoke-WebRequest -Uri "https://localhost:3001" -UseBasicParsing -TimeoutSec 5
    $frontendRunning = $true
    Write-Host "✅ Frontend server רץ על https://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend server לא רץ על https://localhost:3001" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8385/health" -UseBasicParsing -TimeoutSec 5
    $backendRunning = $true
    Write-Host "✅ Backend server רץ על http://127.0.0.1:8385" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server לא רץ על http://127.0.0.1:8385" -ForegroundColor Red
}

if (!$frontendRunning -or !$backendRunning) {
    Write-Host "אנא ודא שהשרתים רצים לפני פתיחת Outlook!" -ForegroundColor Yellow
    Write-Host "הפעל:" -ForegroundColor White
    if (!$frontendRunning) {
        Write-Host "  cd 'OutlookLLM Add-in' ; npm run dev-server" -ForegroundColor Cyan
    }
    if (!$backendRunning) {
        Write-Host "  cd 'OutlookLLM Backend' ; python openai_app.py" -ForegroundColor Cyan
    }
}

# Start Outlook
Write-Host "פותח Outlook..." -ForegroundColor Green
Start-Process "outlook.exe"

Write-Host ""
Write-Host "התקנה הושלמה!" -ForegroundColor Green
Write-Host "לאחר פתיחת Outlook:"
Write-Host "1. לך ל File > Options > Add-ins" -ForegroundColor White
Write-Host "2. בחר 'COM Add-ins' בתחתית ולחץ Go" -ForegroundColor White
Write-Host "3. ודא ש'OutlookLLM COM Add-in' מסומן" -ForegroundColor White
Write-Host "4. התוסף יופיע ברצועת הכלים של Outlook" -ForegroundColor White
