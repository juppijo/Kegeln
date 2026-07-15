@echo off
:: 1. Erhöht die Rechte automatisch auf Administrator (wird für den Hotspot gebraucht) 
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
title Kegel-Server & Hotspot Manager
cls
echo ===================================================
echo       Windows Hotspot & Kegel-Server starten       
echo ===================================================
echo.
:: 2. Hotspot über PowerShell im Hintergrund aktivieren
echo Aktiviere Windows Hotspot...
powershell -Command "$tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime]::CreateFromConnectionProfile([Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()); $tetheringManager.StartTetheringAsync();"
echo Hotspot-Befehl gesendet!
echo Name (SSID) und Passwort entsprechen deinen Windows-Einstellungen. 
echo.

:: 3. Wechsel in das Kegel-Verzeichnis und Start des Node.js Servers 
echo ===================================================
echo Starte den Kegel-Server fuer die Smartphones...
echo ===================================================
echo.

:: Wechselt auf das richtige Laufwerk und in deinen Kegel-Ordner
cd /d "C:\Users\juppi\Documents\KEGEL_APPS\Kegeln-2b"

:: Überprüfen, ob nodemon installiert ist, ansonsten node nutzen
where nodemon >nul 2>nul
if %errorlevel%==0 (
    echo Starte mit Nodemon...
    nodemon server.js
) else (
    echo Nodemon nicht gefunden. Starte mit Standard-Node...
    node server.js
)

:: Falls der Server unerwartet abstürzt, bleibt das Fenster offen, damit du den Fehler siehst!
echo.
echo !!! Server wurde gestoppt. Bitte überprüfe die obige Fehlermeldung. !!!
pause