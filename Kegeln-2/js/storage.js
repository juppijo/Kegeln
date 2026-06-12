// --- SPEICHER-LOGIK (LOCALSTORAGE & JSON) ---

function saveCurrentGameFields() {
    if (players.length === 0) return;
    if (!activeGamesData[currentGame]) activeGamesData[currentGame] = {};

    players.forEach(p => {
        const row = document.getElementById(`row-${p}`);
        if (!row) return;

        if (currentGame === "hausnummer") {
            activeGamesData.hausnummer = activeGamesData.hausnummer || {};
            players.forEach(p => {
                const row = document.getElementById(`row-${p}`);
                if (row) {
                    activeGamesData.hausnummer[p] = {
                        g1: row.querySelector(".hn-g1").value,
                        g2: row.querySelector(".hn-g2").value,
                        g3: row.querySelector(".hn-g3").value,
                        k1: row.querySelector(".hn-k1").value,
                        k2: row.querySelector(".hn-k2").value,
                        k3: row.querySelector(".hn-k3").value
                    };
                }
            });

        } else if (currentGame === "siebzehn-vier") {
            activeGamesData["siebzehn-vier"][p] = {
                w1: row.querySelector(".sv-w1").value,
                w2: row.querySelector(".sv-w2").value,
                w3: row.querySelector(".sv-w3").value,
                w4: row.querySelector(".sv-w4").value,
                w5: row.querySelector(".sv-w5").value,
                w6: row.querySelector(".sv-w6").value,
                w7: row.querySelector(".sv-w7").value,
                w8: row.querySelector(".sv-w8").value,
                w9: row.querySelector(".sv-w9").value,
                card: row.querySelector(".sv-card").value
            };

        } else if (currentGame === "aergere-dich-nicht") {
            
            if (typeof saveMenschAergereDichNichtFields === "function") {
                saveMenschAergereDichNichtFields();
            }

        } else if (currentGame === "rennen") {
            activeGamesData.rennen = activeGamesData.rennen || {};
            
            // 1. Echte Spieler sichern
            players.forEach(p => {
                const row = document.getElementById(`row-${p}`);
                if (row && activeGamesData.rennen[p]) {
                    // Wir behalten das Team aus dem Objekt bei, Werte werden aktualisiert
                    activeGamesData.rennen[p].t1 = row.querySelector(".ren-t1").value;
                    activeGamesData.rennen[p].t2 = row.querySelector(".ren-t2").value;
                    activeGamesData.rennen[p].t3 = row.querySelector(".ren-t3").value;
                    activeGamesData.rennen[p].t4 = row.querySelector(".ren-t4").value;
                    activeGamesData.rennen[p].t5 = row.querySelector(".ren-t5").value;
                    activeGamesData.rennen[p].t6 = row.querySelector(".ren-t6").value;
                }
            });

            // 2. Gast-Spieler sichern (falls auf dem Bildschirm vorhanden)
            const gastRow = document.getElementById("row-rennen-Gast");
            if (gastRow && activeGamesData.rennen["Gast"]) {
                activeGamesData.rennen["Gast"].t1 = gastRow.querySelector(".ren-g-t1").value;
                activeGamesData.rennen["Gast"].t2 = gastRow.querySelector(".ren-g-t2").value;
                activeGamesData.rennen["Gast"].t3 = gastRow.querySelector(".ren-g-t3").value;
                activeGamesData.rennen["Gast"].t4 = gastRow.querySelector(".ren-g-t4").value;
                activeGamesData.rennen["Gast"].t5 = gastRow.querySelector(".ren-g-t5").value;
                activeGamesData.rennen["Gast"].t6 = gastRow.querySelector(".ren-g-t6").value;
            }
        } else if (currentGame === "idiot") {
            activeGamesData.idiot[p] = {
                l: row.querySelector(".id-l").value,
                r: row.querySelector(".id-r").value,
                re: row.querySelector(".id-re").value
            };
        } else if (currentGame === "fuchsjagd") {
            activeGamesData.fuchsjagd = activeGamesData.fuchsjagd || {};
            
            const rowFuchs = document.getElementById("row-fuchs");
            const rowJaeger = document.getElementById("row-jaeger");

            if (rowFuchs) {
                activeGamesData.fuchsjagd["Fuchs"] = {
                    vl: rowFuchs.querySelector(".fuchs-vl").value,
                    w1: rowFuchs.querySelector(".fuchs-w1").value,
                    w2: rowFuchs.querySelector(".fuchs-w2").value,
                    w3: rowFuchs.querySelector(".fuchs-w3").value,
                    w4: rowFuchs.querySelector(".fuchs-w4").value,
                    w5: rowFuchs.querySelector(".fuchs-w5").value,
                    w6: rowFuchs.querySelector(".fuchs-w6").value,
                    w7: rowFuchs.querySelector(".fuchs-w7").value,
                    w8: rowFuchs.querySelector(".fuchs-w8").value
                };
            }
            if (rowJaeger) {
                activeGamesData.fuchsjagd["Jaeger"] = {
                    vl: 0,
                    w1: rowJaeger.querySelector(".fuchs-w1").value,
                    w2: rowJaeger.querySelector(".fuchs-w2").value,
                    w3: rowJaeger.querySelector(".fuchs-w3").value,
                    w4: rowJaeger.querySelector(".fuchs-w4").value,
                    w5: rowJaeger.querySelector(".fuchs-w5").value,
                    w6: rowJaeger.querySelector(".fuchs-w6").value,
                    w7: rowJaeger.querySelector(".fuchs-w7").value,
                    w8: rowJaeger.querySelector(".fuchs-w8").value
                };
            }
        } else if (currentGame === "tannenbaum") {
            // Falls das Tannenbaum-Objekt noch gar nicht existiert, erstellen wir es kurz
            activeGamesData["tannenbaum"] = activeGamesData["tannenbaum"] || { team1: [], team2: [], wuerfe: {}, historie: {} };
            
            // WICHTIG: Die aktuellen Gruppen-Arrays werden direkt mitgesichert!
            // Da wir die Arrays bereits live in changeTannenbaumPlayerTeam() verändern, 
            // stellen wir hier sicher, dass sie im Hauptobjekt erhalten bleiben.
            localStorage.setItem("activeGamesData", JSON.stringify(activeGamesData));
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
    ensureDefaultGamesAvailable();
    
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
                ensureDefaultGamesAvailable();
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
