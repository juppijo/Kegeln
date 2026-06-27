// --- SPEICHER-LOGIK (LOCALSTORAGE, JSON & PC-SERVER INTERVAL) ---

let isUploading = false;
// Hilfsvariable, um zu prüfen, ob sich die Spielerliste geändert hat
let lastPlayersCount = 0; 

// =========================================================================
// 🔥 VERBESSERTE SYNC-LOGIK: AKTUALISIERT AUCH IM HINTERGRUND SOFORT 🔥
// =========================================================================

// Hilfsvariable, um den letzten Stand der Daten als Text zu merken
let letzterDatenStandAlsText = "";

async function fetchDatenVomServer() {

    if (isUploading) return; 
    
    try {
        const response = await fetch('/api/data');
        if (!response.ok) return;
        const data = await response.json();
        
        if (data.players && data.players.length > 0) {
            
            // 🔥 DER BLINK-SCHUTZ: Wir machen den Text-Vergleich der Daten!
            const aktuellerDatenStandAlsText = JSON.stringify({
                players: data.players,
                activeGamesData: data.activeGamesData,
                grandTotalScores: data.grandTotalScores
            });

            // Wenn sich SEIT DEM LETZTEN MAL ABSOLUT NICHTS GEÄNDERT HAT -> ABBRECHEN!
            if (letzterDatenStandAlsText === aktuellerDatenStandAlsText) {
                return; // Keine Aktion, kein Flackern, der Browser bleibt völlig ruhig!
            }

            // Wenn wir hier ankommen, gibt es WIRKLICH neue Zahlen vom Server!
            letzterDatenStandAlsText = aktuellerDatenStandAlsText;

            // Prüfen, ob sich strukturell das Spiel oder die Spielerliste geändert hat
            const playersChanged = !players || players.length !== data.players.length || JSON.stringify(players) !== JSON.stringify(data.players);
            const gameChanged = currentGame !== data.activeGamesData?.savedCurrentGame;

            // Daten lokal in der App speichern
            activeGamesData = data.activeGamesData || activeGamesData;
            players = data.players || players;
            grandTotalScores = data.grandTotalScores || grandTotalScores;
            
            if (data.activeGamesData && data.activeGamesData.savedCurrentGame) {
                currentGame = data.activeGamesData.savedCurrentGame;
            }

            // Nur wenn das Spiel wechselt oder Spieler dazu kommen, bauen wir das HTML neu
            if (playersChanged || gameChanged) {
                console.log("Synchronisation: Strukturwechsel. Zeichne neu...");
                if (typeof renderPlayerBadges === "function") renderPlayerBadges();
                if (typeof updateCurrentGameTable === "function") updateCurrentGameTable();
                
                setTimeout(toggleEingabemodus, 50); 
            }

            // 1. Felder mit neuen Werten füttern
            aktualisiereSichtbareFelder();

            // 2. 🔥 DIREKT HIER RECHNEN! Nicht auf das Klicken des Nutzers warten!
            if (currentGame === "hausnummer" && typeof calculateHausnummer === "function") {
                calculateHausnummer();
            } else if (currentGame === "siebzehn-vier" && typeof calculateSiebzehnVier === "function") {
                calculateSiebzehnVier();
            } else if (currentGame === "rennen" && typeof liveCalculate6TageRennen === "function") {
                liveCalculate6TageRennen();
            } else if (currentGame === "idiot" && typeof calculateIdiot === "function") {
                calculateIdiot();
            } else if (currentGame === "fuchsjagd" && typeof calculateFuchsjagd === "function") {
                calculateFuchsjagd();
            } else if (currentGame === "aergere-dich-nicht" && typeof getMenschAergereData === "function") {
                // Falls Mensch ärgere dich nicht aktiv ist, Tabelle ebenfalls triggern
                if (typeof renderMenschAergereDichNichtGame === "function") {
                    const container = document.querySelector(".table-responsive");
                    if (container) renderMenschAergereDichNichtGame(container);
                }
            }

            // Kasse und Gesamtliste sofort berechnen
            if (typeof updateKegelbuchTable === "function") updateKegelbuchTable();
            if (typeof updateGrandTotalTable === "function") updateGrandTotalTable();
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
    if (!players || players.length === 0) return;
    if (!currentGame) return;

    // === NEU: SCHUTZ VOR DATENVERLUST AUF SMARTPHONES ===
    // Prüft, ob die Eingabefelder im HTML überhaupt existieren. 
    // Falls das Smartphone die Seite frisch lädt, bricht die Funktion hier ab und löscht nichts.
    if (currentGame === "hausnummer" && !document.querySelector(".hn-g1")) return;
    if (currentGame === "siebzehn-vier" && !document.querySelector(".sv-w1")) return;
    if (currentGame === "rennen22" && !document.querySelector("[class*='ren-']")) return;
    if (currentGame === "idiot" && !document.querySelector(".id-l")) return;
    if (currentGame === "fuchsjagd" && !document.getElementById("row-fuchs")) return;
    // ====================================================

    if (!activeGamesData[currentGame]) activeGamesData[currentGame] = {};

    // 1. Lokal im Browser sichern
    localStorage.setItem("kegel_active_games_data", JSON.stringify(activeGamesData));
    localStorage.setItem("kegel_players", JSON.stringify(players));
    localStorage.setItem("kegel_grand_total_scores", JSON.stringify(grandTotalScores));

    // 2. HIER STEHT DEIN CLOUD-UPSTREAM (z.B. fetch, socket.emit, db.update oder ähnlich)
    // Dieser Teil darf nur laufen, wenn die obige if-Bedingung erfüllt ist!
    if (typeof sendDataToServer === "function") { 
        sendDataToServer(); 
    }

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
        players.forEach(p => {
            const row = document.getElementById(`row-${p}`);
            if (row) {
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
            }
        });
    } 

    else if (currentGame === "rennen22") {
        let alleTeams = [];
        players.forEach(p => {
            let t = activeGamesData["rennen"]?.[p]?.team || "Team A";
            if (!alleTeams.includes(t)) alleTeams.push(t);
        });

        alleTeams.forEach(teamName => {
            let teamKlasse = teamName.replace(' ', '');
            
            let t1 = parseInt(document.querySelector(`.ren-${teamKlasse}-t1`)?.value, 10) || 0;
            let t2 = parseInt(document.querySelector(`.ren-${teamKlasse}-t2`)?.value, 10) || 0;
            let t3 = parseInt(document.querySelector(`.ren-${teamKlasse}-t3`)?.value, 10) || 0;
            let t4 = parseInt(document.querySelector(`.ren-${teamKlasse}-t4`)?.value, 10) || 0;
            let t5 = parseInt(document.querySelector(`.ren-${teamKlasse}-t5`)?.value, 10) || 0;
            let t6 = parseInt(document.querySelector(`.ren-${teamKlasse}-t6`)?.value, 10) || 0;

            players.forEach(p => {
                if ((activeGamesData["rennen"][p]?.team || "Team A") === teamName) {
                    activeGamesData["rennen"][p].t1 = t1;
                    activeGamesData["rennen"][p].t2 = t2;
                    activeGamesData["rennen"][p].t3 = t3;
                    activeGamesData["rennen"][p].t4 = t4;
                    activeGamesData["rennen"][p].t5 = t5;
                    activeGamesData["rennen"][p].t6 = t6;
                }
            });
        });
    } 

    // --- NEU: 6 TAGE RENNEN (Auf Teambasis aktualisieren) ---
    if (currentGame === "rennen" && activeGamesData.rennen) {
        let alleTeams = [];
        players.forEach(p => {
            let t = activeGamesData["rennen"]?.[p]?.team || "Team A";
            if (!alleTeams.includes(t)) alleTeams.push(t);
        });

        alleTeams.forEach(teamName => {
            let teamKlasse = teamName.replace(' ', '');
            let teamMitglieder = players.filter(p => (activeGamesData["rennen"][p]?.team || "Team A") === teamName);
            if (teamMitglieder.length === 0) return;

            let refPlayer = teamMitglieder[0];
            const d = activeGamesData.rennen[refPlayer];

            if (d) {
                for(let i = 1; i <= 6; i++) {
                    const field = document.querySelector(`.ren-${teamKlasse}-t${i}`);
                    if (field && document.activeElement !== field) {
                        let wert = (d[`t${i}`] !== undefined) ? d[`t${i}`] : 0;
                        updateVal(field, wert);
                    }
                }
            }
        });
    }

    else if (currentGame === "idiot") {
        activeGamesData.idiot = activeGamesData.idiot || {};
        players.forEach(p => {
            const row = document.getElementById(`row-${p}`);
            if (row) {
                activeGamesData.idiot[p] = {
                    l: row.querySelector(".id-l").value,
                    r: row.querySelector(".id-r").value,
                    re: row.querySelector(".id-re").value
                };
            }
        });
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
    localStorage.setItem("kegel_players", JSON.stringify(players));
    localStorage.setItem("kegel_grand_total_scores", JSON.stringify(grandTotalScores));

    sendeDatenZumServer();
}

function aktualisiereSichtbareFelder() {
    if (!players || players.length === 0) return;

    let datenHabenSichGeaendert = true;

    // 1. Spiele aktualisieren, die auf Einzelspielern basieren
    players.forEach(p => {
        const row = document.getElementById(`row-${p}`);
        if (!row) return;

        // --- HAUSNUMMER ---
        if (currentGame === "hausnummer" && activeGamesData.hausnummer && activeGamesData.hausnummer[p]) {
            const d = activeGamesData.hausnummer[p];
            if (document.activeElement !== row.querySelector(".hn-g1")) updateVal(row.querySelector(".hn-g1"), d.g1);
            if (document.activeElement !== row.querySelector(".hn-g2")) updateVal(row.querySelector(".hn-g2"), d.g2);
            if (document.activeElement !== row.querySelector(".hn-g3")) updateVal(row.querySelector(".hn-g3"), d.g3);
            if (document.activeElement !== row.querySelector(".hn-k1")) updateVal(row.querySelector(".hn-k1"), d.k1);
            if (document.activeElement !== row.querySelector(".hn-k2")) updateVal(row.querySelector(".hn-k2"), d.k2);
            if (document.activeElement !== row.querySelector(".hn-k3")) updateVal(row.querySelector(".hn-k3"), d.k3);
        } 
        // --- 17 UND 4 ---
        else if (currentGame === "siebzehn-vier" && activeGamesData["siebzehn-vier"] && activeGamesData["siebzehn-vier"][p]) {
            const d = activeGamesData["siebzehn-vier"][p];
            for(let i = 1; i <= 9; i++) {
                const field = row.querySelector(`.sv-w${i}`);
                if (document.activeElement !== field) updateVal(field, d[`w${i}`]);
            }
            if (document.activeElement !== row.querySelector(".sv-card")) updateVal(row.querySelector(".sv-card"), d.card);
        } 
        // --- IDIOTENKEGELN ---
        else if (currentGame === "idiot" && activeGamesData.idiot && activeGamesData.idiot[p]) {
            const d = activeGamesData.idiot[p];
            if (document.activeElement !== row.querySelector(".id-l")) updateVal(row.querySelector(".id-l"), d.l);
            if (document.activeElement !== row.querySelector(".id-r")) updateVal(row.querySelector(".id-r"), d.r);
            if (document.activeElement !== row.querySelector(".id-re")) updateVal(row.querySelector(".id-re"), d.re);
        }
    });

    // --- NEU: 6 TAGE RENNEN (Auf Teambasis aktualisieren) ---
    if (currentGame === "rennen" && activeGamesData.rennen) {
        let alleTeams = [];
        players.forEach(p => {
            let t = activeGamesData["rennen"]?.[p]?.team || "Team A";
            if (!alleTeams.includes(t)) alleTeams.push(t);
        });

        alleTeams.forEach(teamName => {
            let teamKlasse = teamName.replace(' ', '');
            let teamMitglieder = players.filter(p => (activeGamesData["rennen"][p]?.team || "Team A") === teamName);
            if (teamMitglieder.length === 0) return;

            let refPlayer = teamMitglieder[0];
            const d = activeGamesData.rennen[refPlayer];

            if (d) {
                for(let i = 1; i <= 6; i++) {
                    const field = document.querySelector(`.ren-${teamKlasse}-t${i}`);
                    if (field && document.activeElement !== field) {
                        updateVal(field, d[`t${i}`] || 0);
                    }
                }
            }
        });
    }

    // --- FUCHSJAGD ---
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

    // =========================================================================
    // 🔥 DIE ERZWUNGENE RECHEN-MASCHINE 🔥
    // =========================================================================
    if (datenHabenSichGeaendert) {
        if (currentGame === "hausnummer" && typeof calculateHausnummer === "function") {
            calculateHausnummer(); 
        } 
        else if (currentGame === "siebzehn-vier" && typeof calculateSiebzehnVier === "function") {
            calculateSiebzehnVier();
        } 
        else if (currentGame === "rennen" && typeof liveCalculate6TageRennen === "function") {
            liveCalculate6TageRennen();
        } 
        else if (currentGame === "idiot" && typeof calculateIdiot === "function") {
            calculateIdiot();
        } 
        else if (currentGame === "fuchsjagd" && typeof calculateFuchsjagd === "function") {
            calculateFuchsjagd();
        }
    }

    if (typeof updateKegelbuchTable === "function") updateKegelbuchTable();
    if (typeof updateGrandTotalTable === "function") updateGrandTotalTable();
}

function updateVal(el, val) {
    if (el && val !== undefined) {
        const aktuellerWert = el.value.toString();
        const neuerWert = val.toString();
        
        if (aktuellerWert !== neuerWert) {
            el.value = val;
        }
    }
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

    // Falls lokale Daten existieren, laden und Server aktualisieren
    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
        if (savedScores) grandTotalScores = JSON.parse(savedScores);
        if (savedGame) currentGame = savedGame;
        if (savedData) activeGamesData = JSON.parse(savedData);

        // Nur an den Server senden, wenn wir auch wirklich echte Daten geladen haben!
        sendeDatenZumServer();

        if (showAlert) {
            alert("♻️ Letzten Spielstand erfolgreich aus lokalem Speicher geladen!");
        }
    } else {
        // WICHTIG: Wenn KEINE lokalen Daten existieren (neues Handy), 
        // holen wir uns sofort den aktuellen Stand vom Server, anstatt leere Daten hochzuladen!
        if (typeof fetchDatenVomServer === "function") {
            fetchDatenVomServer();
        }
        
        if (showAlert) {
            alert("ℹ️ Keine lokale Sitzung gefunden. Aktuelle Spieldaten werden vom Server geladen...");
        }
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

// --- LOGIK FÜR DEN EINGABEMODUS (SCHREIBRECHTE-SCHUTZ) ---

function toggleEingabemodus() {
    const schalter = document.getElementById("eingabemodus-schalter");
    if (!schalter) return;

    const istAktiv = schalter.checked;
    
    const alleInputs = document.querySelectorAll("table input, .table input, #row-fuchs input, #row-jaeger input");
    
    alleInputs.forEach(input => {
        if (istAktiv) {
            input.removeAttribute("disabled");
            input.style.backgroundColor = ""; 
            input.style.cursor = "text";
        } else {
            input.setAttribute("disabled", "true");
            input.style.backgroundColor = "#1e1e1e"; 
            input.style.color = "#ffffff"; 
            input.style.cursor = "not-allowed";
        }
    });
}

function syncAndCalculateRennen(teamName, tag, value) {
    let intVal = parseInt(value, 10) || 0;
    let teamMitglieder = players.filter(p => (activeGamesData["rennen"][p]?.team || "Team A") === teamName);
    
    teamMitglieder.forEach(p => {
        if (!activeGamesData["rennen"][p]) activeGamesData["rennen"][p] = { team: teamName, t1:0, t2:0, t3:0, t4:0, t5:0, t6:0 };
        activeGamesData["rennen"][p][`t${tag}`] = intVal;
    });
    
    if (typeof liveCalculate6TageRennen === "function") {
        liveCalculate6TageRennen();
    }
    saveCurrentGameFields();
}