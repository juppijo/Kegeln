// --- DATEN-STRUKTUREN ---
let players = ["Michael", "Hilde", "Peter", "Brigitte", "Elke", "Gerhard", "Helga", "Birgit", "Jo", "Svenja", "Marius"];
let currentGame = "kegelbuch";

let gameOrder = [
    { key: "kegelbuch", title: "📊 Kegelbuch / Kasse" },
    { key: "hausnummer", title: "🏠 Große/Kleine Hausnummer" },
    { key: "siebzehn-vier", title: "🃏 17 und 4" },
    { key: "rennen", title: "🏎️ 6 Tage Rennen" },
    { key: "idiot", title: "🤪 Idiotenkegeln" }
];

const gameRules = {
    kegelbuch: "Abrechnung des Abends: Trage Startgeld, Pudel (0) und Stinas ein. Berechnet automatisch das zu zahlende Geld basierend auf den Strafen.",
    hausnummer: "3 Würfe. Bei 'Groß' wird eine möglichst hohe dreistellige Zahl gebildet, bei 'Klein' eine möglichst niedrige.",
    "siebzehn-vier": "Kegel so oft du willst, um an die 21 heranzukommen. Wer drüber wirft (überkauft), kriegt 0 Punkte.",
    rennen: "6 Runden Ausdauerrennen. Runde 2 zählt doppelt (x2), Runde 3 dreifach (x3) bis Runde 6 (x6). Höchste Summe gewinnt.",
    idiot: "Spassturnier: Wurf 1 mit LINKS, Wurf 2 RÜCKWÄRTS durch die Beine, Wurf 3 mit RECHTS. Gesamtsumme zählt."
};

// --- INITIALISIERUNG ---
document.addEventListener("DOMContentLoaded", () => {
    loadPlayersFromStorage(false);
    renderPlayerBadges();
    renderGameSelector();
    switchGame(currentGame);

    // Event-Listener
    document.getElementById("add-player-btn").addEventListener("click", addPlayer);
    document.getElementById("new-player-name").addEventListener("keypress", (e) => { if(e.key === 'Enter') addPlayer(); });
    document.getElementById("save-players-btn").addEventListener("click", () => savePlayersToStorage(true));
    document.getElementById("load-players-btn").addEventListener("click", () => loadPlayersFromStorage(true));
    document.getElementById("clear-players-btn").addEventListener("click", clearAllPlayers);
});

// --- COLLAPSIBLE / EIN- UND AUSKLAPP-FUNKTION ---
function toggleCard(contentId, headerElement) {
    const content = document.getElementById(contentId);
    const icon = headerElement.querySelector(".toggle-icon");
    
    if (content.classList.contains("collapsed")) {
        content.classList.remove("collapsed");
        icon.innerText = "🔽";
        icon.style.transform = "rotate(0deg)";
    } else {
        content.classList.add("collapsed");
        icon.innerText = "🔼";
    }
}

// --- THEME STEUERUNG ---
function changeTheme(themeName) {
    document.body.className = themeName;
}

// --- FULLSCREEN INTERFACE MODUS ---
function toggleFullscreen() {
    const btn = document.getElementById("fullscreen-btn");
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Fehler beim Wechsel in den Vollbildmodus: ${err.message}`);
        });
        btn.innerText = "📺 Vollbildmodus beenden";
        btn.classList.replace("btn-info", "btn-accent");
    } else {
        document.exitFullscreen();
        btn.innerText = "📺 Vollbildmodus einschalten";
        btn.classList.replace("btn-accent", "btn-info");
    }
}

// --- SPIELER SORTIERUNG & VERWALTUNG ---
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
}

function addPlayer() {
    const input = document.getElementById("new-player-name");
    const name = input.value.trim();
    if (!name) return;
    if (players.length >= 20) return alert("Maximal 20 Spieler!");
    if (players.includes(name)) return alert("Name existiert bereits!");
    players.push(name);
    input.value = "";
    renderPlayerBadges();
    updateCurrentGameTable();
}

function removePlayer(index) {
    players.splice(index, 1);
    renderPlayerBadges();
    updateCurrentGameTable();
}

function savePlayersToStorage(notify) {
    localStorage.setItem("kegel_players_pro", JSON.stringify(players));
    if(notify) alert("Spielerliste erfolgreich gesichert!");
}

function loadPlayersFromStorage(notify) {
    const local = localStorage.getItem("kegel_players_pro");
    if (local) {
        players = JSON.parse(local);
        renderPlayerBadges();
        if(notify) alert("Spielerdaten erfolgreich geladen!");
    } else if (notify) {
        alert("Keine gespeicherten Daten gefunden.");
    }
}

function clearAllPlayers() {
    if (confirm("Wirklich alle Spieler löschen?")) {
        players = [];
        renderPlayerBadges();
        updateCurrentGameTable();
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
    
    thRow.innerHTML = "";
    tbody.innerHTML = "";

    if (players.length === 0) {
        tbody.innerHTML = "<tr><td colspan='10'>Keine aktiven Spieler vorhanden.</td></tr>";
        return;
    }

    if (currentGame === "kegelbuch") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>Startgeld €</th><th>Pudel</th><th>Stinas</th><th>Summe</th>";
        players.forEach(p => {
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td>${p}</td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="val-startgeld" value="5" step="0.5"></td>
                    <td><input type="number" class="val-pudel" value="0"></td>
                    <td><input type="number" class="val-stinas" value="0"></td>
                    <td class="val-total" style="font-weight:bold;">5.00 €</td>
                </tr>`;
        });
    } 
    else if (currentGame === "hausnummer") {
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

// --- LIVE-AUSWERTUNG ---
function calculateGame() {
    let results = [];

    players.forEach(p => {
        const row = document.getElementById(`row-${p}`);
        if(row) row.className = "";
    });

    if (currentGame === "kegelbuch") {
        players.forEach(p => {
            const row = document.getElementById(`row-${p}`);
            const startgeld = parseFloat(row.querySelector(".val-startgeld").value) || 0;
            const pudel = parseInt(row.querySelector(".val-pudel").value) || 0;
            const stinas = parseInt(row.querySelector(".val-stinas").value) || 0;
            
            const gesamt = startgeld + (pudel * 0.10) + (stinas * 0.20);
            row.querySelector(".val-total").innerText = gesamt.toFixed(2) + " €";
            results.push({ name: p, score: gesamt, element: row });
        });
        results.sort((a, b) => a.score - b.score);
    }
    else if (currentGame === "hausnummer") {
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

    // PLATZIERUNGSANZEIGE
    results.forEach((item, index) => {
        const rank = index + 1;
        const rankCol = item.element.querySelector(".rank-col");
        if(!rankCol) return;
        
        if (rank === 1) {
            rankCol.innerHTML = `<span class="rank-badge rank-1">🥇 1</span>`;
            item.element.classList.add("winner-row");
        } else if (rank === 2) {
            rankCol.innerHTML = `<span class="rank-badge rank-2">🥈 2</span>`;
        } else if (rank === 3) {
            rankCol.innerHTML = `<span class="rank-badge rank-3">🥉 3</span>`;
        } else {
            rankCol.innerHTML = `<span class="rank-badge">${rank}</span>`;
        }

        if (rank === results.length && results.length > 1) {
            item.element.classList.add("loser-row");
        }
    });
}

function resetCurrentGame() {
    if (confirm("Werte für dieses Spiel zurücksetzen?")) {
        updateCurrentGameTable();
    }
}