// --- SPIEL-RECHNER & LOGIK ---

function updateCurrentGameTable() {
    const thRow = document.getElementById("th-row");
    const tbody = document.getElementById("game-tbody");
    const oldSub = document.getElementById("th-sub-row"); 
    if(oldSub) oldSub.remove();    
    
    thRow.innerHTML = ""; tbody.innerHTML = "";
    if (players.length === 0) {
        tbody.innerHTML = "<tr><td colspan='10'>Keine aktiven Spieler vorhanden.</td></tr>";
        return;
    }

    if (currentGame === "hausnummer") {
        thRow.innerHTML = `
            <th rowspan="2">Name</th>
            <th colspan="5" class="header-highlight-1">🏠 GROSSE HAUSNUMMER</th>
            <th colspan="5" class="header-highlight-2 border-left-divider">🏠 KLEINE HAUSNUMMER</th>
        `;
        const subHeader = document.createElement("tr");
        subHeader.id = "th-sub-row";
        subHeader.innerHTML = `
            <th class="header-highlight-1">W1</th><th class="header-highlight-1">W2</th><th class="header-highlight-1">W3</th><th class="header-highlight-1">Erg.</th><th class="header-highlight-1">Pl.</th>
            <th class="header-highlight-2 border-left-divider">W1</th><th class="header-highlight-2">W2</th><th class="header-highlight-2">W3</th><th class="header-highlight-2">Erg.</th><th class="header-highlight-2">Pl.</th>
        `;
        thRow.parentNode.appendChild(subHeader);

        players.forEach(p => {
            const d = activeGamesData.hausnummer[p] || {g1:0, g2:0, g3:0, k1:0, k2:0, k3:0};
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td><strong>${p}</strong></td>
                    <td><input type="number" class="g-w1" min="0" max="9" value="${d.g1}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="g-w2" min="0" max="9" value="${d.g2}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="g-w3" min="0" max="9" value="${d.g3}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td class="g-res" style="font-weight:bold; color:var(--accent);">0</td>
                    <td class="g-rank" style="font-weight:bold;">-</td>
                    
                    <td class="border-left-divider"><input type="number" class="k-w1" min="0" max="9" value="${d.k1}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="k-w2" min="0" max="9" value="${d.k2}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="k-w3" min="0" max="9" value="${d.k3}" oninput="liveCalculateHausnummer(); saveCurrentGameFields();"></td>
                    <td class="k-res" style="font-weight:bold; color:#f59e0b;">0</td>
                    <td class="k-rank" style="font-weight:bold;">-</td>
                </tr>`;
        });
        liveCalculateHausnummer();
    }

    else if (currentGame === "siebzehn-vier") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>W1</th><th>W2</th><th>W3</th><th>W4</th><th>W5</th><th>Gesamt</th><th>Überkauft?</th>";
        players.forEach(p => {
            const d = activeGamesData["siebzehn-vier"][p] || {w1:0, w2:0, w3:0, w4:0, w5:0, over: false};
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td><strong>${p}</strong></td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="sv-w1" min="0" max="9" value="${d.w1}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-w2" min="0" max="9" value="${d.w2}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-w3" min="0" max="9" value="${d.w3}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-w4" min="0" max="9" value="${d.w4}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td><input type="number" class="sv-w5" min="0" max="9" value="${d.w5}" oninput="liveCalculate17und4(); saveCurrentGameFields();"></td>
                    <td class="sv-res" style="font-weight:bold; color:var(--accent);">0</td>
                    <td><input type="checkbox" class="val-over" ${d.over ? 'checked' : ''} onchange="liveCalculate17und4(); saveCurrentGameFields();"> Ja</td>
                </tr>`;
        });
        liveCalculate17und4(); // Direkt beim Laden einmal durchrechnen
    }

    else if (currentGame === "rennen") {
        thRow.innerHTML = "<th>Name</th><th>Platz</th><th>T1</th><th>T2(x2)</th><th>T3(x3)</th><th>T4(x4)</th><th>T5(x5)</th><th>T6(x6)</th><th>Gesamt</th>";
        players.forEach(p => {
            const d = activeGamesData.rennen[p] || {t1:0, t2:0, t3:0, t4:0, t5:0, t6:0};
            tbody.innerHTML += `
                <tr id="row-${p}">
                    <td>${p}</td>
                    <td class="rank-col">-</td>
                    <td><input type="number" class="r-t1" value="${d.t1}" oninput="saveCurrentGameFields()"></td>
                    <td><input type="number" class="r-t2" value="${d.t2}" oninput="saveCurrentGameFields()"></td>
                    <td><input type="number" class="r-t3" value="${d.t3}" oninput="saveCurrentGameFields()"></td>
                    <td><input type="number" class="r-t4" value="${d.t4}" oninput="saveCurrentGameFields()"></td>
                    <td><input type="number" class="r-t5" value="${d.t5}" oninput="saveCurrentGameFields()"></td>
                    <td><input type="number" class="r-t6" value="${d.t6}" oninput="saveCurrentGameFields()"></td>
                    <td class="val-total-rennen" style="font-weight:bold;">0</td>
                </tr>`;
        });
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
}

function resetCurrentGame() {
    if (confirm("Werte für dieses Spiel wirklich löschen und zurücksetzen?")) {
        activeGamesData[currentGame] = {}; 
        localStorage.setItem("kegel_active_games_data", JSON.stringify(activeGamesData));
        updateCurrentGameTable();
    }
}

function liveCalculateHausnummer() {
    let großResults = []; let kleinResults = [];
    players.forEach(p => {
        const row = document.getElementById(`row-${p}`); if(!row) return;
        row.className = "";
        const g1 = row.querySelector(".g-w1").value;
        const g2 = row.querySelector(".g-w2").value;
        const g3 = row.querySelector(".g-w3").value;
        let gNum = parseInt("" + g1 + g2 + g3) || 0;
        row.querySelector(".g-res").innerText = gNum;
        großResults.push({ name: p, val: gNum, element: row.querySelector(".g-rank") });

        const k1 = row.querySelector(".k-w1").value;
        const k2 = row.querySelector(".k-w2").value;
        const k3 = row.querySelector(".k-w3").value;
        let kNum = parseInt("" + k1 + k2 + k3) || 0;
        row.querySelector(".k-res").innerText = kNum;
        kleinResults.push({ name: p, val: kNum, element: row.querySelector(".k-rank") });
    });

    großResults.sort((a,b) => b.val - a.val);
    kleinResults.sort((a,b) => a.val - b.val);

    [großResults, kleinResults].forEach((list) => {
        list.forEach((item, index) => {
            const rank = index + 1;
            if (rank === 1 && item.val > 0) item.element.innerHTML = `<span class="rank-badge rank-1">🥇 1</span>`;
            else if (rank === 2 && item.val > 0) item.element.innerHTML = `<span class="rank-badge rank-2">🥈 2</span>`;
            else if (rank === 3 && item.val > 0) item.element.innerHTML = `<span class="rank-badge rank-3">🥉 3</span>`;
            else item.element.innerHTML = `<span class="rank-badge">${rank}</span>`;
        });
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
                score = (parseInt(row.querySelector(".r-t1").value) || 0) + (parseInt(row.querySelector(".r-t2").value) || 0)*2 + (parseInt(row.querySelector(".r-t3").value) || 0)*3 + (parseInt(row.querySelector(".r-t4").value) || 0)*4 + (parseInt(row.querySelector(".r-t5").value) || 0)*5 + (parseInt(row.querySelector(".r-t6").value) || 0)*6;
                row.querySelector(".val-total-rennen").innerText = score;
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
        const isOver = row.querySelector(".val-over").checked;

        let sum = w1 + w2 + w3 + w4 + w5;
        
        // Automatisch Haken setzen, wenn über 21 gekegelt wurde
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