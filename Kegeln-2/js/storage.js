// --- SPEICHER-LOGIK (LOCALSTORAGE & JSON) ---

function saveCurrentGameFields() {
    if (players.length === 0) return;
    if (!activeGamesData[currentGame]) activeGamesData[currentGame] = {};

    players.forEach(p => {
        const row = document.getElementById(`row-${p}`);
        if (!row) return;

        if (currentGame === "hausnummer") {
            activeGamesData.hausnummer[p] = {
                g1: row.querySelector(".g-w1").value,
                g2: row.querySelector(".g-w2").value,
                g3: row.querySelector(".g-w3").value,
                k1: row.querySelector(".k-w1").value,
                k2: row.querySelector(".k-w2").value,
                k3: row.querySelector(".k-w3").value
            };

        } else if (currentGame === "siebzehn-vier") {
            activeGamesData["siebzehn-vier"][p] = {
                w1: row.querySelector(".sv-w1").value,
                w2: row.querySelector(".sv-w2").value,
                w3: row.querySelector(".sv-w3").value,
                w4: row.querySelector(".sv-w4").value,
                w5: row.querySelector(".sv-w5").value,
                over: row.querySelector(".val-over").checked
            };

        } else if (currentGame === "rennen") {
            activeGamesData.rennen[p] = {
                t1: row.querySelector(".r-t1").value,
                t2: row.querySelector(".r-t2").value,
                t3: row.querySelector(".r-t3").value,
                t4: row.querySelector(".r-t4").value,
                t5: row.querySelector(".r-t5").value,
                t6: row.querySelector(".r-t6").value
            };
        } else if (currentGame === "idiot") {
            activeGamesData.idiot[p] = {
                l: row.querySelector(".id-l").value,
                r: row.querySelector(".id-r").value,
                re: row.querySelector(".id-re").value
            };
        } else if (currentGame === "fuchsjagd") {
            activeGamesData.fuchsjagd[p] = {
                role: row.querySelector(".fuchs-role").value,
                vl: row.querySelector(".fuchs-vl").value,
                vr: row.querySelector(".fuchs-vr").value,
                w1: row.querySelector(".fuchs-w1").value,
                w2: row.querySelector(".fuchs-w2").value,
                w3: row.querySelector(".fuchs-w3").value
            };
        }

    });
    localStorage.setItem("kegel_active_games_data", JSON.stringify(activeGamesData));
}

function savePlayersToStorage(notify) {
    localStorage.setItem("kegel_players_pro", JSON.stringify(players));
    localStorage.setItem("kegel_games_pro", JSON.stringify(gameOrder));
    localStorage.setItem("kegel_grand_total", JSON.stringify(grandTotalScores));
    saveCurrentGameFields();
    if(notify) alert("Alle Daten & Spielstände im Browser gesichert!");
}

function loadPlayersFromStorage(notify) {
    const localPlayers = localStorage.getItem("kegel_players_pro");
    const localGames = localStorage.getItem("kegel_games_pro");
    const localTotal = localStorage.getItem("kegel_grand_total");
    const localGamesData = localStorage.getItem("kegel_active_games_data");
    
    if (localPlayers) players = JSON.parse(localPlayers);
    if (localGames) gameOrder = JSON.parse(localGames);
    if (localTotal) grandTotalScores = JSON.parse(localTotal);
    if (localGamesData) activeGamesData = JSON.parse(localGamesData);
    
    initGrandTotalScores();
    renderPlayerBadges();
    renderGameSelector();
    if(notify && localPlayers) alert("Daten aus dem Browser geladen!");
}

function clearAllBrowserData() {
    if (confirm("Möchtest du wirklich ALLE Spieler und ALLE gespeicherten Spielstände löschen?")) {
        localStorage.clear();
        alert("Alle Daten wurden gelöscht. Die Seite wird jetzt neu geladen.");
        window.location.reload();
    }
}

// JSON Im- & Exportfunktionen
function exportToJSON() {
    const backupData = { exportDate: new Date().toISOString(), players, gameOrder, savedCurrentGame: currentGame };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Kegelclub_Setup.json`);
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
            }
        } catch (err) { alert("Fehler: " + err.message); }
    };
    reader.readAsText(file);
    event.target.value = ""; 
}

function exportGrandTotalJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(grandTotalScores, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Kegelclub_Gesamtstand.json`);
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
            grandTotalScores = JSON.parse(e.target.result);
            updateGrandTotalTable();
            alert("🏆 Gesamt-Spielstand erfolgreich eingelesen!");
        } catch (err) { alert("Fehler: " + err.message); }
    };
    reader.readAsText(file);
    event.target.value = "";
}