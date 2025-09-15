# מדריך התחברות OutlookLLM לתיבת המיילים

## שלב 1: הכנות
1. ✅ ודא שהשרתים רצים:
   - Backend: `python "OutlookLLM Backend\openai_app.py"`
   - Frontend: `npm run dev-server` ב-`OutlookLLM Add-in`

## שלב 2: התקנה ב-Outlook Web (מומלץ)
1. **פתח את Outlook Web**: https://outlook.live.com
2. **התחבר** לחשבון Microsoft/Outlook שלך
3. **נווט לתוספות**:
   - לחץ על האייקון ⚙️ (Settings) בפינה הימנית העליונה
   - בחר "View all Outlook settings"
   - לחץ על "Mail" בתפריט השמאלי
   - בחר "Manage add-ins" או "Add-ins"
4. **התקן תוסף מותאם**:
   - לחץ על "+ Add add-in"
   - בחר "Add from URL"
   - הזן: `https://localhost:3001/manifest.xml`
   - לחץ "Install"

## שלב 3: התקנה ב-Outlook Desktop (חלופי)
1. **פתח את Outlook Desktop**
2. **נווט לתוספות**:
   - לחץ על "File" > "Manage Add-ins"
   - או: לחץ על "Get Add-ins" בסרגל הכלים
3. **התקן תוסף מותאם**:
   - לחץ על "My add-ins"
   - בחר "Add a custom add-in" > "Add from URL"
   - הזן: `https://localhost:3001/manifest.xml`
   - לחץ "OK"

## שלב 4: שימוש בתוסף
לאחר ההתקנה:
1. **פתח מייל חדש** או **בחר מייל קיים**
2. **חפש את התוסף** בסרגל הכלים:
   - בחר "OutlookLLM" או "Compose with AI"
3. **השתמש בתכונות**:
   - **טאב "יצירת מייל"**: ליצירת מיילים עם AI
   - **טאב "מיילים לא נקראים"**: לסיכום ומענה למיילים

## פתרון בעיות נפוצות

### 🚫 "Cannot load add-in"
- ודא ש-HTTPS פועל: https://localhost:3001
- בדוק אישור SSL (אמור להיות מהימן)

### 🚫 "Manifest not found"
- ודא שהשרת הקדמי רץ
- בדוק שהקובץ נגיש: https://localhost:3001/manifest.xml

### 🚫 "Office context not available"
- הרענן את הדף
- התחבר מחדש לחשבון Outlook
- נסה להשתמש ב-Outlook Web במקום Desktop

### 🚫 השרת הקלפי לא מגיב
- ודא ש-Ollama רץ: `ollama serve`
- בדוק שהמודל נטען: `ollama list`
- ודא שהשרת הקלפי רץ על פורט 8385

## קיצורי דרך לבדיקה
- **בדיקת שרת קלפי**: http://127.0.0.1:8385/health
- **בדיקת ממשק**: https://localhost:3001/taskpane.html
- **בדיקת manifest**: https://localhost:3001/manifest.xml

## תמיכה
במידה ויש בעיות, בדוק את לוגים:
- **Backend logs**: בטרמינל שבו רץ `python openai_app.py`
- **Frontend logs**: בטרמינל שבו רץ `npm run dev-server`
- **Browser logs**: F12 > Console בדפדפן
