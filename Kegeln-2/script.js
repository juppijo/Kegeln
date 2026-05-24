// --- DATEN-STRUKTUREN ---
let players = ["Michael", "Hilde", "Peter", "Brigitte", "Elke", "Gerhard", "Helga", "Birgit", "Jo", "Svenja", "Marius"];
let currentGame = "hausnummer"; // Startet jetzt standardmäßig mit einem Spiel, da Kegelbuch fest unten steht

let gameOrder = [
    { key: "hausnummer", title: "🏠 Große/Kleine Hausnummer" },
    { key: "siebzehn-vier", title: "🃏 17 und 4" },
    { key: "rennen", title: "🏎️ 6 Tage Rennen" },
    { key: "idiot", title: "🤪 Idiotenkegeln" }
];

// Punktespeicher für den Gesamt-Spielstand
let grandTotalScores = {};

const gameRules = {
    hausnummer: "3 Würfe. Bei 'Groß' wird eine möglichst hohe dreistellige Zahl gebildet, bei 'Klein' eine möglichst niedrige.",
    "siebzehn-vier": "Kegel so oft du willst, um an die 21 heranzukommen. Wer drüber wirft (überkauft), kriegt 0 Punkte.",
    rennen: "6 Runden Ausdauerrennen. Runde 2 zählt doppelt (x2), Runde 3 dreifach (x3) bis Runde 6 (x6). Höchste Summe gewinnt.",
    idiot: "Spassturnier: Wurf 1 mit LINKS, Wurf 2 RÜCKWÄRTS durch die Beine, Wurf 3 mit RECHTS. Gesamtsumme zählt."
};

// --- INITIALISIERUNG ---
document.addEventListener("DOMContentLoaded", () => {
    loadPlayersFromStorage(false);
    initGrandTotalScores();
    renderPlayerBadges();
    renderGameSelector();
    switchGame(currentGame);
    updateKegelbuchTable();
    updateGrandTotalTable();

    // Event-Listener
    document.getElementById("add-player-btn").addEventListener("click", addPlayer);
    document.getElementById("new-player-name").addEventListener("keypress", (e) => { if(e.key === 'Enter') addPlayer(); });
    document.getElementById("save-players-btn").addEventListener("click", () => savePlayersToStorage(true));
    document.getElementById("load-players-btn").addEventListener("click", () => loadPlayersFromStorage(true));
    document.getElementById("clear-players-btn").addEventListener("click", clearAllPlayers);
});

function initGrandTotalScores() {
    players.forEach(p => {
        if (!grandTotalScores[p]) grandTotalScores[p] = 0;
    });
}

// --- COLLAPSIBLE / EIN- UND AUSKLAPP-FUNKTION ---
function toggleCard(contentId, headerElement) {
    const content = document.getElementById(contentId);
    const icon = headerElement.querySelector(".toggle-icon");
    
    if (content.classList.contains("collapsed")) {
        content.classList.remove("collapsed");
        icon.innerText = "🔽";
    } else {
        content.classList.add("collapsed");
        icon.innerText = "🔼";
    }
}

// --- FILE JSON EXPORT & IMPORT (SETUP) ---
function exportToJSON() {
    const backupData = {
        exportDate: new Date().toISOString(),
        players: players,
        gameOrder: gameOrder,
        savedCurrentGame: currentGame
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateObj = new Date();
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    downloadAnchor.setAttribute("download", `Kegelclub_Setup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.players && Array.isArray(importedData.players)) {
                players = importedData.players;
                if (importedData.gameOrder && Array.isArray(importedData.gameOrder)) gameOrder = importedData.gameOrder;
                if (importedData.savedCurrentGame) currentGame = importedData.savedCurrentGame;
                initGrandTotalScores();
                renderPlayerBadges();
                renderGameSelector();
                switchGame(currentGame);
                updateKegelbuchTable();
                updateGrandTotalTable();
                alert("🎉 Setup erfolgreich geladen!");
            } else {
                alert("Fehler: Ungültiges Setup-Format.");
            }
        } catch (err) { alert("Fehler: " + err.message); }
    };
    reader.readAsText(file);
    event.target.value = ""; 
}

// --- EXPORT & IMPORT FÜR GESAMTSTAND (JSON) ---
function exportGrandTotalJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(grandTotalScores, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateObj = new Date();
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    downloadAnchor.setAttribute("download", `Kegelclub_Gesamtstand_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importGrandTotalJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedScores = JSON.parse(e.target.result);
            grandTotalScores = importedScores;
            updateGrandTotalTable();
            alert("🏆 Gesamt-Spielstand erfolgreich eingelesen!");
        } catch (err) { alert("Fehler: " + err.message); }
    };
    reader.readAsText(file);
    event.target.value = "";
}

function resetGrandTotal() {
    if (confirm("Möchtest du die Punkte des Gesamtstands wirklich für alle zurücksetzen?")) {
        players.forEach(p => grandTotalScores[p] = 0);
        updateGrandTotalTable();
    }
}

// --- THEME & FULLSCREEN ---
function changeTheme(themeName) { document.body.className = themeName; }
function toggleFullscreen() {
    const btn = document.getElementById("fullscreen-btn");
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => alert(`Fehler: ${err.message}`));
        btn.innerText = "📺 Vollbildmodus beenden";
        btn.classList.replace("btn-info", "btn-accent");
    } else {
        document.exitFullscreen();
        btn.innerText = "📺 Vollbildmodus einschalten";
        btn.classList.replace("btn-accent", "btn-info");
    }
}

// --- SPIELER VERWALTUNG ---
function renderPlayerBadges() {
    const container = document.getElementById("player-badges");
    container.innerHTML = "";
    players.forEach((player, index) => {
        const badge = document.createElement("div");
        badge.className = "badge";
        badge.innerHTML = `
            <div class="badge-name-box">📌 ${index + 1}. ${player}</div>
            <div class="order-btn-group">
                <button class="btn-order" onclick="movePlayer(${index}, -1)">🔼</button>
                <button class="btn-order" onclick="movePlayer(${index}, 1)">🔽</button>
                <button class="btn-order" style="color:#ef4444;" onclick="removePlayer(${index})">❌</button>
            </div>
        `;
        container.appendChild(badge);
    });
}

function movePlayer(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= players.length) return;
    const temp = players[index];
    players[index] = players[targetIndex];
    players[targetIndex] = temp;
    renderPlayerBadges();
    updateCurrentGameTable();
    updateKegelbuchTable();
    updateGrandTotalTable();
}

function addPlayer() {
    const input = document.getElementById("new-player-name");
    const name = input.value.trim();
    if (!name) return;
    if (players.length >= 20) return alert("Maximal 20 Spieler!");
    if (players.includes(name)) return alert("Name existiert bereits!");
    players.push(name);
    grandTotalScores[name] = 0;
    input.value = "";
    renderPlayerBadges();
    updateCurrentGameTable();
    updateKegelbuchTable();
    updateGrandTotalTable();
}

function removePlayer(index) {
    const name = players[index];
    players.splice(index, 1);
    delete grandTotalScores[name];
    renderPlayerBadges();
    updateCurrentGameTable();
    updateKegelbuchTable();
    updateGrandTotalTable();
}

function savePlayersToStorage(notify) {
    localStorage.setItem("kegel_players_pro", JSON.stringify(players));
    localStorage.setItem("kegel_games_pro", JSON.stringify(gameOrder));
    localStorage.setItem("kegel_grand_total", JSON.stringify(grandTotalScores));
    if(notify) alert("Daten im Browser gesichert!");
}

function loadPlayersFromStorage(notify) {
    const localPlayers = localStorage.getItem("kegel_players_pro");
    const localGames = localStorage.getItem("kegel_games_pro");
    const localTotal = localStorage.getItem("kegel_grand_total");
    if (localPlayers) {
        players = JSON.parse(localPlayers);
        if (localGames) gameOrder = JSON.parse(localGames);
        if (localTotal) grandTotalScores = JSON.parse(localTotal);
        initGrandTotalScores();
        renderPlayerBadges();
        renderGameSelector();
        if(notify) alert("Daten aus dem Browser geladen!");
    }
}

function clearAllPlayers() {
    if (confirm("Wirklich alle Spieler löschen?")) {
        players = [];
        grandTotalScores = {};
        renderPlayerBadges();
        updateCurrentGameTable();
        updateKegelbuchTable();
        updateGrandTotalTable();
    }
}

// --- SPIEL-REIHENFOLGE STEUERUNG ---
function renderGameSelector() {
    const container = document.getElementById("game-selector-container");
    container.innerHTML = "";
    gameOrder.forEach((game, index) => {
        const item = document.createElement("div");
        item.className = `game-nav-item ${game.key === currentGame ? 'active' : ''}`;
        item.innerHTML = `
            <div class="order-btn-group" style="padding-left:10px;">
                <button class="btn-order" onclick="moveGame(${index}, -1); event.stopPropagation();">◀️</button>
                <button class="btn-order" onclick="moveGame(${index}, 1); event.stopPropagation();">▶️</button>
            </div>
            <button class="game-nav-btn" onclick="switchGame('${game.key}')">${game.title}</button>
        `;
        container.appendChild(item);
    });
}

function moveGame(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= gameOrder.length) return;
    const temp = gameOrder[index];
    gameOrder[index] = gameOrder[targetIndex];
    gameOrder[targetIndex] = temp;
    renderGameSelector();
}

function switchGame(gameKey) {
    currentGame = gameKey;
    renderGameSelector();
    const matchedGame = gameOrder.find(g => g.key === gameKey);
    document.getElementById("current-game-title").innerText = matchedGame ? matchedGame.title : "Spiel";
    document.getElementById("rules-box").classList.add("hidden");
    updateCurrentGameTable();
}

function showRules() {
    const box = document.getElementById("rules-box");
    document.getElementById("rules-title").innerText = `Regeln: ${gameOrder.find(g => g.key === currentGame).title}`;
    document.getElementById("rules-text").innerText = gameRules[currentGame];
    box.classList.toggle("hidden");
}

// --- DYNAMISCHER TABELLEN-AUFBAU ---
function updateCurrentGameTable() {
    const thRow = document.getElementById("th-row");
    const tbody = document.getElementById("game-tbody");
    thRow.innerHTML = ""; tbody.innerHTML = "";

    if (players.length === 0) {
        tbody.innerHTML = "<tr><td colspan='10'>Keine aktiven Spieler vorhanden.</td></tr>";
        return;
    }

    if (currentGame === "hausnummer") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>W1</th><th>W2</th><th>W3</th><th>Zahl</th><th>Modus</th>";
        players.forEach(p => {
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td>${p}</td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="val-w1" min="0" max="9" value="0"></td>
                    <td><input type="number" class="val-w2" min="0" max="9" value="0"></td>
                    <td><input type="number" class="val-w3" min="0" max="9" value="0"></td>
                    <td class="val-result" style="font-weight:bold;">0</td>
                    <td><select class="val-mode"><option value="groß">Groß ↑</option><option value="klein">Klein ↓</option></select></td>
                </tr>`;
        });
    }
    else if (currentGame === "siebzehn-vier") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>Punkte</th><th>Überkauft?</th>";
        players.forEach(p => {
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td>${p}</td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="val-points" min="0" value="0"></td>
                    <td><input type="checkbox" class="val-over"> Ja</td>
                </tr>`;
        });
    }
    else if (currentGame === "rennen") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>T1</th><th>T2(x2)</th><th>T3(x3)</th><th>T4(x4)</th><th>T5(x5)</th><th>T6(x6)</th><th>Gesamt</th>";
        players.forEach(p => {
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td>${p}</td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="r-t1" value="0"></td>
                    <td><input type="number" class="r-t2" value="0"></td>
                    <td><input type="number" class="r-t3" value="0"></td>
                    <td><input type="number" class="r-t4" value="0"></td>
                    <td><input type="number" class="r-t5" value="0"></td>
                    <td><input type="number" class="r-t6" value="0"></td>
                    <td class="val-total-rennen" style="font-weight:bold;">0</td>
                </tr>`;
        });
    }
    else if (currentGame === "idiot") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>Links</th><th>Rückw.</th><th>Rechts</th><th>Gesamt</th>";
        players.forEach(p => {
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td>${p}</td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="id-l" value="0" min="0" max="9"></td>
                    <td><input type="number" class="id-r" value="0" min="0" max="9"></td>
                    <td><input type="number" class="id-re" value="0" min="0" max="9"></td>
                    <td class="id-gesamt" style="font-weight:bold;">0</td>
                </tr>`;
        });
    }
}

// --- STATISCHE FIXIERTE BEREICHE UNTEN ---
function updateKegelbuchTable() {
    const tbody = document.getElementById("kegelbuch-tbody");
    tbody.innerHTML = "";
    if (players.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6'>Keine Spieler.</td></tr>";
        return;
    }
    players.forEach(p => {
        tbody.innerHTML += `
            <tr id="kb-row-${p}">
                <td>${p}</td>
                <td class="kb-rank-col">-</td>
                <td><input type="number" class="kb-startgeld" value="5" step="0.5"></td>
                <td><input type="number" class="kb-pudel" value="0"></td>
                <td><input type="number" class="kb-stinas" value="0"></td>
                <td class="kb-total" style="font-weight:bold;">5.00 €</td>
            </tr>`;
    });
}

function updateGrandTotalTable() {
    const tbody = document.getElementById("grand-total-tbody");
    tbody.innerHTML = "";
    
    let sortedList = players.map(p => ({ name: p, points: grandTotalScores[p] || 0 }));
    sortedList.sort((a, b) => b.points - a.points);

    if (sortedList.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3'>Keine Spieler vorhanden.</td></tr>";
        return;
    }

    sortedList.forEach((item, index) => {
        const rank = index + 1;
        let rankBadge = `<span class="rank-badge">${rank}</span>`;
        let rowClass = "";
        
        if (rank === 1) { rankBadge = `<span class="rank-badge rank-1">🥇 1</span>`; rowClass="winner-row"; }
        else if (rank === 2) rankBadge = `<span class="rank-badge rank-2">🥈 2</span>`;
        else if (rank === 3) rankBadge = `<span class="rank-badge rank-3">🥉 3</span>`;
        if (rank === sortedList.length && sortedList.length > 1) rowClass="loser-row";

        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td><strong>${item.name}</strong></td>
                <td>${rankBadge}</td>
                <td style="font-weight:bold; font-size:1.1rem; color:var(--accent);">${item.points} Pkt</td>
            </tr>
        `;
    });
}

// --- LIVE-AUSWERTUNG AKTUELLES SPIEL ---
function calculateGame() {
    let results = [];
    players.forEach(p => { const row = document.getElementById(`row-${p}`); if(row) row.className = ""; });

    if (currentGame === "hausnummer") {
        players.forEach(p => {
            const row = document.getElementById(`row-${p}`);
            const w1 = row.querySelector(".val-w1").value;
            const w2 = row.querySelector(".val-w2").value;
            const w3 = row.querySelector(".val-w3").value;
            const mode = row.querySelector(".val-mode").value;
            let num = parseInt("" + w1 + w2 + w3) || 0;
            row.querySelector(".val-result").innerText = num;
            let scoreEffect = mode === "groß" ? num : (999 - num);
            results.push({ name: p, score: scoreEffect, element: row });
        });
        results.sort((a, b) => b.score - a.score);
    }
    else if (currentGame === "siebzehn-vier") {
        players.forEach(p => {
            const row = document.getElementById(`row-${p}`);
            const points = parseInt(row.querySelector(".val-points").value) || 0;
            const over = row.querySelector(".val-over").checked;
            let finalScore = over || points > 21 ? -1 : points;
            results.push({ name: p, score: finalScore, element: row });
        });
        results.sort((a, b) => b.score - a.score);
    }
    else if (currentGame === "rennen") {
        players.forEach(p => {
            const row = document.getElementById(`row-${p}`);
            const t1 = parseInt(row.querySelector(".r-t1").value) || 0;
            const t2 = (parseInt(row.querySelector(".r-t2").value) || 0) * 2;
            const t3 = (parseInt(row.querySelector(".r-t3").value) || 0) * 3;
            const t4 = (parseInt(row.querySelector(".r-t4").value) || 0) * 4;
            const t5 = (parseInt(row.querySelector(".r-t5").value) || 0) * 5;
            const t6 = (parseInt(row.querySelector(".r-t6").value) || 0) * 6;
            const gesamt = t1 + t2 + t3 + t4 + t5 + t6;
            row.querySelector(".val-total-rennen").innerText = gesamt;
            results.push({ name: p, score: gesamt, element: row });
        });
        results.sort((a, b) => b.score - a.score);
    }
    else if (currentGame === "idiot") {
        players.forEach(p => {
            const row = document.getElementById(`row-${p}`);
            const l = parseInt(row.querySelector(".id-l").value) || 0;
            const r = parseInt(row.querySelector(".id-r").value) || 0;
            const re = parseInt(row.querySelector(".id-re").value) || 0;
            const gesamt = l + r + re;
            row.querySelector(".id-gesamt").innerText = gesamt;
            results.push({ name: p, score: gesamt, element: row });
        });
        results.sort((a, b) => b.score - a.score);
    }

    // PLATZIERUNGSANZEIGE & TURNIERPUNKTE VERTEILEN
    results.forEach((item, index) => {
        const rank = index + 1;
        const rankCol = item.element.querySelector(".rank-col");
        if(!rankCol) return;
        
        if (rank === 1) {
            rankCol.innerHTML = `<span class="rank-badge rank-1">🥇 1</span>`;
            item.element.classList.add("winner-row");
            grandTotalScores[item.name] += 3; // +3 Punkte für den Ersten
        } else if (rank === 2) {
            rankCol.innerHTML = `<span class="rank-badge rank-2">🥈 2</span>`;
            grandTotalScores[item.name] += 2; // +2 Punkte für Platz 2
        } else if (rank === 3) {
            rankCol.innerHTML = `<span class="rank-badge rank-3">🥉 3</span>`;
            grandTotalScores[item.name] += 1; // +1 Punkt für Platz 3
        } else {
            rankCol.innerHTML = `<span class="rank-badge">${rank}</span>`;
        }

        // Letzter Platz erhält Punktabzug
        if (rank === results.length && results.length > 1) {
            item.element.classList.add("loser-row");
            grandTotalScores[item.name] -= 1; // -1 Punkt für den Letzten
        }
    });

    // Beide statischen Übersichten live mit-aktualisieren
    updateGrandTotalTable();
}

// --- KEGELBUCH / KASSE AUSWERTUNG ---
function calculateKegelbuch() {
    let kbResults = [];
    players.forEach(p => {
        const row = document.getElementById(`kb-row-${p}`);
        const startgeld = parseFloat(row.querySelector(".kb-startgeld").value) || 0;
        const pudel = parseInt(row.querySelector(".kb-pudel").value) || 0;
        const stinas = parseInt(row.querySelector(".kb-stinas").value) || 0;
        
        const gesamt = startgeld + (pudel * 0.10) + (stinas * 0.20);
        row.querySelector(".kb-total").innerText = gesamt.toFixed(2) + " €";
        kbResults.push({ name: p, score: gesamt, element: row });
    });

    // Rangliste in der Kasse anzeigen (wer hat am meisten verpudelt/bezahlt)
    kbResults.sort((a, b) => b.score - a.score);
    kbResults.forEach((item, index) => {
        const rankCol = item.element.querySelector(".kb-rank-col");
        if(rankCol) rankCol.innerHTML = `<span class="rank-badge">${index + 1}</span>`;
    });
}

function resetCurrentGame() {
    if (confirm("Werte für dieses Spiel zurücksetzen?")) {
        updateCurrentGameTable();
    }
}