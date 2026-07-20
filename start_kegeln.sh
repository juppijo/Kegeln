#!/bin/bash

# ==============================================================================
# 🎳 Kegel-Server & Linux Hotspot Startskript
# ==============================================================================

# Definiere Textfarben für bessere Lesbarkeit
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}      🎳 Starte Kegel-Server & Linux Hotspot        ${NC}"
echo -e "${CYAN}====================================================${NC}"

# 1. Root-Rechte überprüfen (wichtig für die Hotspot-Steuerung)
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Hinweis: Für die Aktivierung des Hotspots werden Root-Rechte benötigt.${NC}"
  echo -e "${YELLOW}Bitte gib dein Passwort ein, falls danach gefragt wird.${NC}"
  echo ""
  exec sudo "$0" "$@"
  exit
fi

# 2. Linux Hotspot aktivieren
# Hinweis: "Hotspot" entspricht dem Namen deiner bestehenden NetworkManager-Verbindung.
# Falls dein Hotspot anders heißt, passe den Namen hier an.
echo -e "${YELLOW}[1/3] Aktiviere Linux Hotspot...${NC}"
nmcli connection up "Hotspot" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Hotspot wurde erfolgreich eingeschaltet!${NC}"
    echo -e "${CYAN}Aktuelle Hotspot-Zugangsdaten:${NC}"
    nmcli dev wifi show-password
else
    echo -e "${RED}❌ Fehler beim Starten des Hotspots.${NC}"
    echo -e "${YELLOW}Prüfe, ob eine Verbindung namens 'Hotspot' in nmcli existiert.${NC}"
fi

echo "----------------------------------------------------"

# 3. In das Server-Verzeichnis wechseln
echo -e "${YELLOW}[2/3] Wechsle in das Projektverzeichnis...${NC}"
TARGET_DIR="$HOME/Dokumente/Kegel-Server"

# Da das Skript mit 'sudo' läuft, müssen wir den echten Home-Pfad des Users ermitteln
if [ ! -d "$TARGET_DIR" ]; then
    # Fallback, falls $HOME durch sudo auf /root umgebogen wurde
    REAL_USER=${SUDO_USER:-$USER}
    TARGET_DIR="/home/$REAL_USER/Dokumente/Kegel-Server"
fi

if cd "$TARGET_DIR"; then
    echo -e "${GREEN}✔ Verzeichnis gewechselt: $(pwd)${NC}"
else
    echo -e "${RED}❌ Fehler: Verzeichnis $TARGET_DIR nicht gefunden!${NC}"
    exit 1
fi

echo "----------------------------------------------------"

# 4. Node.js Entwicklungsserver starten
echo -e "${YELLOW}[3/3] Starte npm run dev...${NC}"
echo -e "${CYAN}Server läuft im Vordergrund. Beenden mit STRG+C.${NC}"
echo ""

# Ausführen als der ursprüngliche User (nicht als Root), damit keine Rechteprobleme in node_modules entstehen
REAL_USER=${SUDO_USER:-$USER}
sudo -u "$REAL_USER" npm run dev