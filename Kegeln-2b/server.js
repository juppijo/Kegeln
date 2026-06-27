const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os'); // <-- WICHTIG: Das 'os'-Modul wird für die IP-Abfrage benötigt


const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Wichtig, damit der Server JSON-Daten von den Handys empfangen kann
app.use(express.json());
app.use(express.static(__dirname));

// Die zentralen Spieldaten auf dem PC-Server
let globalKegelData = {
    players: [],
    activeGamesData: {},
    grandTotalScores: {}
};

// 1. Route: Smartphones holen sich hier alle 3 Sekunden die aktuellen Daten ab
app.get('/api/data', (req, res) => {
    res.json(globalKegelData);
});

// 2. Route: Smartphones schicken ihre Änderungen hierhin
app.post('/api/data', (req, res) => {
    const incomingData = req.body;
    
    // Daten auf dem Server aktualisieren
    if (incomingData.activeGamesData) globalKegelData.activeGamesData = incomingData.activeGamesData;
    if (incomingData.players && incomingData.players.length > 0) globalKegelData.players = incomingData.players;
    if (incomingData.grandTotalScores) globalKegelData.grandTotalScores = incomingData.grandTotalScores;
    
    res.json({ status: "success" });
});

// Funktion, um die aktuelle lokale IP-Adresse des PCs herauszufinden
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            // Wir suchen nach einer IPv4-Adresse, die nicht "internal" (wie 127.0.0.1) ist
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback, falls keine IP gefunden wird
}

// Server starten
server.listen(PORT, '0.0.0.0', () => {
    const currentIp = getLocalIpAddress();
    console.log(`=== 🎳 KEGEL APP SERVER (3-Sekunden-Takt) ===`);
    console.log(`📡 Wlan: Kegelklub_Gut_Holz - PW: 1234:4321`);
    console.log(`📡 Server läuft im Netzwerk unter:`);
    console.log(`👉 http://${currentIp}:${PORT}`);
    console.log(`===========================`);
});