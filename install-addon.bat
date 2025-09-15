@echo off
echo ===========================================
echo OutlookLLM - התקנת Add-in
echo ===========================================
echo.

echo 1. בודק אם השרתים רצים...
curl -s http://127.0.0.1:8385/health > nul
if %errorlevel% neq 0 (
    echo ❌ השרת האחורי לא רץ! הפעל את השרת קודם.
    echo הפעל: python "OutlookLLM Backend\openai_app.py"
    pause
    exit /b 1
)

curl -s https://localhost:3001 > nul
if %errorlevel% neq 0 (
    echo ❌ השרת הקדמי לא רץ! הפעל את השרת קודם.
    echo הפעל: npm run dev-server ב OutlookLLM Add-in
    pause
    exit /b 1
)

echo ✅ השרתים רצים!
echo.

echo 2. פותח את Outlook Web...
start "https://outlook.live.com"
echo.

echo 3. המתן 5 שניות ואז פותח את אתר ההתקנה...
timeout /t 5 > nul
start "https://outlook.live.com/mail/0/options/general/addins"
echo.

echo ===========================================
echo הוראות ההתקנה:
echo ===========================================
echo 1. התחבר לחשבון Outlook שלך
echo 2. לחץ על "Get add-ins" או "קבל תוספות"
echo 3. לחץ על "My add-ins" או "התוספות שלי"
echo 4. לחץ על "Add a custom add-in" או "הוסף תוסף מותאם אישית"
echo 5. בחר "Add from URL" או "הוסף מכתובת"
echo 6. הזן: https://localhost:3001/manifest.xml
echo 7. לחץ על "Install" או "התקן"
echo.
echo לאחר ההתקנה, התוסף יופיע בתפריט הכלים של Outlook!
echo ===========================================
pause
