const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os'); // Für die IP-Abfrage benötigt[cite: 2]
const { exec } = require('child_process'); // Ermöglicht das Ausführen von Linux-Befehlen

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// HIER BITTE DEINEN WLAN-GERÄTENAMEN EINTRAGEN (z.B. 'wlp3s0' oder 'wlan0')
const WIFI_INTERFACE = 'wlp4s0'; 

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
});

app.use(express.json()); // cite: 2
app.use(express.static(path.join(__dirname, 'Kegeln-2b')));

// --- NEU: API-Endpunkte für die Hotspot-Steuerung ---

// Hotspot einschalten
app.post('/api/hotspot/on', (req, res) => {
    const cmd = `sudo nmcli device wifi hotspot ssid Kegelklub_Gut_Holz password 12344321 ifname ${WIFI_INTERFACE}`;
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, error: stderr || error.message });
        }
        res.json({ success: true, message: 'Hotspot wurde gestartet!' });
    });
});

// Hotspot ausschalten
app.post('/api/hotspot/off', (req, res) => {
    const cmd = `sudo nmcli device disconnect ${WIFI_INTERFACE}`;
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, error: stderr || error.message });
        }
        res.json({ success: true, message: 'Hotspot wurde gestoppt!' });
    });
});

// --- Bestehende Kegel-API ---
let globalKegelData = { players: [], activeGamesData: {}, grandTotalScores: {} }; // cite: 2
app.get('/api/data', (req, res) => res.json(globalKegelData)); // cite: 2
app.post('/api/data', (req, res) => { // cite: 2
    const incomingData = req.body; // cite: 2
    if (incomingData.activeGamesData) globalKegelData.activeGamesData = incomingData.activeGamesData; // cite: 2
    if (incomingData.players && incomingData.players.length > 0) globalKegelData.players = incomingData.players; // cite: 2
    if (incomingData.grandTotalScores) globalKegelData.grandTotalScores = incomingData.grandTotalScores; // cite: 2
    res.json({ status: "success" }); // cite: 2
});

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces(); // cite: 2
    for (const interfaceName in interfaces) { // cite: 2
        for (const iface of interfaces[interfaceName]) { // cite: 2
            if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) return iface.address; // cite: 2
        }
    }
    return '127.0.0.1'; // cite: 2
}

server.listen(PORT, '0.0.0.0', () => {
    const currentIp = getLocalIpAddress();
    console.log(`=== 🎳 KEGEL APP SERVER ===`);
    console.log(`👉 Web-Interface: http://${currentIp}:${PORT}`);
    console.log(`👉 Hotspot-Steuerung: http://${currentIp}:${PORT}/starten.html`);
    console.log(`👉 Installationsanleitung: http://${currentIp}:${PORT}/Installationsanleitung_Kegel_Server.html`);
    console.log(`===========================`);
});