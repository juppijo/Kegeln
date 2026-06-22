// --- SPEICHER-LOGIK (LOCALSTORAGE, JSON & PC-SERVER INTERVAL) ---

let isUploading = false;
// Hilfsvariable, um zu prüfen, ob sich die Spielerliste geändert hat
let lastPlayersCount = 0; 

// 1. SERVER-FUNKTION: Daten aus dem gemeinsamen Server-Speicher abrufen
async function fetchDatenVomServer() {
    if (isUploading) return; 
    
    try {
        const response = await fetch('/api/data');
        if (!response.ok) return;
        const data = await response.json();
        
        // Nur aktualisieren, wenn der gemeinsame Speicher bereits Spieler enthält
        if (data.players && data.players.length > 0) {
            
            // Prüfen, ob neue Spieler hinzugekommen sind oder sich die Liste geändert hat
            const playersChanged = !players || players.length !== data.players.length || JSON.stringify(players) !== JSON.stringify(data.players);

            activeGamesData = data.activeGamesData || activeGamesData;
            players = data.players || players;
            grandTotalScores = data.grandTotalScores || grandTotalScores;
            
            // Wenn sich die Spieler geändert haben, bauen wir die Tabellen-Struktur komplett neu auf
            if (playersChanged) {
                console.log("Spielerliste hat sich geändert. Zeichne Oberflächen neu...");
                if (typeof renderPlayerBadges === "function") renderPlayerBadges();
                if (typeof updateCurrentGameTable === "function") updateCurrentGameTable();
            }

            // UI AKTUALISIERUNG: Schreibt die Punkte live in die Felder
            aktualisiereSichtbareFelder();
        }
    } catch (err) {
        console.error("Fehler beim Daten-Abrufen vom PC-Server:", err);
    }
}

// 2. SERVER-FUNKTION: Daten zum gemeinsamen Server-Speicher hochladen
async function sendeDatenZumServer() {
    if (!players || players.length === 0) return;
    isUploading = true;
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activeGamesData: activeGamesData,
                players: players,
                grandTotalScores: grandTotalScores
            })
        });
    } catch (err) {
        console.error("Fehler beim Senden zum PC-Server:", err);
    } finally {
        isUploading = false;
    }
}

// 3. AUTOMATISIERUNG: Alle 3 Sekunden den gemeinsamen Speicher abfragen
setInterval(fetchDatenVomServer, 3000);

// 4. AUTOMATISIERUNG: Bei jeder Eingabe sofort speichern und synchronisieren
document.addEventListener('change', (event) => {
    if (event.target.tagName === 'INPUT') {
        saveCurrentGameFields();
    }
});


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
        } else if (currentGame === "rennen") {
            activeGamesData.rennen = activeGamesData.rennen || {};
            activeGamesData.rennen[p] = {
                t1: row.querySelector(".ren-t1").value,
                t2: row.querySelector(".ren-t2").value,
                t3: row.querySelector(".ren-t3").value,
                t4: row.querySelector(".ren-t4").value,
                t5: row.querySelector(".ren-t5").value,
                t6: row.querySelector(".ren-t6").value
            };
            const gastRow = document.getElementById("row-rennen-Gast");
            if (gastRow) {
                activeGamesData.rennen["Gast"] = {
                    t1: gastRow.querySelector(".ren-g-t1").value,
                    t2: gastRow.querySelector(".ren-g-t2").value,
                    t3: gastRow.querySelector(".ren-g-t3").value,
                    t4: gastRow.querySelector(".ren-g-t4").value,
                    t5: gastRow.querySelector(".ren-g-t5").value,
                    t6: gastRow.querySelector(".ren-g-t6").value
                };
            }
        } else if (currentGame === "idiot") {
            activeGamesData.idiot = activeGamesData.idiot || {};
            activeGamesData.idiot[p] = {
                l: row.querySelector(".id-l").value,
                r: row.querySelector(".id-r").value,
                re: row.querySelector(".id-re").value
            };
        }
    });

    if (currentGame === "fuchsjagd") {
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
    }

    localStorage.setItem("kegel_active_games_data", JSON.stringify(activeGamesData));
    sendeDatenZumServer();
}

function aktualisiereSichtbareFelder() {
    if (!players || players.length === 0) return;

    players.forEach(p => {
        const row = document.getElementById(`row-${p}`);
        if (!row) return;

        if (currentGame === "hausnummer" && activeGamesData.hausnummer && activeGamesData.hausnummer[p]) {
            const d = activeGamesData.hausnummer[p];
            if (document.activeElement !== row.querySelector(".hn-g1")) updateVal(row.querySelector(".hn-g1"), d.g1);
            if (document.activeElement !== row.querySelector(".hn-g2")) updateVal(row.querySelector(".hn-g2"), d.g2);
            if (document.activeElement !== row.querySelector(".hn-g3")) updateVal(row.querySelector(".hn-g3"), d.g3);
            if (document.activeElement !== row.querySelector(".hn-k1")) updateVal(row.querySelector(".hn-k1"), d.k1);
            if (document.activeElement !== row.querySelector(".hn-k2")) updateVal(row.querySelector(".hn-k2"), d.k2);
            if (document.activeElement !== row.querySelector(".hn-k3")) updateVal(row.querySelector(".hn-k3"), d.k3);
        } 
        else if (currentGame === "siebzehn-vier" && activeGamesData["siebzehn-vier"] && activeGamesData["siebzehn-vier"][p]) {
            const d = activeGamesData["siebzehn-vier"][p];
            for(let i = 1; i <= 9; i++) {
                const field = row.querySelector(`.sv-w${i}`);
                if (document.activeElement !== field) updateVal(field, d[`w${i}`]);
            }
            if (document.activeElement !== row.querySelector(".sv-card")) updateVal(row.querySelector(".sv-card"), d.card);
        } 
        else if (currentGame === "rennen" && activeGamesData.rennen) {
            if (activeGamesData.rennen[p]) {
                const d = activeGamesData.rennen[p];
                for(let i = 1; i <= 6; i++) {
                    const field = row.querySelector(`.ren-t${i}`);
                    if (document.activeElement !== field) updateVal(field, d[`t${i}`]);
                }
            }
            const gastRow = document.getElementById("row-rennen-Gast");
            if (gastRow && activeGamesData.rennen["Gast"]) {
                const gd = activeGamesData.rennen["Gast"];
                for(let i = 1; i <= 6; i++) {
                    const field = gastRow.querySelector(`.ren-g-t${i}`);
                    if (document.activeElement !== field) updateVal(field, gd[`t${i}`]);
                }
            }
        } 
        else if (currentGame === "idiot" && activeGamesData.idiot && activeGamesData.idiot[p]) {
            const d = activeGamesData.idiot[p];
            if (document.activeElement !== row.querySelector(".id-l")) updateVal(row.querySelector(".id-l"), d.l);
            if (document.activeElement !== row.querySelector(".id-r")) updateVal(row.querySelector(".id-r"), d.r);
            if (document.activeElement !== row.querySelector(".id-re")) updateVal(row.querySelector(".id-re"), d.re);
        }
    });

    if (currentGame === "fuchsjagd" && activeGamesData.fuchsjagd) {
        const rowFuchs = document.getElementById("row-fuchs");
        const rowJaeger = document.getElementById("row-jaeger");
        
        if (rowFuchs && activeGamesData.fuchsjagd["Fuchs"]) {
            const d = activeGamesData.fuchsjagd["Fuchs"];
            if (document.activeElement !== rowFuchs.querySelector(".fuchs-vl")) updateVal(rowFuchs.querySelector(".fuchs-vl"), d.vl);
            for(let i = 1; i <= 8; i++) {
                const field = rowFuchs.querySelector(`.fuchs-w${i}`);
                if (document.activeElement !== field) updateVal(field, d[`w${i}`]);
            }
        }
        if (rowJaeger && activeGamesData.fuchsjagd["Jaeger"]) {
            const d = activeGamesData.fuchsjagd["Jaeger"];
            for(let i = 1; i <= 8; i++) {
                const field = rowJaeger.querySelector(`.fuchs-w${i}`);
                if (document.activeElement !== field) updateVal(field, d[`w${i}`]);
            }
        }
    }

    // Rufe deine Rechner-Funktionen auf, um Platzierungen und Berechnungen live zu aktualisieren!
    if (typeof updateKegelbuchTable === "function") updateKegelbuchTable();
    if (typeof updateGrandTotalTable === "function") updateGrandTotalTable();
}

function updateVal(el, val) {
    if (el && val !== undefined) el.value = val;
}

function savePlayersToStorage(showAlert = true) {
    localStorage.setItem("kegel_players", JSON.stringify(players));
    localStorage.setItem("kegel_grand_total_scores", JSON.stringify(grandTotalScores));
    localStorage.setItem("kegel_saved_current_game", currentGame);
    
    sendeDatenZumServer();
    if (showAlert) alert("👥 Spieler & Gesamtstände erfolgreich gespeichert!");
}

function loadPlayersFromStorage(showAlert = true) {
    const savedPlayers = localStorage.getItem("kegel_players");
    const savedScores = localStorage.getItem("kegel_grand_total_scores");
    const savedGame = localStorage.getItem("kegel_saved_current_game");
    const savedData = localStorage.getItem("kegel_active_games_data");

    if (savedPlayers) players = JSON.parse(savedPlayers);
    if (savedScores) grandTotalScores = JSON.parse(savedScores);
    if (savedGame) currentGame = savedGame;
    if (savedData) activeGamesData = JSON.parse(savedData);

    sendeDatenZumServer();

    if (showAlert) {
        if (savedPlayers) alert("♻️ Letzten Spielstand erfolgreich geladen!");
        else alert("ℹ️ Keine gespeicherte Sitzung gefunden. Standard-Spieler geladen.");
    }
}

function clearAllPlayers() {
    if (confirm("🚨 Bist du sicher? Dadurch wird die gesamte Liste und ALLE aktuellen Spielstände gelöscht!")) {
        localStorage.clear();
        players = [];
        grandTotalScores = {};
        activeGamesData = { hausnummer: {}, "siebzehn-vier": {}, "aergere-dich-nicht": {}, rennen: {}, idiot: {}, fuchsjagd: {}, tannenbaum: {} };
        currentGame = "hausnummer";
        
        sendeDatenZumServer();
        alert("🧹 Alles zurückgesetzt! Die App startet neu.");
        location.reload();
    }
}

function exportGesamterSpielstand() {
    const exportObject = {
        players: players,
        grandTotalScores: grandTotalScores,
        activeGamesData: activeGamesData,
        savedCurrentGame: currentGame,
        exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "Kegelclub_Stand.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importGesamterSpielstand(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (importedData.players && importedData.players.length > 0) {
                localStorage.setItem("kegel_players", JSON.stringify(importedData.players));
            }
            if (importedData.grandTotalScores) {
                localStorage.setItem("kegel_grand_total_scores", JSON.stringify(importedData.grandTotalScores));
            }
            if (importedData.activeGamesData) {
                localStorage.setItem("kegel_active_games_data", JSON.stringify(importedData.activeGamesData));
            }
            if (importedData.savedCurrentGame) {
                localStorage.setItem("kegel_saved_current_game", importedData.savedCurrentGame);
            }

            alert("🎯 Spielstand erfolgreich geladen! Die App startet neu...");
            location.reload();

        } catch (err) {
            alert("❌ Fehler beim Import: Datei beschädigt oder falsches Format.");
        }
    };
    reader.readAsText(file);
}