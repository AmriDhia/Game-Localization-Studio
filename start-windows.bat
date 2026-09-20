@echo off
chcp 65001 > nul
title M.O.L.E. Game Translator Studio

echo ========================================================
echo    M.O.L.E. Game Translation Studio - استوديو تعريب الألعاب
echo ========================================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] Node.js غير مثبت على جهازك!
    echo يرجى تحميل وتثبيت Node.js من الموقع الرسمي: https://nodejs.org
    echo ثم أعد تشغيل هذا الملف.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, if not install
if not exist "node_modules\" (
    echo [1/3] جاري تثبيت الحزم والمكتبات المطلوبة لأول مرة...
    call npm install
    if %errorlevel% neq 0 (
        echo [خطأ] فشل تثبيت المكتبات. يرجى التأكد من اتصال الإنترنت والمحاولة ثانية.
        pause
        exit /b 1
    )
) else (
    echo [1/3] المكتبات مثبتة وجاهزة.
)

:: Build production assets if not built yet
if not exist "dist\" (
    echo [2/3] جاري بناء وتجهيز واجهة التطبيق...
    call npm run build
) else (
    echo [2/3] ملفات الواجهة جاهزة.
)

:: Start server
echo [3/3] جاري تشغيل خادم الاستوديو محلياً...
echo.
echo ========================================================
echo   التطبيق يعمل الآن على: http://localhost:3000
echo   سيتم فتح المتصفح تلقائياً...
echo   (للإغلاق في أي وقت اضغط Ctrl + C في هذه النافذة)
echo ========================================================
echo.

:: Open default browser
start http://localhost:3000

:: Run the server
npm run start

pause
