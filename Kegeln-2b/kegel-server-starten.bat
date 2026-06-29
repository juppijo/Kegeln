@echo off
title Kegel-Server Start-Skript
echo ===================================================
echo Starte den Kegel-Server fuer die Smartphones...
echo ===================================================
echo.

:: 1. Wechselt auf das richtige Laufwerk (C:) und in euren Kegel-Ordner
cd /d C:\Users\juppi\Documents\KEGEL_APPS\Kegeln-2b

:: 2. Startet den Node.js Server mit automatischem Neustart (Nodemon)
nodemon server.js

:: Falls der Server unerwartet abstürzt, bleibt das Fenster offen, damit man Fehler sieht
echo.
echo !!!  Server wurde gestoppt.  !!!
pause