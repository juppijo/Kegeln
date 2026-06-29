@echo off
:: Admin-Rechte abfragen
net session >nul 2>&1 || (powershell start -verb runas '%~f0' & exit /b)

powershell -Command "$tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime]::CreateFromConnectionProfile([Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()); $tetheringManager.StopTetheringAsync();"

echo Hotspot wurde deaktiviert.
echo Dieses Fenster schließt sich in 3 Sekunden...
timeout /t 3