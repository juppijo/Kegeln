// Globale Zustände der App
let players = ["Michael", "Hilde", "Peter", "Brigitte", "Elke", "Gerhard", "Helga", "Birgit", "Jo", "Svenja", "Marius"];
let activeGames = [];
let selectedGameIndex = null;

// Tannenbaum spezifische Datenstrukturen
const spielerGruppe1 = ["Michael", "Hilde", "Peter", "Brigitte", "Elke"];
const spielerGruppe2 = ["Gerhard", "Helga", "Birgit", "Jo", "Svenja", "Marius"];
const baumStruktur = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1 };
let tannenbaumWurfDaten = {};
let merkFokusName = null;

// Tab-Umschaltung
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-nav-btn, .nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabName === 'tannenbaum') {
        initTannenbaum();
    }
}

// Spieler-Management (Tab 1)
function renderPlayers() {
    const list = document.getElementById('player-list');
    if(!list) return;
    list.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        li.innerHTML = `<span>${player}</span><button class="btn btn-danger" onclick="deletePlayer(${index})">❌</button>`;
        list.appendChild(li);
    });
}

function addPlayer() {
    const input = document.getElementById('new-player-name');
    const name = input.value.trim();
    if(name) {
        players.push(name);
        input.value = '';
        renderPlayers();
    }
}

function deletePlayer(index) {
    players.splice(index, 1);
    renderPlayers();
}

// Spiele-Management (Tab 1 & Tab 2)
function startNewGame() {
    const gameType = document.getElementById('game-selector').value;
    if(players.length === 0) {
        alert("Bitte füge zuerst Spieler hinzu!");
        return;
    }
    
    const newGame = {
        type: gameType,
        round: 1,
        scores: {}
    };
    players.forEach(p => { newGame.scores[p] = []; });
    
    activeGames.push(newGame);
    selectedGameIndex = activeGames.length - 1;
    
    renderActiveGamesList();
    showGamePlay();
    // Automatisch zum Spiele-Tab wechseln
    const gamesBtn = document.querySelectorAll('.nav-btn')[1];
    if(gamesBtn) gamesBtn.click();
}

function renderActiveGamesList() {
    const container = document.getElementById('active-games-container');
    if(!container) return;
    container.innerHTML = '';
    
    if(activeGames.length === 0) {
        container.innerHTML = '<p class="placeholder">Keine aktiven Spiele.</p>';
        return;
    }
    
    activeGames.forEach((game, index) => {
        const div = document.createElement('div');
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid #ccc';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        
        div.innerHTML = `
            <span><b>${game.type}</b> (Runde ${game.round})</span>
            <button class="btn btn-primary" onclick="selectGame(${index})">Öffnen</button>
        `;
        container.appendChild(div);
    });
}

function selectGame(index) {
    selectedGameIndex = index;
    showGamePlay();
    const gamesBtn = document.querySelectorAll('.nav-btn')[1];
    if(gamesBtn) gamesBtn.click();
}

function showGamePlay() {
    const placeholder = document.getElementById('no-game-placeholder');
    const area = document.getElementById('game-play-area');
    const title = document.getElementById('current-game-title');
    
    if(selectedGameIndex === null || !activeGames[selectedGameIndex]) {
        placeholder.style.display = 'block';
        area.style.display = 'none';
        title.innerText = 'Kein Spiel aktiv';
        return;
    }
    
    placeholder.style.display = 'none';
    area.style.display = 'block';
    
    const game = activeGames[selectedGameIndex];
    title.innerText = game.type;
    document.getElementById('current-round-display').innerText = `Runde ${game.round}`;
    
    const tbody = document.getElementById('game-table-body');
    tbody.innerHTML = '';
    
    Object.keys(game.scores).forEach(player => {
        const tr = document.createElement('tr');
        const total = game.scores[player].reduce((a,b) => a+b, 0);
        
        tr.innerHTML = `
            <td><b>${player}</b></td>
            <td>
                <input type="number" class="score-input" placeholder="Wurf" onkeydown="saveScore(event, '${player}')">
                <span style="margin-left: 15px; color:#7f8c8d;">Verlauf: ${game.scores[player].join(', ')}</span>
            </td>
            <td><b>${total}</b></td>
        `;
        tbody.appendChild(tr);
    });
}

function saveScore(event, player) {
    if(event.key === 'Enter') {
        const val = parseInt(event.target.value);
        if(!isNaN(val)) {
            const game = activeGames[selectedGameIndex];
            game.scores[player].push(val);
            
            // Prüfen ob alle Spieler in dieser Runde geworfen haben, um Runde zu erhöhen
            const allHaveN = Object.values(game.scores).every(arr => arr.length >= game.round);
            if(allHaveN) {
                game.round++;
            }
            
            showGamePlay();
            renderActiveGamesList();
        }
    }
}

function deleteCurrentGame() {
    if(selectedGameIndex !== null) {
        activeGames.splice(selectedGameIndex, 1);
        selectedGameIndex = activeGames.length > 0 ? 0 : null;
        showGamePlay();
        renderActiveGamesList();
    }
}

// ==========================================================================
// TANNENBAUM LOGIK
// ==========================================================================
function initTannenbaum() {
    if (Object.keys(tannenbaumWurfDaten).length === 0) {
        [...spielerGruppe1, ...spielerGruppe2].forEach(name => {
            tannenbaumWurfDaten[name] = [];
        });
    }
    baeumeBerechnenUndRendern();
    tannenbaumSpielerListenRendern();
}

function tannenbaumSpielerListenRendern() {
    const t1Container = document.getElementById('team1-players');
    const t2Container = document.getElementById('team2-players');
    if(!t1Container || !t2Container) return;

    t1Container.innerHTML = '';
    spielerGruppe1.forEach(name => {
        t1Container.appendChild(erstelleTannenbaumSpielerZeile(name, 1));
    });

    t2Container.innerHTML = '';
    spielerGruppe2.forEach(name => {
        t2Container.appendChild(erstelleTannenbaumSpielerZeile(name, 2));
    });
    
    if (merkFokusName) {
        setTimeout(() => {
            const input = document.getElementById(`input-${merkFokusName}`);
            if (input) {
                input.focus();
                input.select();
            }
        }, 10);
    }
}

function erstelleTannenbaumSpielerZeile(name, teamNum) {
    const div = document.createElement('div');
    div.className = 'player-row';
    const letzteWuerfe = tannenbaumWurfDaten[name].slice(-4).join(', ') || '-';

    div.innerHTML = `
        <div>
            <span class="player-name">${name}</span>
            <div style="font-size: 0.8rem; color: #95a5a6; margin-top:2px;">Letzte: ${letzteWuerfe}</div>
        </div>
        <div>
            <input type="number" min="1" max="9" class="wurf-input" 
                id="input-${name}" 
                placeholder="Zahl" 
                onkeydown="tannenbaumWurfEingetragen(event, '${name}', ${teamNum})">
        </div>
    `;
    return div;
}

function tannenbaumWurfEingetragen(event, name, teamNum) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        const val = parseInt(event.target.value);
        if (!isNaN(val) && val >= 1 && val <= 9) {
            tannenbaumWurfDaten[name].push(val);
            merkFokusName = name;
            
            baeumeBerechnenUndRendern();
            tannenbaumSpielerListenRendern();
        } else {
            alert("Bitte nur Zahlen von 1 bis 9 eintragen!");
            event.target.value = '';
        }
    }
}

function baeumeBerechnenUndRendern() {
    let team1Wuerfe = [];
    spielerGruppe1.forEach(n => { team1Wuerfe = team1Wuerfe.concat(tannenbaumWurfDaten[n] || []); });

    let team2Wuerfe = [];
    spielerGruppe2.forEach(n => { team2Wuerfe = team2Wuerfe.concat(tannenbaumWurfDaten[n] || []); });

    let t1Counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0};
    team1Wuerfe.forEach(w => { if(t1Counts[w] !== undefined) t1Counts[w]++; });

    let t2Counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0};
    team2Wuerfe.forEach(w => { if(t2Counts[w] !== undefined) t2Counts[w]++; });

    rendereEinzelnenBaum('tree-t1', t1Counts, 'active-t1');
    rendereEinzelnenBaum('tree-t2', t2Counts, 'active-t2');

    pruefeTannenbaumGewinner(t1Counts, t2Counts);
}

function rendereEinzelnenBaum(elementId, counts, activeClass) {
    const treeGrid = document.getElementById(elementId);
    if(!treeGrid) return;
    treeGrid.innerHTML = '';

    for (let zahl = 1; zahl <= 9; zahl++) {
        const benoetigt = baumStruktur[zahl];
        const erzielt = counts[zahl];

        const rowDiv = document.createElement('div');
        rowDiv.className = 'tree-row-blocks';

        for (let i = 0; i < benoetigt; i++) {
            const node = document.createElement('div');
            node.className = 'tree-node';
            node.innerText = zahl;

            if (i < erzielt) {
                node.classList.add(activeClass);
            }
            rowDiv.appendChild(node);
        }
        treeGrid.appendChild(rowDiv);
    }
}

function pruefeTannenbaumGewinner(t1Counts, t2Counts) {
    let t1Komplett = true;
    let t2Komplett = true;

    for (let zahl = 1; zahl <= 9; zahl++) {
        if (t1Counts[zahl] < baumStruktur[zahl]) t1Komplett = false;
        if (t2Counts[zahl] < baumStruktur[zahl]) t2Komplett = false;
    }

    const banner = document.getElementById('spiel-status');
    if(!banner) return;
    
    if (t1Komplett && t2Komplett) {
        banner.innerText = "Unentschieden! Beide gleichzeitig fertig! 🤝";
        banner.className = "status-banner";
    } else if (t1Komplett) {
        banner.innerText = "🏆 Gruppe 1 hat gewonnen! 🎉";
        banner.className = "status-banner winner-team1";
    } else if (t2Komplett) {
        banner.innerText = "🏆 Gruppe 2 hat gewonnen! 🎉";
        banner.className = "status-banner winner-team2";
    } else {
        banner.innerText = "Spiel läuft... 🎳";
        banner.className = "status-banner";
    }
}

function resetTannenbaum() {
    if (confirm("Möchtest du den Tannenbaum wirklich zurücksetzen? Alle Würfe werden gelöscht.")) {
        merkFokusName = null;
        tannenbaumWurfDaten = {};
        initTannenbaum();
    }
}

// App Initialisierung beim Laden
window.onload = function() {
    renderPlayers();
    renderActiveGamesList();
};