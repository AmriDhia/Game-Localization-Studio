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

:: Start server in the background and open as a standalone desktop window
echo [3/3] جاري تشغيل البرنامج كنافذة سطح مكتب مستقلة (Desktop Application)...
echo.
echo ========================================================
echo   جاري فتح البرنامج في نافذة مستقلة خاصة به (بدون متصفح)
echo   يمكنك تصغير هذه الشاشة وترك البرنامج يعمل.
echo ========================================================
echo.

:: Start the node server in background
start "MOLE-Server" /B node dist/server.cjs

:: Wait a moment for server to bind port
timeout /t 2 /nobreak >nul

:: Launch as a Standalone Desktop Application Window (No URL bar, No tabs, Native desktop frame)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1400,900
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1400,900
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --window-size=1400,900
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --window-size=1400,900
) else (
    start http://localhost:3000
)

:: When desktop app window is closed, close background server
taskkill /F /IM node.exe /FI "WINDOWTITLE eq MOLE-Server" >nul 2>&1
exit /b 0
