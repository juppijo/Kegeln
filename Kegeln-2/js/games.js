// --- SPIEL-RECHNER & LOGIK ---
// Struktur der Pyramide: Zahl -> benötigte Treffer
const baumStruktur = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1 };

function updateCurrentGameTable() {
    const tableResponsive = document.querySelector(".table-responsive");
    if (!tableResponsive) return;

    // REPARATUR-BLOCK: Stellt bei jedem Spielwechsel (außer Tannenbaum) 
    // die saubere Standard-Struktur mit nur EINEM Platzierungsfeld wieder her!
    if (currentGame !== "tannenbaum") {
        tableResponsive.innerHTML = `
            <table>
                <thead>
                    <tr id="game-thead-row"></tr>
                </thead>
                <tbody id="game-tbody"></tbody>
            </table>
        `;
    }

    const thRow = document.getElementById("game-thead-row");
    const tbody = document.getElementById("game-tbody");
    const ruleText = document.getElementById("game-rule-text");

    if (ruleText) {
        ruleText.innerText = gameRules[currentGame] || "";
    }

    // --- AB HIER FOLGEN DIE SPANNDENDEN SPIELE-BLÖCKE ---
    if (currentGame === "hausnummer") {
        // Die Spaltenüberschriften für die Kombi-Hausnummer (überschreibt thRow mit den 2 Platzierungen)
        thRow.innerHTML = `
            <th>Name</th>
            <th style="color: #60a5fa; font-size: 0.85rem;">Pl. Groß</th>
            <th style="color: #fbbf24; font-size: 0.85rem;">Pl. Klein</th>
            <th style="background-color: rgba(59, 130, 246, 0.1); color: #60a5fa;">📈 W1 (Groß)</th>
            <th style="background-color: rgba(59, 130, 246, 0.1); color: #60a5fa;">📈 W2 (Groß)</th>
            <th style="background-color: rgba(59, 130, 246, 0.1); color: #60a5fa;">📈 W3 (Groß)</th>
            <th style="background-color: rgba(59, 130, 246, 0.1); font-weight: bold; color: #3b82f6;">🏠 Hausnr. Groß</th>
            <th style="background-color: rgba(245, 158, 11, 0.1); color: #fbbf24;">📉 W1 (Klein)</th>
            <th style="background-color: rgba(245, 158, 11, 0.1); color: #fbbf24;">📉 W2 (Klein)</th>
            <th style="background-color: rgba(245, 158, 11, 0.1); color: #fbbf24;">📉 W3 (Klein)</th>
            <th style="background-color: rgba(245, 158, 11, 0.1); font-weight: bold; color: #f59e0b;">🏠 Hausnr. Klein</th>
        `;
        
        tbody.innerHTML = "";

        players.forEach(p => {
            const d = activeGamesData.hausnummer[p] || { g1: 0, g2: 0, g3: 0, k1: 9, k2: 9, k3: 9 };
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td><strong>${p}</strong></td>
                    <td class="rank-col-gross" style="font-weight:bold; color:#60a5fa; text-align:center;">-</td>
                    <td class="rank-col-klein" style="font-weight:bold; color:#fbbf24; text-align:center;">-</td>
                    <td style="background-color: rgba(59, 130, 246, 0.03);"><input type="number" class="hn-g1" min="0" max="9" value="${d.g1}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td style="background-color: rgba(59, 130, 246, 0.03);"><input type="number" class="hn-g2" min="0" max="9" value="${d.g2}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td style="background-color: rgba(59, 130, 246, 0.03);"><input type="number" class="hn-g3" min="0" max="9" value="${d.g3}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td class="hn-g-res" style="font-weight:bold; color:#3b82f6; background-color: rgba(59, 130, 246, 0.05);">0</td>
                    <td style="background-color: rgba(245, 158, 11, 0.03);"><input type="number" class="hn-k1" min="0" max="9" value="${d.k1}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td style="background-color: rgba(245, 158, 11, 0.03);"><input type="number" class="hn-k2" min="0" max="9" value="${d.k2}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td style="background-color: rgba(245, 158, 11, 0.03);"><input type="number" class="hn-k3" min="0" max="9" value="${d.k3}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td class="hn-k-res" style="font-weight:bold; color:#f59e0b; background-color: rgba(245, 158, 11, 0.05);">999</td>
                </tr>`;
        });
        liveCalculateHausnummer();
    }
    else if (currentGame === "siebzehn-vier") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>W1</th><th>W2</th><th>W3</th><th>W4</th><th>W5</th><th>🃏 Karte</th><th>Gesamt</th><th>Überkauft?</th>";
        tbody.innerHTML = ""; // Zur Sicherheit leeren
        
        players.forEach(p => {
            const d = activeGamesData["siebzehn-vier"][p] || {w1:0, w2:0, w3:0, w4:0, w5:0, card:0, over: false};
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td><strong>${p}</strong></td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="sv-w1" min="0" max="9" value="${d.w1}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-w2" min="0" max="9" value="${d.w2}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-w3" min="0" max="9" value="${d.w3}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-w4" min="0" max="9" value="${d.w4}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-w5" min="0" max="9" value="${d.w5}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-card" min="0" max="11" value="${d.card}" placeholder="0" oninput="liveCalculate17und4(); saveCurrentGameFields();" style="border-color: var(--accent);"></td>
                    <td class="sv-res" style="font-weight:bold; color:var(--accent);">0</td>
                    <td><input type="checkbox" class="val-over" ${d.over ? 'checked' : ''} onchange="liveCalculate17und4(); saveCurrentGameFields();"> Ja</td>
                </tr>`;
        });
        liveCalculate17und4();
    }
    else if (currentGame === "rennen") {
        thRow.innerHTML = "<th>Team wählen</th><th>Name</th><th>Tag 1</th><th>Tag 2 (x2)</th><th>Tag 3 (x3)</th><th>Tag 4 (x4)</th><th>Tag 5 (x5)</th><th>Tag 6 (x6)</th><th>Einzel</th><th>Team-Gesamt</th>";
        
        // 1. Initialisiere Daten, falls noch gar nichts vorhanden ist
        if (!activeGamesData["rennen"] || Object.keys(activeGamesData["rennen"]).length === 0) {
            activeGamesData["rennen"] = {};
            // Beim allerersten Start teilen wir fair auf Team A, B, C etc. auf
            players.forEach((p, index) => {
                let initialTeamNum = Math.floor(index / 2) + 1;
                let initialTeam = `Team ${String.fromCharCode(64 + initialTeamNum)}`; // Team A, Team B...
                activeGamesData["rennen"][p] = { team: initialTeam, t1:0, t2:0, t3:0, t4:0, t5:0, t6:0 };
            });
            // Gast-Eintrag standardmäßig leer bereithalten
            activeGamesData["rennen"]["Gast"] = { team: "Keins", t1:0, t2:0, t3:0, t4:0, t5:0, t6:0 };
        }

        // Wir holen uns eine Liste aller möglichen Teams für das Dropdown (z.B. Team A bis Team H)
        const maxTeamsCount = Math.ceil(players.length / 2) + 1;
        let teamOptionsHTML = "";
        for (let i = 1; i <= maxTeamsCount; i++) {
            let tName = `Team ${String.fromCharCode(64 + i)}`;
            teamOptionsHTML += `<option value="${tName}">${tName}</option>`;
        }

        // 2. Erstelle eine Übersicht aller echten Spieler, sortiert nach ihrem aktuell gewählten Team
        let sortedPlayers = [...players].sort((a, b) => {
            let tA = activeGamesData["rennen"][a]?.team || "Team A";
            let tB = activeGamesData["rennen"][b]?.team || "Team A";
            return tA.localeCompare(tB);
        });

        tbody.innerHTML = "";

       // Render-Funktion für eine Tabellenzeile mit Klassen-Zuweisung
        function generateRennenRowHTML(name, data, isGast = false) {
            const rowId = isGast ? "row-rennen-Gast" : `row-${name}`;
            const inputClass = isGast ? "ren-g" : "ren";
            
            // Dropdown für das Team (mit unserer neuen CSS-Klasse für die optimale Breite)
            let selectHTML = `<select class="ren-team-select" onchange="changeRennenTeam('${name}', this.value)">`;
            for (let i = 1; i <= maxTeamsCount; i++) {
                let tName = `Team ${String.fromCharCode(64 + i)}`;
                let selected = (data.team === tName) ? "selected" : "";
                selectHTML += `<option value="${tName}" ${selected}>👥 ${tName}</option>`;
            }
            selectHTML += `</select>`;

            // Optischer Hinweis für den automatischen Gast-Partner
            if (isGast) {
                selectHTML = `<span style="color:#94a3b8; font-size:0.85rem; font-style:italic; padding-left:5px;">🤖 Autom. Partner</span>`;
            }

            return `
                <tr id="${rowId}" data-team="${data.team}">
                    <td style="padding: 10px 6px;">${selectHTML}</td>
                    <td><strong>${name}</strong></td>
                    <td><input type="number" class="${inputClass}-t1" min="0" max="9" value="${data.t1}" oninput="liveCalculate6TageRennen(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="${inputClass}-t2" min="0" max="9" value="${data.t2}" oninput="liveCalculate6TageRennen(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="${inputClass}-t3" min="0" max="9" value="${data.t3}" oninput="liveCalculate6TageRennen(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="${inputClass}-t4" min="0" max="9" value="${data.t4}" oninput="liveCalculate6TageRennen(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="${inputClass}-t5" min="0" max="9" value="${data.t5}" oninput="liveCalculate6TageRennen(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="${inputClass}-t6" min="0" max="9" value="${data.t6}" oninput="liveCalculate6TageRennen(); saveCurrentGameFields();"></td>
                    <td class="${inputClass}-res" style="font-weight:bold; color:var(--text-muted);">0</td>
                    <td class="team-res-${data.team.replace(' ', '')}" style="font-weight:bold; color:var(--accent); font-size:1.05rem;">0 Holz</td>
                </tr>`;
        }

        // 3. Zeilen ausgeben und prüfen, ob ein Team unvollständig ist (Gast-Bedarf)
        let teamCounts = {};
        sortedPlayers.forEach(p => {
            let t = activeGamesData["rennen"][p].team;
            teamCounts[t] = (teamCounts[t] || 0) + 1;
        });

        let currentRenderedTeam = "";
        sortedPlayers.forEach(p => {
            let pData = activeGamesData["rennen"][p];
            
            // Wenn wir zu einem neuen Team wechseln und das alte Team ungerade (1 Spieler) war, schieben wir dort den Gast rein!
            if (currentRenderedTeam !== "" && currentRenderedTeam !== pData.team) {
                if (teamCounts[currentRenderedTeam] === 1) {
                    let gData = activeGamesData["rennen"]["Gast"] || { t1:0, t2:0, t3:0, t4:0, t5:0, t6:0 };
                    gData.team = currentRenderedTeam;
                    activeGamesData["rennen"]["Gast"] = gData;
                    tbody.innerHTML += generateRennenRowHTML("Gast (Partner)", gData, true);
                }
            }
            
            currentRenderedTeam = pData.team;
            tbody.innerHTML += generateRennenRowHTML(p, pData, false);
        });

        // Letztes Team in der Liste auf Gast-Bedarf prüfen
        if (teamCounts[currentRenderedTeam] === 1) {
            let gData = activeGamesData["rennen"]["Gast"] || { t1:0, t2:0, t3:0, t4:0, t5:0, t6:0 };
            gData.team = currentRenderedTeam;
            activeGamesData["rennen"]["Gast"] = gData;
            tbody.innerHTML += generateRennenRowHTML("Gast (Partner)", gData, true);
        }

        liveCalculate6TageRennen(); // Direkt schick durchrechnen
    }
    else if (currentGame === "idiot") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>Links</th><th>Rückw.</th><th>Rechts</th><th>Gesamt</th>";
        players.forEach(p => {
            const d = activeGamesData.idiot[p] || {l:0, r:0, re:0};
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td>${p}</td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="id-l" value="${d.l}" min="0" max="9" oninput="saveCurrentGameFields()"></td>
                    <td><input type="number" class="id-r" value="${d.r}" min="0" max="9" oninput="saveCurrentGameFields()"></td>
                    <td><input type="number" class="id-re" value="${d.re}" min="0" max="9" oninput="saveCurrentGameFields()"></td>
                    <td class="id-gesamt" style="font-weight:bold;">0</td>
                </tr>`;
        });
    }
    else if (currentGame === "fuchsjagd") {
        thRow.innerHTML = "<th>Name</th><th>Rolle</th><th>Platz</th><th>Vorwurf L</th><th>Vorwurf R</th><th>W1</th><th>W2</th><th>W3</th><th>Gesamt</th>";
        players.forEach(p => {
            const d = activeGamesData.fuchsjagd[p] || {role: "jaeger", vl:0, vr:0, w1:0, w2:0, w3:0};
            
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td><strong>${p}</strong></td>
                    <td>
                        <select class="fuchs-role" onchange="adjustFuchsFields('${p}'); liveCalculateFuchsjagd(); saveCurrentGameFields();">
                            <option value="jaeger" ${d.role === 'jaeger' ? 'selected' : ''}>🏹 Jäger</option>
                            <option value="fuchs" ${d.role === 'fuchs' ? 'selected' : ''}>🦊 Fuchs</option>
                        </select>
                    </td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="fuchs-vl" min="0" max="9" value="${d.vl}" oninput="liveCalculateFuchsjagd(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="fuchs-vr" min="0" max="9" value="${d.vr}" oninput="liveCalculateFuchsjagd(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="fuchs-w1" min="0" max="9" value="${d.w1}" oninput="liveCalculateFuchsjagd(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="fuchs-w2" min="0" max="9" value="${d.w2}" oninput="liveCalculateFuchsjagd(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="fuchs-w3" min="0" max="9" value="${d.w3}" oninput="liveCalculateFuchsjagd(); saveCurrentGameFields();"></td>
                    <td class="fuchs-res" style="font-weight:bold; color:var(--accent);">0</td>
                </tr>`;
        });
        // Felder direkt für Jäger sperren, falls sie keine Vorwürfe haben
        players.forEach(p => adjustFuchsFields(p));
        liveCalculateFuchsjagd();
    }

    else if (currentGame === "tannenbaum") {
        // Wir nutzen die responsive Box für die Tannenbaum-Oberfläche
        tableResponsive.innerHTML = `
            <div class="tannenbaum-container" style="display: flex; flex-direction: column; gap: 20px; padding: 10px;">
                <!-- TEAMAUSWAHL-PANEL -->
                <div id="tannenbaum-setup" style="background: var(--bg-card); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
                    <h3 style="margin-top:0; color: var(--accent); font-size: 1.1rem; margin-bottom: 10px;">👥 Teams für den Tannenbaum aufteilen</h3>
                    <div id="tannenbaum-selectors" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;"></div>
                </div>

                <!-- SPIELFELD (BÄUME UND EINGABEN) -->
                <div id="tannenbaum-game-board" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; min-width: 600px;">
                    <!-- Wird dynamisch durch renderTannenbaumSubElements befüllt -->
                </div>
            </div>
        `;

        // 1. Initialisiere Spieldaten NUR, wenn noch absolut gar nichts für den Tannenbaum existiert
        if (!activeGamesData["tannenbaum"] || !activeGamesData["tannenbaum"].team1 || !activeGamesData["tannenbaum"].team2) {
            activeGamesData["tannenbaum"] = {
                team1: [],
                team2: [],
                wuerfe: {},
                historie: {}
            };
            
            // Nur beim allerersten Mal aufteilen
            players.forEach((p, index) => {
                if (index < Math.ceil(players.length / 2)) {
                    activeGamesData["tannenbaum"].team1.push(p);
                } else {
                    activeGamesData["tannenbaum"].team2.push(p);
                }
            });
        }

        // Stelle sicher, dass jeder Spieler einen Eintrag im Wurf- und Historienobjekt hat
        players.forEach(p => {
            if (!activeGamesData["tannenbaum"].wuerfe[p]) activeGamesData["tannenbaum"].wuerfe[p] = [];
            if (!activeGamesData["tannenbaum"].historie) activeGamesData["tannenbaum"].historie = {};
            if (!activeGamesData["tannenbaum"].historie[p]) activeGamesData["tannenbaum"].historie[p] = [];
        });

        // 2. Erzeuge die Dropdowns für jeden Spieler im Setup-Panel
        const selectorsContainer = document.getElementById("tannenbaum-selectors");
        selectorsContainer.innerHTML = "";

        players.forEach(p => {
            const isT1 = activeGamesData["tannenbaum"].team1.includes(p);
            
            const div = document.createElement("div");
            div.style = "display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.02); padding: 6px; border-radius: 4px;";
            div.innerHTML = `
                <span style="font-size: 0.85rem; font-weight: bold;">${p}</span>
                <select class="ren-team-select" onchange="changeTannenbaumPlayerTeam('${p}', this.value)" style="width: 100%;">
                    <option value="1" ${isT1 ? 'selected' : ''}>🎄 Gruppe 1 (Links)</option>
                    <option value="2" ${!isT1 ? 'selected' : ''}>⭐ Gruppe 2 (Rechts)</option>
                </select>
            `;
            selectorsContainer.appendChild(div);
        });

        // Zeichne die Bäume und Eingabefelder
        renderTannenbaumSubElements();
    }
}

function resetCurrentGame() {
    if (confirm("Werte für dieses Spiel wirklich löschen und zurücksetzen?")) {
        activeGamesData[currentGame] = {}; 
        localStorage.setItem("kegel_active_games_data", JSON.stringify(activeGamesData));
        updateCurrentGameTable();
    }
    if (currentGame === "tannenbaum") {
        activeGamesData["tannenbaum"] = null; // Löscht die Würfe
        updateCurrentGameTable();
        return;
    }
}

function liveCalculateHausnummer() {
    let grossScores = [];
    let kleinScores = [];

    // 1. Durchlauf: Hausnummern bilden und Werte für das Ranking sammeln
    players.forEach(p => {
        const row = document.getElementById(`row-${p}`); if(!row) return;
        
        // GROSS: Auslesen, absteigend sortieren, anzeigen
        let g1 = parseInt(row.querySelector(".hn-g1").value) || 0;
        let g2 = parseInt(row.querySelector(".hn-g2").value) || 0;
        let g3 = parseInt(row.querySelector(".hn-g3").value) || 0;
        let grossArr = [g1, g2, g3].sort((a, b) => b - a);
        let grossNum = parseInt(grossArr.join("")) || 0;
        row.querySelector(".hn-g-res").innerText = grossNum;
        grossScores.push({ player: p, score: grossNum });

        // KLEIN: Auslesen, aufsteigend sortieren, anzeigen
        let k1 = parseInt(row.querySelector(".hn-k1").value) || 0;
        let k2 = parseInt(row.querySelector(".hn-k2").value) || 0;
        let k3 = parseInt(row.querySelector(".hn-k3").value) || 0;
        let kleinArr = [k1, k2, k3].sort((a, b) => a - b);
        let kleinNum = parseInt(kleinArr.join("")) || 999;
        row.querySelector(".hn-k-res").innerText = kleinNum;
        kleinScores.push({ player: p, score: kleinNum });
    });

    // 2. Platzierung für GROSS ermitteln (Höchste Zahl gewinnt -> Platz 1)
    grossScores.sort((a, b) => b.score - a.score);
    grossScores.forEach((item, index) => {
        const row = document.getElementById(`row-${item.player}`);
        if(row) {
            row.querySelector(".rank-col-gross").innerText = (index + 1) + ".";
        }
    });

    // 3. Platzierung für KLEIN ermitteln (Niedrigste Zahl gewinnt -> Platz 1)
    kleinScores.sort((a, b) => a.score - b.score);
    kleinScores.forEach((item, index) => {
        const row = document.getElementById(`row-${item.player}`);
        if(row) {
            row.querySelector(".rank-col-klein").innerText = (index + 1) + ".";
        }
    });
}

function calculateGame() {
    let results = [];
    players.forEach(p => { const row = document.getElementById(`row-${p}`); if(row) row.className = ""; });

    if (currentGame === "hausnummer") {
        liveCalculateHausnummer();
        let großResults = []; let kleinResults = [];

        players.forEach(p => {
            const row = document.getElementById(`row-${p}`); if(!row) return;
            großResults.push({ name: p, val: parseInt(row.querySelector(".g-res").innerText) || 0 });
            kleinResults.push({ name: p, val: parseInt(row.querySelector(".k-res").innerText) || 0 });
        });

        großResults.sort((a,b) => b.val - a.val);
        kleinResults.sort((a,b) => a.val - b.val);

        [großResults, kleinResults].forEach(resList => {
            resList.forEach((item, index) => {
                if(index === 0) grandTotalScores[item.name] += 3;
                else if(index === 1) grandTotalScores[item.name] += 2;
                else if(index === 2) grandTotalScores[item.name] += 1;
                if(index === resList.length - 1 && resList.length > 1) grandTotalScores[item.name] -= 1;
            });
        });

        players.forEach(p => {
            const row = document.getElementById(`row-${p}`); if(!row) return;
            if(großResults[0].name === p || kleinResults[0].name === p) row.classList.add("winner-row");
            if(großResults[großResults.length - 1].name === p || kleinResults[kleinResults.length - 1].name === p) row.classList.add("loser-row");
        });
        alert("🎉 Beide Hausnummern ausgewertet!");
    } else {
        // Logik für die restlichen Spiele (17&4, Rennen, Idiot)
        players.forEach(p => {
            const row = document.getElementById(`row-${p}`); if(!row) return;
            let score = 0;
            
            if (currentGame === "siebzehn-vier") {
                liveCalculate17und4();
                const pts = parseInt(row.querySelector(".sv-res").innerText) || 0;
                score = row.querySelector(".val-over").checked || pts > 21 ? -1 : pts;
            } else if (currentGame === "rennen") {
                liveCalculate6TageRennen();
                const teamName = row.getAttribute("data-team");
                // Wir holen das Gesamtergebnis des Teams aus der Zelle
                const teamCell = row.querySelector(`.team-res-${teamName.replace(' ', '')}`);
                score = parseInt(teamCell.innerText) || 0; 
            } else if (currentGame === "idiot") {
                score = (parseInt(row.querySelector(".id-l").value) || 0) + (parseInt(row.querySelector(".id-r").value) || 0) + (parseInt(row.querySelector(".id-re").value) || 0);
                row.querySelector(".id-gesamt").innerText = score;
            } else if (currentGame === "fuchsjagd") {
                liveCalculateFuchsjagd();
                const role = row.querySelector(".fuchs-role").value;
                const totalPoints = parseInt(row.querySelector(".fuchs-res").innerText) || 0;
                
                // Wir speichern den Score. Füchse bekommen einen Bonus zur internen Sortierung,
                // aber die Logik ermittelt den Gewinner anhand der Regeln:
                score = totalPoints; 
            }

            results.push({ name: p, score: score, element: row });
        });

        // Ränge ermitteln ------------------------------------------------------
        results.sort((a, b) => b.score - a.score);
        
        if (currentGame === "fuchsjagd") {
            // Sonderwertung Fuchsjagd:
            let fuchsObj = null;
            let hoechsterJaegerScore = -1;
            
            players.forEach(p => {
                const row = document.getElementById(`row-${p}`);
                const role = row.querySelector(".fuchs-role").value;
                const total = parseInt(row.querySelector(".fuchs-res").innerText) || 0;
                if (role === "fuchs") {
                    fuchsObj = { name: p, score: total, element: row };
                } else {
                    if (total > hoechsterJaegerScore) hoechsterJaegerScore = total;
                }
            });

            if (fuchsObj) {
                // Fuchs gewinnt, wenn er >= 31 hat UND nicht von Jägern eingeholt wurde
                if (fuchsObj.score >= 31 && fuchsObj.score > hoechsterJaegerScore) {
                    fuchsObj.element.querySelector(".rank-col").innerHTML = `🦊🥇 Win`;
                    fuchsObj.element.classList.add("winner-row");
                    grandTotalScores[fuchsObj.name] += 3;
                    alert(`Der Fuchs ${fuchsObj.name} hat die Jagd mit ${fuchsObj.score} Holz gewonnen! 🎉`);
                } else {
                    fuchsObj.element.querySelector(".rank-col").innerHTML = `💀 Erlegt`;
                    fuchsObj.element.classList.add("loser-row");
                    grandTotalScores[fuchsObj.name] -= 1;
                    alert(`Die Jäger haben den Fuchs erlegt! (Höchster Jäger: ${hoechsterJaegerScore} Holz) 🏹`);
                    
                    // Jäger belohnen, die den Fuchs eingeholt haben
                    players.forEach(p => {
                        const row = document.getElementById(`row-${p}`);
                        const role = row.querySelector(".fuchs-role").value;
                        const total = parseInt(row.querySelector(".fuchs-res").innerText) || 0;
                        if (role === "jaeger" && total >= fuchsObj.score) {
                            row.querySelector(".rank-col").innerHTML = `🏹🥇`;
                            row.classList.add("winner-row");
                            grandTotalScores[p] += 2;
                        }
                    });
                }
            }
        } else {
            // Das ist der Standard-Code für die restlichen Spiele:
            results.forEach((item, index) => {
                const rank = index + 1; const rankCol = item.element.querySelector(".rank-col"); if(!rankCol) return;
                if (rank === 1) { rankCol.innerHTML = `<span class="rank-badge rank-1">🥇 1</span>`; item.element.classList.add("winner-row"); grandTotalScores[item.name] += 3; }
                else if (rank === 2) { rankCol.innerHTML = `<span class="rank-badge rank-2">🥈 2</span>`; grandTotalScores[item.name] += 2; }
                else if (rank === 3) { rankCol.innerHTML = `<span class="rank-badge rank-3">🥉 3</span>`; grandTotalScores[item.name] += 1; }
                else rankCol.innerHTML = `<span class="rank-badge">${rank}</span>`;
                if (rank === results.length && results.length > 1) { item.element.classList.add("loser-row"); grandTotalScores[item.name] -= 1; }
            });
        }
        updateGrandTotalTable();
    }   
}


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
    kbResults.sort((a, b) => b.score - a.score);
    kbResults.forEach((item, index) => {
        const rankCol = item.element.querySelector(".kb-rank-col");
        if(rankCol) rankCol.innerHTML = `<span class="rank-badge">${index + 1}</span>`;
    });
}

function liveCalculate17und4() {
    players.forEach(p => {
        const row = document.getElementById(`row-${p}`); if(!row) return;
        const w1 = parseInt(row.querySelector(".sv-w1").value) || 0;
        const w2 = parseInt(row.querySelector(".sv-w2").value) || 0;
        const w3 = parseInt(row.querySelector(".sv-w3").value) || 0;
        const w4 = parseInt(row.querySelector(".sv-w4").value) || 0;
        const w5 = parseInt(row.querySelector(".sv-w5").value) || 0;
        const card = parseInt(row.querySelector(".sv-card").value) || 0; // <-- NEU
        const isOver = row.querySelector(".val-over").checked;

        let sum = w1 + w2 + w3 + w4 + w5 + card; // <-- Karte zählt mit
        
        // Automatisch Haken setzen, wenn man über 21 rutscht
        if (sum > 21 && !isOver) {
            row.querySelector(".val-over").checked = true;
        }

        row.querySelector(".sv-res").innerText = sum;
    });
}

// Sperrt die Vorwurfs-Felder für Jäger, da nur der Fuchs sie nutzen darf
function adjustFuchsFields(playerName) {
    const row = document.getElementById(`row-${playerName}`); if(!row) return;
    const role = row.querySelector(".fuchs-role").value;
    const vlInput = row.querySelector(".fuchs-vl");
    const vrInput = row.querySelector(".fuchs-vr");

    if (role === "jaeger") {
        vlInput.value = 0;
        vlInput.disabled = true;
        vlInput.style.opacity = "0.3";
        vrInput.value = 0;
        vrInput.disabled = true;
        vrInput.style.opacity = "0.3";
        row.style.backgroundColor = "transparent";
    } else {
        vlInput.disabled = false;
        vlInput.style.opacity = "1";
        vrInput.disabled = false;
        vrInput.style.opacity = "1";
        row.style.backgroundColor = "rgba(245, 158, 11, 0.15)"; // Fuchs-Zeile hervorheben
    }
}

// Rechnet die Live-Punkte zusammen
function liveCalculateFuchsjagd() {
    players.forEach(p => {
        const row = document.getElementById(`row-${p}`); if(!row) return;
        const role = row.querySelector(".fuchs-role").value;
        const vl = parseInt(row.querySelector(".fuchs-vl").value) || 0;
        const vr = parseInt(row.querySelector(".fuchs-vr").value) || 0;
        const w1 = parseInt(row.querySelector(".fuchs-w1").value) || 0;
        const w2 = parseInt(row.querySelector(".fuchs-w2").value) || 0;
        const w3 = parseInt(row.querySelector(".fuchs-w3").value) || 0;

        let total = w1 + w2 + w3;
        if (role === "fuchs") {
            total += (vl + vr); // Vorwürfe zählen nur beim Fuchs
        }
        row.querySelector(".fuchs-res").innerText = total;
    });
}

function renderTannenbaumSubElements() {
    const board = document.getElementById("tannenbaum-game-board");
    if (!board) return;

    const data = activeGamesData["tannenbaum"];

    // Wir bauen das Spielfeld mit zwei Spalten (Links für Gruppe 1, Rechts für Gruppe 2) neu auf
    board.innerHTML = `
        <!-- LINKER BAUM & SPIELER (GRUPPE 1) -->
        <div id="tannenbaum-col-1" style="display: flex; flex-direction: column; gap: 15px; background: rgba(59, 130, 246, 0.02); padding: 15px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.1);">
            <h3 style="text-align: center; color: #60a5fa; margin: 0;">🎄 Gruppe 1</h3>
            <div id="tannenbaum-canvas-container-1" style="display:flex; justify-content:center;">
                <canvas id="tannenbaum-canvas-1" width="280" height="340"></canvas>
            </div>
            <div id="tannenbaum-players-1" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>

        <!-- RECHTER BAUM & SPIELER (GRUPPE 2) -->
        <div id="tannenbaum-col-2" style="display: flex; flex-direction: column; gap: 15px; background: rgba(245, 158, 11, 0.02); padding: 15px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.1);">
            <h3 style="text-align: center; color: #fbbf24; margin: 0;">⭐ Gruppe 2</h3>
            <div id="tannenbaum-canvas-container-2" style="display:flex; justify-content:center;">
                <canvas id="tannenbaum-canvas-2" width="280" height="340"></canvas>
            </div>
            <div id="tannenbaum-players-2" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
    `;

    // Spieler von Gruppe 1 links einfügen
    const pContainer1 = document.getElementById("tannenbaum-players-1");
    data.team1.forEach(p => {
        pContainer1.appendChild(createTannenbaumPlayerRow(p, 1));
    });

    // Spieler von Gruppe 2 rechts einfügen
    const pContainer2 = document.getElementById("tannenbaum-players-2");
    data.team2.forEach(p => {
        pContainer2.appendChild(createTannenbaumPlayerRow(p, 2));
    });

    // Die beiden Tannenbäume auf den Canvas-Elementen bunt zeichnen
    drawTannenbaumCanvas(1, data.team1);
    drawTannenbaumCanvas(2, data.team2);
}

function createTannenbaumPlayerRow(name, teamNum) {
    const div = document.createElement("div");
    div.className = "tannenbaum-player-row";
    const data = activeGamesData["tannenbaum"];
    
    const verlauf = (data.historie && data.historie[name]) ? data.historie[name] : [];
    const letzteWuerfe = verlauf.slice(-3).join(", ") || "-";

    // Wir fügen ein schickes, kompaktes Layout mit einem "↩️" Button hinzu
    div.innerHTML = `
        <div style="text-align:left; flex-grow: 1;">
            <div style="font-weight:bold;">${name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Letzte: ${letzteWuerfe}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
            <input type="number" min="0" max="9" class="tannenbaum-input" placeholder="Zahl" style="width: 60px;"
                onkeydown="if(event.key==='Enter'){ handleTannenbaumInput(event, '${name}'); }">
            <button onclick="undoLastTannenbaumThrow('${name}')" title="Letzten Wurf rückgängig machen" 
                style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                ↩️
            </button>
        </div>
    `;
    return div;
}

function handleTannenbaumInput(event, name) {
    event.preventDefault();
    const inputElement = event.target;
    const val = parseInt(inputElement.value);
    
    if (isNaN(val) || val < 0 || val > 9) {
        alert("Bitte nur Zahlen von 0 bis 9 eintragen!");
        inputElement.value = "";
        return;
    }

    const data = activeGamesData["tannenbaum"];
    
    // Falls es für diesen Spieler noch keine Historie gibt, erstellen wir sie kurz
    if (!data.historie) { data.historie = {}; }
    if (!data.historie[name]) { data.historie[name] = []; }

    // JEDER WURF wird sofort in der echten Historie gemerkt, egal was passiert!
    data.historie[name].push(val);

    // Ermitteln, in welchem Team der aktuelle Werfer spielt
    const isTeam1 = data.team1.includes(name);
    const eigenGruppe = isTeam1 ? data.team1 : data.team2;
    const gegnerGruppe = isTeam1 ? data.team2 : data.team1;

    // Hilfsfunktion: Zählt die Baumergebnisse für das Team
    const getTeamCounts = (gruppe) => {
        let counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0};
        gruppe.forEach(n => {
            (data.wuerfe[n] || []).forEach(w => { if(counts[w]!==undefined) counts[w]++; });
        });
        return counts;
    };

    // --- REGEL 1: PUDEL GEWORFEN (0) ---
    if (val === 0) {
        // Wir merken uns den Pudel auch im Wurf-Array des Spielers für den Rechts-Links-Wechsel
        data.wuerfe[name].push(val);

        let gegnerCounts = getTeamCounts(gegnerGruppe);
        let valideOptionen = [];
        for(let z=1; z<=9; z++) {
            if(gegnerCounts[z] < baumStruktur[z]) {
                valideOptionen.push(z);
            }
        }

        if (valideOptionen.length === 0) {
            alert(`Pudel (0) registriert! Aber der gegnerische Baum ist bereits komplett leer.`);
            inputElement.value = "";
            saveCurrentGameFields();
            renderTannenbaumSubElements();
            return;
        }

        let auswahl = prompt(`🎳 PUDEL! Du darfst eine Zahl beim Gegner MANUELL LÖSCHEN.\nWähle eine offene Zahl des Gegners:\n[ ${valideOptionen.join(", ")} ]`);
        let gewaehlteZahl = parseInt(auswahl);

        if (valideOptionen.includes(gewaehlteZahl)) {
            const zielSpielerGegner = gegnerGruppe[0];
            data.wuerfe[zielSpielerGegner].push(gewaehlteZahl);
            alert(`Zahl ${gewaehlteZahl} wurde beim Gegner weggestrichen!`);
        } else {
            alert("Ungültige Auswahl. Die manuelle Streichung verfällt!");
        }

    // --- REGEL 2: REGULÄRER WURF (1-9) ---
    } else {
        let aktuelleCounts = getTeamCounts(eigenGruppe);

        // Prüfen, ob wir diese Zahl SCHON VOR DIESEM WURF voll hatten
        if (aktuelleCounts[val] >= baumStruktur[val]) {
            // Zahl ist bei uns schon voll -> Beim Gegner ein Licht wegstreichen!
            let gegnerCounts = getTeamCounts(gegnerGruppe);
            
            if (gegnerCounts[val] < baumStruktur[val]) {
                const zielSpielerGegner = gegnerGruppe[0];
                data.wuerfe[zielSpielerGegner].push(val);
                alert(`💥 Gnadenschuss! Die ${val} hattet ihr schon voll. Dem Gegner wurde dafür ein weiteres Licht WEGGESTRICHEN! 🎄🔥`);
            } else {
                alert(`Die ${val} habt ihr schon voll. Der Gegner hat diese Zahl aber leider auch schon komplett leer, der Wurf verpufft.`);
            }
        } else {
            // Ganz normaler Treffer für das eigene Team -> fliegt in den Baum
            data.wuerfe[name].push(val);
        }
    }

    inputElement.value = ""; 
    saveCurrentGameFields(); 
    renderTannenbaumSubElements(); 
}

function renderSingleVisualTree(elementId, counts, activeClass) {
    const container = document.getElementById(elementId);
    if(!container) return;
    container.innerHTML = "";

    for (let zahl = 1; zahl <= 9; zahl++) {
        const benoetigt = baumStruktur[zahl];
        const erzielt = counts[zahl];

        const rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        rowDiv.style.gap = "3px";
        rowDiv.style.justifyContent = "center";

        for (let i = 0; i < benoetigt; i++) {
            const node = document.createElement("div");
            node.className = "tannenbaum-node";
            node.innerText = zahl;
            if (i < erzielt) {
                node.classList.add(activeClass);
            }
            rowDiv.appendChild(node);
        }
        container.appendChild(rowDiv);
    }
}

function checkTannenbaumWinner(t1Counts, t2Counts) {
    let t1Win = true, t2Win = true;
    for (let i = 1; i <= 9; i++) {
        if (t1Counts[i] < baumStruktur[i]) t1Win = false;
        if (t2Counts[i] < baumStruktur[i]) t2Win = false;
    }

    const banner = document.getElementById("tannenbaum-status-banner");
    if(!banner) return;

    if (t1Win && t2Win) {
        banner.innerText = "Unentschieden! Beide gleichzeitig fertig! 🤝";
        banner.style.backgroundColor = "var(--border)";
    } else if (t1Win) {
        banner.innerText = "🏆 Gruppe 1 gewinnt das Match! 🎉";
        banner.style.backgroundColor = "#2980b9";
    } else if (t2Win) {
        banner.innerText = "🏆 Gruppe 2 gewinnt das Match! 🎉";
        banner.style.backgroundColor = "#e67e22";
    } else {
        banner.innerText = "Spiel läuft... Bäume abwerfen! 🎳";
        banner.style.backgroundColor = "rgba(0,0,0,0.2)";
    }
}
// Rechnet die Live-Werte inklusive Multiplikatoren zusammen
function liveCalculate6TageRennen() {
    let teamScores = {};

    // 1. Einzelwerte der Spieler berechnen und dem jeweiligen Team hinzufügen
    players.forEach(p => {
        const row = document.getElementById(`row-${p}`); if(!row) return;
        const t1 = parseInt(row.querySelector(".ren-t1").value) || 0;
        const t2 = parseInt(row.querySelector(".ren-t2").value) || 0;
        const t3 = parseInt(row.querySelector(".ren-t3").value) || 0;
        const t4 = parseInt(row.querySelector(".ren-t4").value) || 0;
        const t5 = parseInt(row.querySelector(".ren-t5").value) || 0;
        const t6 = parseInt(row.querySelector(".ren-t6").value) || 0;

        const sum = t1 + (t2 * 2) + (t3 * 3) + (t4 * 4) + (t5 * 5) + (t6 * 6);
        row.querySelector(".ren-res").innerText = sum;

        const teamName = activeGamesData["rennen"][p].team;
        teamScores[teamName] = (teamScores[teamName] || 0) + sum;
    });

    // 2. Wenn eine Gast-Zeile aktiv auf dem Bildschirm ist, rechnen wir sie mit ein
    const gastRow = document.getElementById("row-rennen-Gast");
    if (gastRow) {
        const t1 = parseInt(gastRow.querySelector(".ren-g-t1").value) || 0;
        const t2 = parseInt(gastRow.querySelector(".ren-g-t2").value) || 0;
        const t3 = parseInt(gastRow.querySelector(".ren-g-t3").value) || 0;
        const t4 = parseInt(gastRow.querySelector(".ren-g-t4").value) || 0;
        const t5 = parseInt(gastRow.querySelector(".ren-g-t5").value) || 0;
        const t6 = parseInt(gastRow.querySelector(".ren-g-t6").value) || 0;

        const sum = t1 + (t2 * 2) + (t3 * 3) + (t4 * 4) + (t5 * 5) + (t6 * 6);
        gastRow.querySelector(".ren-g-res").innerText = sum;

        const teamName = gastRow.getAttribute("data-team");
        teamScores[teamName] = (teamScores[teamName] || 0) + sum;
    }

    // 3. Die Gesamtpunktzahl in die Zellen eintragen
    for (const [team, total] of Object.entries(teamScores)) {
        const cellClass = `.team-res-${team.replace(' ', '')}`;
        document.querySelectorAll(cellClass).forEach(cell => {
            cell.innerText = total + " Holz";
        });
    }
}
// Wird aufgerufen, wenn ein Spieler im Dropdown ein neues Team wählt
function changeRennenTeam(playerName, newTeamName) {
    if (activeGamesData["rennen"] && activeGamesData["rennen"][playerName]) {
        activeGamesData["rennen"][playerName].team = newTeamName;
        saveCurrentGameFields();   // Zwischenstand im LocalStorage sichern
        updateCurrentGameTable();  // Tabelle neu aufbauen (sortiert die Zeilen sofort neu!)
    }
}
// Schaltet die Standardwerte (0 oder 9) live um, wenn ein Spieler den Modus wechselt
function updateHausnummerDefaultValues(playerName) {
    const row = document.getElementById(`row-${playerName}`);
    if (!row) return;

    const mode = row.querySelector(".hn-mode").value;
    const w1Input = row.querySelector(".hn-w1");
    const w2Input = row.querySelector(".hn-w2");
    const w3Input = row.querySelector(".hn-w3");

    // Falls die Felder den alten Standardwert der gegnerischen Variante enthalten (oder leer sind), überschreiben wir sie passend
    if (mode === "klein") {
        if (w1Input.value == "0" || w1Input.value === "") w1Input.value = 9;
        if (w2Input.value == "0" || w2Input.value === "") w2Input.value = 9;
        if (w3Input.value == "0" || w3Input.value === "") w3Input.value = 9;
    } else {
        if (w1Input.value == "9" || w1Input.value === "") w1Input.value = 0;
        if (w2Input.value == "9" || w2Input.value === "") w2Input.value = 0;
        if (w3Input.value == "9" || w3Input.value === "") w3Input.value = 0;
    }
}
// Wechselt die Teamzugehörigkeit eines Spielers beim Tannenbaum live
function renderTannenbaumSubElements() {
    const board = document.getElementById("tannenbaum-game-board");
    if (!board) return;

    const data = activeGamesData["tannenbaum"];

    // 1. Spielfeld mit zwei Spalten (Links für Gruppe 1, Rechts für Gruppe 2) aufbauen
    board.innerHTML = `
        <!-- LINKER BAUM & SPIELER (GRUPPE 1) -->
        <div id="tannenbaum-col-1" style="display: flex; flex-direction: column; gap: 15px; background: rgba(59, 130, 246, 0.02); padding: 15px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.1);">
            <h3 style="text-align: center; color: #60a5fa; margin: 0;">🎄 Gruppe 1</h3>
            <div id="tannenbaum-canvas-container-1" style="display:flex; justify-content:center;">
                <canvas id="tannenbaum-canvas-1" width="280" height="340"></canvas>
            </div>
            <div id="tannenbaum-players-1" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>

        <!-- RECHTER BAUM & SPIELER (GRUPPE 2) -->
        <div id="tannenbaum-col-2" style="display: flex; flex-direction: column; gap: 15px; background: rgba(245, 158, 11, 0.02); padding: 15px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.1);">
            <h3 style="text-align: center; color: #fbbf24; margin: 0;">⭐ Gruppe 2</h3>
            <div id="tannenbaum-canvas-container-2" style="display:flex; justify-content:center;">
                <canvas id="tannenbaum-canvas-2" width="280" height="340"></canvas>
            </div>
            <div id="tannenbaum-players-2" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
    `;

    // 2. Spieler von Gruppe 1 links einfügen
    const pContainer1 = document.getElementById("tannenbaum-players-1");
    if (pContainer1 && data.team1) {
        data.team1.forEach(p => {
            pContainer1.appendChild(createTannenbaumPlayerRow(p, 1));
        });
    }

    // 3. Spieler von Gruppe 2 rechts einfügen
    const pContainer2 = document.getElementById("tannenbaum-players-2");
    if (pContainer2 && data.team2) {
        data.team2.forEach(p => {
            pContainer2.appendChild(createTannenbaumPlayerRow(p, 2));
        });
    }

    // 4. TRICK: Dem Browser ein paar Millisekunden Zeit geben, das HTML zu verarbeiten,
    // damit die IDs "tannenbaum-canvas-1" und "-2" existieren, bevor gezeichnet wird!
    setTimeout(() => {
        drawTannenbaumCanvas(1, data.team1 || []);
        drawTannenbaumCanvas(2, data.team2 || []);
    }, 50);
}
function drawTannenbaumCanvas(teamNum, teamPlayers) {
    // 1. Richtige Canvas-ID anvisieren
    const canvas = document.getElementById(`tannenbaum-canvas-${teamNum}`);
    if (!canvas) {
        console.error(`Tannenbaum-Canvas für Team ${teamNum} wurde im DOM nicht gefunden!`);
        return; 
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas komplett leeren für den sauberen Neuaufbau
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = activeGamesData["tannenbaum"];
    if (!data || !data.wuerfe) return;

    // 2. Alle Würfe des GESAMTEN TEAMS für dieses Baumsammeln zusammenrechnen
    let teamCounts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0};
    
    if (teamPlayers && teamPlayers.length > 0) {
        teamPlayers.forEach(p => {
            const spielerWuerfe = data.wuerfe[p] || [];
            spielerWuerfe.forEach(w => {
                if (teamCounts[w] !== undefined) {
                    teamCounts[w]++;
                }
            });
        });
    }

    // Farbe festlegen: Gruppe 1 = Blau/Grün, Gruppe 2 = Orange/Gelb
    const activeColor = teamNum === 1 ? "#3b82f6" : "#f59e0b";
    const strikeColor = "#1e293b"; // Dunkles Grau/Schwarz für "WEGGESTRICHENE" (getroffene) Zahlen
    const textMuted   = "#64748b";

    // Struktur-Vorgabe (Zahl -> Wie oft muss sie getroffen werden)
    const baumStruktur = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1 };
    
    // Y-Koordinaten für die Etagen der Pyramide (1 ganz oben, 9 ganz unten)
    const yPositions = {
        1: 40,  2: 75,  3: 110,
        4: 145, 5: 180, 6: 215,
        7: 250, 8: 285, 9: 320
    };

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 3. Jede Etage des Tannenbaums sauber auf die Leinwand zeichnen
    for (let z = 1; z <= 9; z++) {
        const y = yPositions[z];
        const benoetigt = baumStruktur[z];
        const getroffen = teamCounts[z] || 0;

        // Ist die Zahl komplett abgeräumt? (Treffer >= Benötigt)
        const istKomplettWeg = getroffen >= benoetigt;

        // Abstand zwischen den Kreisen auf dieser Etage
        const spacing = 35;
        // Start-X berechnen, damit die Reihe exakt mittig sitzt
        const startX = (canvas.width / 2) - ((benoetigt - 1) * spacing / 2);

        for (let i = 0; i < benoetigt; i++) {
            const x = startX + (i * spacing);

            ctx.beginPath();
            ctx.arc(x, y, 14, 0, 2 * Math.PI);

            if (i < getroffen) {
                // LICHT IST AUS / WEGGESTRICHEN (Treffer gelandet)
                ctx.fillStyle = strikeColor;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgba(255,255,255,0.05)";
                ctx.stroke();

                // Zahl durchgestrichen anzeigen
                ctx.font = "bold 12px sans-serif";
                ctx.fillStyle = textMuted;
                ctx.fillText(z, x, y);
                
                // Ein kleines "X" über den Kreis zeichnen als visuelles Löschzeichen
                ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; // Leichtes Rot fürs Streichen
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8);
                ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8);
                ctx.stroke();
            } else {
                // LICHT BRENNT NOCH (Zahl muss noch getroffen werden!)
                ctx.fillStyle = "rgba(30, 41, 59, 0.5)";
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = activeColor;
                ctx.stroke();

                // Zahl leuchtend anzeigen
                ctx.font = "bold 14px sans-serif";
                ctx.fillStyle = "#ffffff";
                ctx.fillText(z, x, y);
            }
        }
    }
}
function undoLastTannenbaumThrow(playerName) {
    const data = activeGamesData["tannenbaum"];
    if (!data) return;

    // 1. Prüfen, ob der Spieler überhaupt schon geworfen hat
    const spielerHistorie = data.historie ? data.historie[playerName] : [];
    if (!spielerHistorie || spielerHistorie.length === 0) {
        alert(`Für ${playerName} gibt es keinen Wurf zum Rückgängig machen!`);
        return;
    }

    // Bestätigung für die Bahn (optional, verhindert versehentliches Klicken)
    if (!confirm(`Möchtest du den letzten Wurf von ${playerName} wirklich löschen?`)) {
        return;
    }

    // 2. Den letzten Wurf aus der echten Historie entfernen
    const geloeschterWurf = spielerHistorie.pop();

    // 3. Den Wurf aus den aktiven Spielwürfen entfernen
    // Falls es ein regulärer Treffer war, liegt er im eigenen Array
    if (data.wuerfe[playerName] && data.wuerfe[playerName].includes(geloeschterWurf)) {
        // Wir entfernen nur das LETZTE Vorkommen dieser Zahl beim Spieler
        const index = data.wuerfe[playerName].lastIndexOf(geloeschterWurf);
        if (index !== -1) {
            data.wuerfe[playerName].splice(index, 1);
        }
    } else {
        // Falls der Wurf beim GEGNER gelandet ist (weil die Zahl schon voll war oder ein Pudel vorlag),
        // müssen wir ihn dort aus dem Array fischen.
        const isTeam1 = data.team1.includes(playerName);
        const gegnerGruppe = isTeam1 ? data.team2 : data.team1;
        const zielSpielerGegner = gegnerGruppe[0]; // Das ist der Standard-Empfänger für Strafen

        if (data.wuerfe[zielSpielerGegner]) {
            const indexGegner = data.wuerfe[zielSpielerGegner].lastIndexOf(geloeschterWurf);
            if (indexGegner !== -1) {
                data.wuerfe[zielSpielerGegner].splice(indexGegner, 1);
            }
        }
    }

    // 4. Alles wegsichern und die Oberfläche live aktualisieren
    saveCurrentGameFields();
    renderTannenbaumSubElements();
}