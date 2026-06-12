// --- MENSCH ÄRGERE DICH NICHT ---
const MENSCH_AERGERE_KEY = "aergere-dich-nicht";

function getMenschAergereData() {
    activeGamesData[MENSCH_AERGERE_KEY] = activeGamesData[MENSCH_AERGERE_KEY] || {};
    const data = activeGamesData[MENSCH_AERGERE_KEY];

    data.meta = data.meta || {
        target: 31,
        winner: "",
        finished: false,
        message: "",
        events: []
    };
    data.meta.events = data.meta.events || [];

    players.forEach(player => {
        data[player] = data[player] || {
            score: 0,
            throws: [],
            knockedOutBy: "",
            status: ""
        };
    });

    // KORREKTUR: "isBooked" darf nicht gelöscht werden!
    Object.keys(data).forEach(key => {
        if (key !== "meta" && key !== "isBooked" && !players.includes(key)) {
            delete data[key];
        }
    });

    return data;
}

function renderMenschAergereDichNichtGame(tableResponsive) {
    const data = getMenschAergereData();
    const target = parseInt(data.meta.target, 10) || 31;

    tableResponsive.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:14px;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <label for="madn-target" style="font-weight:bold;">Zielmarke</label>
                <select id="madn-target" onchange="setMenschAergereTarget(this.value)" style="min-width:90px;">
                    <option value="31" ${target === 31 ? "selected" : ""}>31</option>
                    <option value="41" ${target === 41 ? "selected" : ""}>41</option>
                    <option value="51" ${target === 51 ? "selected" : ""}>51</option>
                </select>
            </div>
            <div id="madn-game-status" style="font-weight:bold; color:var(--accent);">
                ${data.meta.message || `Ziel: genau ${target} Punkte`}
            </div>
        </div>
        <table>
            <thead>
                <tr id="game-thead-row">
                    <th style="width:60px; text-align:center;">Platz</th>
                    <th>Name</th>
                    <th>Wurf</th>
                    <th>Verlauf</th>
                    <th style="text-align:right;">Punkte</th>
                    <th>Status</th>
                    <th>Aktion</th>
                </tr>
            </thead>
            <tbody id="game-tbody"></tbody>
        </table>
    `;

    const tbody = document.getElementById("game-tbody");
    tbody.innerHTML = "";

    players.forEach((player, index) => {
        const playerData = data[player];
        const history = playerData.throws.length ? playerData.throws.join(", ") : "-";

        tbody.innerHTML += `
            <tr id="row-${player}">
                <td class="madn-rank" style="text-align:center; font-weight:bold;">-</td>
                <td><strong>${player}</strong></td>
                <td>
                    <input
                        type="number"
                        class="madn-throw input-klein"
                        min="0"
                        max="9"
                        placeholder="0-9"
                        onkeydown="handleMenschAergereThrowKey(event, ${index})"
                        ${data.meta.finished ? "disabled" : ""}
                    >
                </td>
                <td class="madn-history" style="color:var(--text-muted); min-width:130px;">${history}</td>
                <td class="madn-score final-score" style="font-weight:bold; color:var(--accent); text-align:right;">${playerData.score || 0}</td>
                <td class="madn-status">${getMenschAergerePlayerStatus(player, playerData)}</td>
                <td>
                    <button class="btn btn-info" onclick="addMenschAergereDichNichtThrow(${index})" ${data.meta.finished ? "disabled" : ""}>Eintragen</button>
                    <button class="btn-reset" onclick="undoMenschAergereDichNichtThrow(${index})">Zurück</button>
                </td>
            </tr>
        `;
    });

    updateMenschAergereDichNichtRanks();
    updateBookedButtonStatus();
}

function getMenschAergerePlayerStatus(player, playerData) {
    const data = getMenschAergereData();

    if (data.meta.winner === player) {
        return "<span style='color:#22c55e; font-weight:bold;'>Gewonnen</span>";
    }
    if (playerData.knockedOutBy) {
        return `<span style='color:#ef4444;'>Rausgeworfen von ${playerData.knockedOutBy}</span>`;
    }
    if (playerData.status) {
        return playerData.status;
    }
    if ((playerData.score || 0) === 0) {
        return "<span style='color:var(--text-muted);'>Start</span>";
    }
    return "<span style='color:var(--text-muted);'>Im Spiel</span>";
}

function handleMenschAergereThrowKey(event, playerIndex) {
    if (event.key === "Enter") {
        event.preventDefault();
        addMenschAergereDichNichtThrow(playerIndex);
    }
}

function addMenschAergereDichNichtThrow(playerIndex) {
    const player = players[playerIndex];
    if (!player) return;

    const row = document.getElementById(`row-${player}`);
    const input = row ? row.querySelector(".madn-throw") : null;
    const throwValue = input ? parseInt(input.value, 10) : NaN;

    if (Number.isNaN(throwValue) || throwValue < 0 || throwValue > 9) {
        alert("Bitte eine Holzzahl von 0 bis 9 eintragen.");
        if (input) input.value = "";
        return;
    }

    const data = getMenschAergereData();
    if (data.meta.finished) return;

    const target = parseInt(data.meta.target, 10) || 31;
    const playerData = data[player];
    const nextScore = (parseInt(playerData.score, 10) || 0) + throwValue;

    playerData.throws.push(throwValue);
    playerData.knockedOutBy = "";
    data.meta.events.push({ player, value: throwValue });

    if (nextScore > target) {
        playerData.status = `<span style='color:#f59e0b;'>${throwValue}  erreicht !</span>`;
        //data.meta.message = `${player} braucht exakt ${target - playerData.score} Holz.`;
        data.meta.winner = player;
        data.meta.finished = true;
        playerData.score = nextScore;
        data.meta.message = `${player} erreicht ${target} Punkte und gewinnt!`;
    } else {
        playerData.score = nextScore;
        playerData.status = throwValue === 6
            ? "<span style='color:#22c55e;'>6 geworfen: Extra-Wurf</span>"
            : "";

        if (playerData.score === target) {
            data.meta.winner = player;
            data.meta.finished = true;
            data.meta.message = `${player} erreicht genau ${target} Punkte und gewinnt!`;
        } else {
            const knockedPlayers = knockOutMenschAergerePlayers(player);
            if (knockedPlayers.length > 0) {
                data.meta.message = `${player} wirft ${knockedPlayers.join(", ")} raus.`;
            } else if (throwValue === 6) {
                data.meta.message = `${player} hat eine 6 geworfen und darf sofort noch einmal.`;
            } else {
                data.meta.message = `${player} steht jetzt bei ${playerData.score} Punkten.`;
            }
        }
    }

    saveMenschAergereDichNichtFields();
    renderMenschAergereDichNichtGame(document.querySelector(".table-responsive"));

    const currentRow = document.getElementById(`row-${player}`);
    const nextInput = currentRow ? currentRow.querySelector(".madn-throw") : null;
    if (nextInput && throwValue === 6 && !data.meta.finished) {
        nextInput.focus();
    } else {
        focusNextMenschAergereInput(playerIndex);
    }
}

function knockOutMenschAergerePlayers(activePlayer) {
    const data = getMenschAergereData();
    const activeScore = parseInt(data[activePlayer].score, 10) || 0;
    const knockedPlayers = [];

    if (activeScore <= 0) return knockedPlayers;

    players.forEach(player => {
        if (player === activePlayer) return;
        if ((parseInt(data[player].score, 10) || 0) === activeScore) {
            data[player].score = 0;
            data[player].knockedOutBy = activePlayer;
            data[player].status = "";
            knockedPlayers.push(player);
        }
    });

    return knockedPlayers;
}

function undoMenschAergereDichNichtThrow(playerIndex) {
    const player = players[playerIndex];
    if (!player) return;

    const data = getMenschAergereData();
    const playerData = data[player];
    if (!playerData.throws.length) {
        alert(`Für ${player} gibt es keinen Wurf zum Zurücknehmen.`);
        return;
    }

    playerData.throws.pop();
    for (let i = data.meta.events.length - 1; i >= 0; i--) {
        if (data.meta.events[i].player === player) {
            data.meta.events.splice(i, 1);
            break;
        }
    }
    rebuildMenschAergereDichNichtScores();
    saveMenschAergereDichNichtFields();
    renderMenschAergereDichNichtGame(document.querySelector(".table-responsive"));
}

function rebuildMenschAergereDichNichtScores() {
    const data = getMenschAergereData();
    const target = parseInt(data.meta.target, 10) || 31;
    const histories = {};
    const events = data.meta.events.length
        ? [...data.meta.events]
        : players.flatMap(player => (data[player].throws || []).map(value => ({ player, value })));

    players.forEach(player => {
        histories[player] = [...(data[player].throws || [])];
        data[player].throws = [];
        data[player].score = 0;
        data[player].knockedOutBy = "";
        data[player].status = "";
    });

    data.meta.winner = "";
    data.meta.finished = false;
    data.meta.message = `Ziel: genau ${target} Punkte`;

    for (const event of events) {
        const player = event.player;
        const throwValue = parseInt(event.value, 10) || 0;
        if (!players.includes(player) || data.meta.finished) continue;

        const playerData = data[player];
        playerData.throws.push(throwValue);
        const nextScore = (parseInt(playerData.score, 10) || 0) + throwValue;

        if (nextScore > target) {
            playerData.status = `<span style='color:#f59e0b;'>${throwValue} erreicht und mehr ! </span>`;
            data.meta.winner = player;
            data.meta.finished = true;
            data.meta.message = `${player} erreicht und mehr ! ${target} Punkte und gewinnt!`;
            continue;
        }

        playerData.score = nextScore;
        if (playerData.score === target) {
            data.meta.winner = player;
            data.meta.finished = true;
            data.meta.message = `${player} erreicht genau ! ${target} Punkte und gewinnt!`;
            continue;
        }

        knockOutMenschAergerePlayers(player);
    }

    data.meta.events = events.filter(event => players.includes(event.player));
}

function focusNextMenschAergereInput(playerIndex) {
    const nextIndex = (playerIndex + 1) % Math.max(players.length, 1);
    const nextPlayer = players[nextIndex];
    const nextRow = nextPlayer ? document.getElementById(`row-${nextPlayer}`) : null;
    const nextInput = nextRow ? nextRow.querySelector(".madn-throw") : null;

    if (nextInput && !nextInput.disabled) {
        nextInput.focus();
    }
}

function setMenschAergereTarget(value) {
    const data = getMenschAergereData();
    data.meta.target = parseInt(value, 10) || 31;
    rebuildMenschAergereDichNichtScores();
    saveMenschAergereDichNichtFields();
    renderMenschAergereDichNichtGame(document.querySelector(".table-responsive"));
}

function saveMenschAergereDichNichtFields() {
    const data = getMenschAergereData();
    const targetSelect = document.getElementById("madn-target");

    if (targetSelect) {
        data.meta.target = parseInt(targetSelect.value, 10) || 31;
    }

    localStorage.setItem("kegel_active_games_data", JSON.stringify(activeGamesData));
}

function updateMenschAergereDichNichtRanks() {
    const data = getMenschAergereData();
    const results = players.map(player => ({
        player,
        score: parseInt(data[player].score, 10) || 0
    })).sort((a, b) => b.score - a.score);

    let currentRank = 1;
    results.forEach((result, index) => {
        const row = document.getElementById(`row-${result.player}`);
        const rankCell = row ? row.querySelector(".madn-rank") : null;
        if (!rankCell) return;

        if (result.score === 0) {
            rankCell.innerText = "-";
            return;
        }

        if (index > 0 && result.score === results[index - 1].score) {
            // gleicher Rang
        } else {
            currentRank = index + 1;
        }

        if (currentRank === 1) rankCell.innerHTML = "🥇";
        else if (currentRank === 2) rankCell.innerHTML = "🥈";
        else if (currentRank === 3) rankCell.innerHTML = "🥉";
        else rankCell.innerText = `${currentRank}.`;
    });
}

function calculateMenschAergereDichNichtGame() {
    const data = getMenschAergereData();

    if (!data.meta.winner) {
        alert("Noch kein Gewinner: Das Spiel endet erst bei einer exakten Punktlandung.");
        return;
    }

    // Spieler sortieren: Meiste Punkte (Gewinner) ganz oben (Index 0)
    const results = players.map(player => ({
        name: player,
        score: parseInt(data[player].score, 10) || 0,
        row: document.getElementById(`row-${player}`)
    })).sort((a, b) => b.score - a.score);

    results.forEach(result => {
        if (result.row) result.row.className = "";
    });

    // NEU: Dynamische Punkteverteilung von unten nach oben
    // Letzter Platz = 1 Punkt, Vorletzter = 2 Punkte, etc.
    const totalPlayers = results.length;
    
    results.forEach((result, index) => {
        // Formel: Gesamtanzahl der Spieler minus aktueller Index
        // Beispiel bei 4 Spielern: 
        // Index 0 (Erster):   4 - 0 = 4 Punkte
        // Index 1 (Zweiter):  4 - 1 = 3 Punkte
        // Index 2 (Dritter):  4 - 2 = 2 Punkte
        // Index 3 (Letzter):  4 - 3 = 1 Punkt
        const pointsAwarded = totalPlayers - index;
        
        grandTotalScores[result.name] += pointsAwarded;

        // Visuelle Klassen für die Zeilen setzen
        if (index === 0) {
            if (result.row) result.row.classList.add("winner-row");
        } else if (index === totalPlayers - 1 && totalPlayers > 1) {
            if (result.row) result.row.classList.add("loser-row");
        }
    });

    // Status auf gebucht setzen und speichern
    activeGamesData[currentGame].isBooked = true; //
    saveMenschAergereDichNichtFields(); //

    updateGrandTotalTable(); //
    updateBookedButtonStatus(); //

    alert(`🎉 ${data.meta.winner} gewinnt Mensch ärgere dich nicht und alle Platzierungspunkte wurden gebucht!`); //
}
