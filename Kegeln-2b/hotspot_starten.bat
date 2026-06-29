@echo off
:: Erhöht die Rechte automatisch auf Administrator, da für den Hotspot Admin-Rechte gebraucht werden
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :run
) else (
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B
)

:run
title Windows Hotspot Manager
cls
echo ===================================================
echo             Windows Hotspot aktivieren             
echo ===================================================
echo.

:: Hier startest du den Hotspot über PowerShell
powershell -Command "$tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime]::CreateFromConnectionProfile([Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()); $tetheringManager.StartTetheringAsync();"

echo.
echo Der Hotspot wurde erfolgreich gestartet!
echo Name (SSID) und Passwort entsprechen deinen Windows-Einstellungen.
echo.
echo Dieses Fenster schließt sich in 5 Sekunden...
timeout /t 5