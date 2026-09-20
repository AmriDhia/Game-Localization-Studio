' ========================================================
' M.O.L.E. Game Translation Studio - مشغل سطح المكتب الصامت
' يقوم هذا الملف بفتح البرنامج كنافذة سطح مكتب مستقلة
' وبدون إظهار شاشة موجه الأوامر السوداء (CMD)
' ========================================================
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c start-windows.bat", 0, False
Set WshShell = Nothing
