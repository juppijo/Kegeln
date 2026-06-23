const express = require('express');
const http = require('http');
const path = require('path');

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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Robuster Kegel-Server (3-Sekunden-Takt) läuft auf IP: http://192.168.129.26:3000/ Port ${PORT}!`);
});