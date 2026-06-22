// --- DESIGN & OBERFLÄCHEN-STEUERUNG (UI) ---

function switchTab(tabId, buttonElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.menu-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    buttonElement.classList.add('active');
}

function changeTheme(themeName) { document.body.className = themeName; }

// ... UND DURCH DIESEN ERSETZEN:
function toggleFullscreen() {
    const btn = document.getElementById("fullscreen-btn");
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
            .then(() => {
                document.body.classList.add("fullscreen-active");
            })
            .catch(err => alert(`Fehler: ${err.message}`));
        
        if (btn) {
            btn.innerText = "📺 Vollbildmodus beenden";
            btn.classList.replace("btn-info", "btn-accent");
        }
    } else {
        document.exitFullscreen();
        document.body.classList.remove("fullscreen-active");
        
        const header = document.getElementById("main-header");
        if (header) header.classList.remove("menu-forced-open");
        
        const toggleBtn = document.getElementById("toggle-menu-btn");
        if (toggleBtn) toggleBtn.innerText = "🔽 Menü einblenden";

        if (btn) {
            btn.innerText = "📺 Vollbildmodus einschalten";
            btn.classList.replace("btn-accent", "btn-info");
        }
    }
}

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
    document.getElementById("rules-title").innerText = `Regeln`;
    document.getElementById("rules-text").innerText = gameRules[currentGame];
    box.classList.toggle("hidden");
}

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
            </tr>`;
    });
}

function resetGrandTotal() {
    if (!confirm("⚠️ Möchtest du wirklich nur die gebuchten Gesamt-Punkte nullen? Die bereits eingetragenen Würfe bleiben stehen, aber alle Spiele springen zurück auf '⏳ Noch nicht gebucht'.")) {
        return;
    }

    // 1. Das Gesamtstand-Objekt für alle Spieler auf 0 zurücksetzen
    grandTotalScores = {};
    players.forEach(p => { grandTotalScores[p] = 0; });

    // 2. DAS WAR DER FEHLER: Das "isBooked"-Flag in ALLEN Spielen im RAM-Speicher löschen
    if (activeGamesData) {
        Object.keys(activeGamesData).forEach(gameKey => {
            if (activeGamesData[gameKey] && typeof activeGamesData[gameKey] === 'object') {
                // Setzt das Buchungs-Flag des Spiels zurück
                activeGamesData[gameKey].isBooked = false;
                activeGamesData[gameKey].booked = false;
                
                // Falls Unter-Sperren bei Spielern existieren, diese ebenfalls leeren
                Object.keys(activeGamesData[gameKey]).forEach(playerKey => {
                    if (activeGamesData[gameKey][playerKey] && typeof activeGamesData[gameKey][playerKey] === 'object') {
                        activeGamesData[gameKey][playerKey].isBooked = false;
                        activeGamesData[gameKey][playerKey].booked = false;
                    }
                });
            }
        });
    }

    // 3. Alle "booked-" Sperrmarker aus dem Browser-Speicher (localStorage) löschen
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("booked-") || key.includes("-booked"))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 4. Den genullten Zustand im Browser-Speicher sichern (Geworfenes bleibt erhalten!)
    saveCurrentGameFields(); // Sichert das bereinigte activeGamesData-Objekt

    // 5. Alle Tabellen-Ansichten im UI komplett neu aufbauen
    updateGrandTotalTable();
    updateKegelbuchTable();
    
    // Aktuelles Spiel neu laden -> Zwingt das Label, von "Bereits gebucht!" auf "Noch nicht gebucht" zu springen!
    switchGame(currentGame); 

    //alert("🔄 Gesamtstand erfolgreich genullt! Alle Spiele stehen jetzt wieder auf '⏳ Noch nicht gebucht', aber deine eingetragenen Zahlen sind noch da.");
}

// ==========================================
// ERWEITERUNG: ERGÄNZUNGEN FÜR DEN VOLLBILD-HEADER
// ==========================================

/* Fängt ab, wenn die Kegler den Vollbildmodus manuell über ESC oder 
   die Zurück-Geste am Smartphone beenden, damit die Klassen synchron bleiben */
document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById("fullscreen-btn");
    if (!document.fullscreenElement) {
        document.body.classList.remove("fullscreen-active");
        
        const header = document.getElementById("main-header");
        if (header) header.classList.remove("menu-forced-open");
        
        const toggleBtn = document.getElementById("toggle-menu-btn");
        if (toggleBtn) toggleBtn.innerText = "🔽 Menü einblenden";

        if (btn) {
            btn.innerText = "📺 Vollbildmodus einschalten";
            btn.classList.replace("btn-accent", "btn-info");
        }
    }
});

// Steuert den kleinen schwebenden Pfeil-Button, um das Menü im Vollbild kurz anzusehen
function toggleFullscreenMenu() {
    const header = document.getElementById("main-header");
    const btn = document.getElementById("toggle-menu-btn");
    if (!header || !btn) return;
    
    if (header.classList.contains("menu-forced-open")) {
        header.classList.remove("menu-forced-open");
        btn.innerText = "🔽 Menü einblenden";
    } else {
        header.classList.add("menu-forced-open");
        btn.innerText = "🔼 Menü ausblenden";
    }
}