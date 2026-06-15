// ======================================================
// PLAYER MANAGEMENT
// ======================================================
// Eindeutiger ID-Generator — kein Date.now()-Duplikat bei Massen-Import

'use strict';

let _uidSeq = 0;
function genId() {
  return 'p' + Date.now() + '_' + (++_uidSeq);
}

function addPlayer(name) {
  if (!name.trim()) return;
  if (state.players.length >= MAX_PLAYERS) { showToast('Maximum 20 Spieler!', 'error'); return; }
  const id = genId();
  state.players.push({ id, name: name.trim() });
  initPlayerScores(id);
  updateFooter();
}

function initPlayerScores(id) {
  if (!state.scores.hausnummer[id]) state.scores.hausnummer[id] = { gross:{H:0,Z:0,E:0}, klein:{H:9,Z:9,E:9} };
  if (!state.scores.sv[id])         state.scores.sv[id]         = { throws:[0,0,0,0,0,0,0], karte:0 };
  if (!state.scores.rennen.days)       state.scores.rennen.days = {};
  if (!state.scores.rennen.days[id])   state.scores.rennen.days[id] = [0,0,0,0,0,0];
  if (!state.scores.schwein[id])    state.scores.schwein[id]    = { vals:[0,0,0,0,0] };
  if (!state.scores.idiot[id])      state.scores.idiot[id]      = { links:0, beine:0, rechts:0 };
  if (!state.scores.mensch[id])     state.scores.mensch[id]     = { throws:Array(10).fill(0) };
  if (!state.kegelbuch[id])         state.kegelbuch[id]         = { startgeld:false, pudel:0, stina:0 };
}

function removePlayer(id) {
  showConfirm('Spieler entfernen?', 'Alle Scores werden gelöscht!', () => {
    state.players = state.players.filter(p => p.id !== id);
    // Clean up simple per-player score objects
    for (const g in state.scores) {
      const s = state.scores[g];
      if (s && typeof s === 'object' && !Array.isArray(s)) {
        if (s[id]) delete s[id];
      }
    }
    // Clean up rennen.days specifically
    if (state.scores.rennen.days) delete state.scores.rennen.days[id];
    if (state.scores.rennen.teams) {
      state.scores.rennen.teams.forEach(t => {
        if (t.p1 === id) t.p1 = '';
        if (t.p2 === id) t.p2 = '';
      });
    }
    // Clean up group memberships
    ['g1','g2'].forEach(g => {
      if (state.scores.einsacken[g])  state.scores.einsacken[g]  = state.scores.einsacken[g].filter(x=>x!==id);
      if (state.scores.tannenbaum[g]) state.scores.tannenbaum[g] = state.scores.tannenbaum[g].filter(x=>x!==id);
    });
    if (state.scores.bus.assignments) delete state.scores.bus.assignments[id];
    delete state.kegelbuch[id];
    saveData();
    showPage('spieler');
    updateFooter();
  });
}

function renamePlayer(id) {
  const p = state.players.find(x => x.id === id);
  if (!p) return;
  showInputModal('Name ändern', p.name, val => {
    if (val.trim()) { p.name = val.trim(); saveData(); showPage('spieler'); }
  });
}

function movePlayer(id, dir) {
  const idx = state.players.findIndex(p => p.id === id);
  if (idx < 0) return;
  if (dir === 'up' && idx > 0) {
    [state.players[idx - 1], state.players[idx]] = [state.players[idx], state.players[idx - 1]];
  } else if (dir === 'down' && idx < state.players.length - 1) {
    [state.players[idx + 1], state.players[idx]] = [state.players[idx], state.players[idx + 1]];
  } else return;
  saveData();
  showPage('spieler');
}

function addPlayerFromInput() {
  const inp = document.getElementById('newPlayerName');
  if (!inp) return;
  addPlayer(inp.value);
  inp.value = '';
  saveData();
  showPage('spieler');
}

function loadPresetNames() {
  //            ["Michael", "Hilde", "Peter", "Brigitte", "Elke", "Gerhard", "Helga", "Guido", "Anette", "Birgit", "Jo", "Melissa", "Svenja", "Marius"];
  const names = ['Michael','Hilde','Peter','Brigitte','Guido','Anette','Elke','Gerhard','Helga','Birgit','Jo','Svenja','Marius','Melissa'];
  names.forEach(n => { if (!state.players.find(p => p.name === n)) addPlayer(n); });
  saveData();
  showPage('spieler');
}

function updateFooter() {
  const c = document.getElementById('playerCount');
  if (c) c.textContent = state.players.length + ' Spieler';
}

// ======================================================
// HELPERS
// ======================================================
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function s(arr) { return arr.reduce((a,b) => a + (parseFloat(b)||0), 0); }
function pname(id) { const p = state.players.find(x => x.id === id); return p ? esc(p.name) : '?'; }

// Hausnummer-Berechnungen
function grossHN(pid) {
  const hn = state.scores.hausnummer[pid] || {};
  const g  = hn.gross || { H:0, Z:0, E:0 };
  return (g.H||0)*100 + (g.Z||0)*10 + (g.E||0);
}
function kleinHN(pid) {
  const hn = state.scores.hausnummer[pid] || {};
  const k  = hn.klein || { H:0, Z:0, E:0 };
  // 0 ist ein gültiger Wurf (Kugel rollt durch ohne Treffer) und zählt als 0
  return (k.H||0)*100 + (k.Z||0)*10 + (k.E||0);
}

function rank(entries, higherBetter = true) {
  const sorted = [...entries].sort((a,b) => higherBetter ? b.total - a.total : a.total - b.total);
  let r = 1;
  return sorted.map((e,i) => {
    if (i > 0 && e.total !== sorted[i-1].total) r = i + 1;
    return {...e, rank: r};
  });
}

function medal(r) {
  if (r === 1) return '🥇';
  if (r === 2) return '🥈';
  if (r === 3) return '🥉';
  return r + '.';
}

function noPlayers() {
  return `<div class="no-players-msg">Noch keine Spieler. <a onclick="showPage('spieler')">Spieler hinzufügen</a></div>`;
}

function rulesHtml(id) {
  const rules = {
    hausnummer: `<strong>🏠 Große &amp; Kleine Hausnummer:</strong><br>
      Jeder Spieler hat <strong>3 Würfe in die Vollen</strong>. Nach jedem Wurf wird die geworfene Ziffer
      einer Stelle zugewiesen: <strong>Hunderter (H) · Zehner (Z) · Einer (E)</strong>.<br>
      <strong>Große HN:</strong> Ziel = höchste 3-stellige Zahl. Beispiel: 8, 3, 6 → 8→H, 6→Z, 3→E = <strong>863</strong>. Pudel = 0.<br>
      <strong>Kleine HN:</strong> Ziel = niedrigste 3-stellige Zahl. Beispiel: 2, 5, 1 → 1→H, 2→Z, 5→E = <strong>125</strong>.
      Eine 0 (Kugel rollt durch ohne Treffer) zählt als <strong>0</strong> — das ist kein Pudel und gibt einen Vorteil!`,
    sv: `<strong>🃏 17 und 4:</strong> Wie Blackjack mit Kegeln! Jeder Spieler hat bis zu 7 Würfe und versucht genau <strong>21</strong> zu erreichen, 
      ohne zu überschreiten. Wer 21 überschreitet, ist „über" und verliert. 
      Die „Karte" ist ein Bonuspunkt. Sieger: wer am nächsten an 21 (ohne drüber) liegt.`,
    fuchs: `<strong>🦊 Fuchsjagd — Regeln:</strong><br>
      <strong>Ziel Fuchs:</strong> Kumulative Punktzahl von <strong>31</strong> erreichen, bevor er gefangen wird.<br>
      <strong>Ablauf:</strong> Fuchs: Vorwurf Linke Hand → Vorwurf Rechte Hand → Jäger 1 → Fuchs → Jäger 2 → Fuchs → Jäger 3 → …<br>
      <strong>Fangen:</strong> Ein Jäger fängt den Fuchs, wenn er <strong>genauso viele oder mehr Kegel</strong> wirft wie der Fuchs im letzten Wurf.<br>
      <strong>Jäger gewinnen:</strong> Wenn in einem Durchgang <strong>alle Jäger</strong> den Fuchs fangen.<br>
      <strong>Fuchs gewinnt:</strong> Wenn der Fuchs <strong>31 Punkte</strong> erreicht.<br>
      Mehrere Kätsche (Spiele) werden gespielt — Siege werden gezählt.`,
    rennen: `<strong>🚀 6-Tage-Rennen (Zweier-Teams):</strong> Spieler werden in Zweier-Teams aufgeteilt – wie beim echten Radrennen!
      Beide Teammitglieder würfeln jeden Tag. Die kombinierten Pinzahlen beider Spieler werden mit dem Tagesmultiplikator gewichtet:
      Tag 1 × 1, Tag 2 × 2, Tag 3 × 3, Tag 4 × 4, Tag 5 × 5, Tag 6 × 6.
      Team-Tagespunkte = (Spieler1 + Spieler2) × Tageszahl. Höchste Gesamtpunktzahl gewinnt.`,
    einsacken: `<strong>💰 Einsacken:</strong> Zwei Gruppen spielen gegeneinander. In jeder Runde wirft jeder Spieler einmal. 
      Der Spieler mit den meisten Punkten in seiner Gruppe "Sackt" die Runde ein (= bekommt einen Gewinnpunkt). 
      Wer am Ende die meisten Runden gewonnen hat, gewinnt für seine Gruppe.`,
    schwein: `<strong>🐷 Schweinepartie / Zahlenlotto:</strong> 5 Kegel sind mit Geldwerten belegt (0,20€ bis 1,00€). 
      Jeder Spieler wirft und sammelt die Werte der getroffenen Kegel. 
      Der Spieler mit dem niedrigsten Ergebnis (Schwein) muss die Gesamtsumme aller zahlen!`,
    tannenbaum: `<strong>🌲 Tannenbaum – Regeln:</strong><br>
      <strong>Aufbau:</strong> Jedes Team hat einen Tannenbaum mit den Zahlen 1–9 (Raute/Pyramide).<br>
      <strong>Wurf:</strong> Immer "in die Vollen" – alle 9 Kegel stehen bei jedem Wurf.<br>
      <strong>Treffer:</strong> Wirft ein Spieler z.B. 5 Kegel → die 5 beim eigenen Team wird gestrichen.<br>
      <strong>Schon gestrichen?</strong> Ist die Zahl beim eigenen Team schon weg → die Zahl wird beim <em>Gegner</em> gestrichen!<br>
      <strong>Pumpe (0 Kegel):</strong> Nichts passiert.<br>
      <strong>Gewinner:</strong> Wer zuerst alle Zahlen 1–9 gestrichen hat, gewinnt das Spiel.`,
    idiot: `<strong>🤪 Idiotenkegeln:</strong> Drei Würfe in drei Stilen: Links (mit der linken Hand), 
      Rückwärts durch die Beine, Rechts (mit der rechten Hand). 
      Die Summe aller drei Würfe ist das Ergebnis. Höchste Summe gewinnt.`,
    mensch: `<strong>🎲 Mensch-ärger-dich-nicht:</strong> Angelehnt an das Brettspiel! Jeder Spieler hat 10 Würfe. 
      Ziel ist es, gezielt bestimmte Kegelpositionen zu treffen um seine Spielfiguren ins Ziel zu bringen. 
      Die Gesamtsumme der Würfe entscheidet die Platzierung.`,
    bus: `<strong>🚌 Busfahren:</strong> Jeder Spieler wird einem von 9 Bussen zugewiesen. 
      Die Würfe der Spieler geben ihrem Bus "Räder" (Punkte). 
      Der Bus mit den meisten Rädern am Ende gewinnt das Rennen!`
  };
  return `<div class="game-rules">${rules[id] || '– Regeln nicht verfügbar –'}</div>`;
}

// ======================================================
// INPUT LISTENERS
// ======================================================
function attachInputListeners() {
  document.querySelectorAll('[data-score]').forEach(inp => {
    inp.addEventListener('change', () => handleScore(inp));
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        const all = [...document.querySelectorAll('[data-score]')];
        const i = all.indexOf(inp);
        if (i < all.length - 1) all[i+1].focus();
      }
    });
  });
}

function handleScore(inp) {
  const { game, pid, field, idx } = inp.dataset;
  const v = parseFloat(inp.value) || 0;
  const sc = state.scores;

  if (game === 'hausnummer') {
    const empty = { gross:{H:0,Z:0,E:0}, klein:{H:0,Z:0,E:0} };
    if (!sc.hausnummer[pid]) sc.hausnummer[pid] = JSON.parse(JSON.stringify(empty));
    // field = 'gross' or 'klein', idx = 'H','Z','E'
    if (!sc.hausnummer[pid][field]) sc.hausnummer[pid][field] = {H:0,Z:0,E:0};
    sc.hausnummer[pid][field][idx] = v;
    setEl(`hn_${field}_num_${pid}`, field==='gross' ? grossHN(pid) : kleinHN(pid));
    refreshRanks('hausnummer');

  } else if (game === 'sv') {
    if (!sc.sv[pid]) sc.sv[pid] = { throws:[0,0,0,0,0,0,0], karte:0 };
    if (field === 'throw') sc.sv[pid].throws[+idx] = v;
    else sc.sv[pid].karte = v;
    const sv = sc.sv[pid];
    const ergebnis = s(sv.throws);
    const gesamt   = ergebnis + (sv.karte||0);
    setEl(`sv_ergebnis_${pid}`, ergebnis);
    const gEl = document.getElementById(`sv_gesamt_${pid}`);
    if (gEl) {
      gEl.textContent = gesamt;
      gEl.className = 'total-cell' + (gesamt > 21 ? ' over-limit' : gesamt === 21 ? ' exact-hit' : '');
    }
    refreshRanks('sv');

  } else if (game === 'rennen') {
    if (!sc.rennen.days) sc.rennen.days = {};
    if (!sc.rennen.days[pid]) sc.rennen.days[pid] = Array(6).fill(0);
    sc.rennen.days[pid][+idx] = v;
    updateRennenTeamCells(pid);
    refreshRanks('rennen');

  } else if (game === 'schwein') {
    if (!sc.schwein[pid]) sc.schwein[pid] = { vals:[0,0,0,0,0] };
    sc.schwein[pid].vals[+idx] = v;
    const wts = [0.2,0.4,0.6,0.8,1.0];
    const erg = sc.schwein[pid].vals.reduce((a,x,i) => a + (x||0)*wts[i], 0);
    setEl(`sw_erg_${pid}`, erg.toFixed(2)+'€');
    refreshRanks('schwein');

  } else if (game === 'idiot') {
    if (!sc.idiot[pid]) sc.idiot[pid] = { links:0, beine:0, rechts:0 };
    sc.idiot[pid][field] = v;
    const id = sc.idiot[pid];
    setEl(`idiot_total_${pid}`, (id.links||0)+(id.beine||0)+(id.rechts||0));
    refreshRanks('idiot');

  } else if (game === 'mensch') {
    if (!sc.mensch[pid]) sc.mensch[pid] = { throws:Array(10).fill(0) };
    sc.mensch[pid].throws[+idx] = v;
    setEl(`mensch_total_${pid}`, s(sc.mensch[pid].throws));
    refreshRanks('mensch');

  } else if (game === 'kb') {
    if (!state.kegelbuch[pid]) state.kegelbuch[pid] = { startgeld:false, pudel:0, stina:0 };
    state.kegelbuch[pid][field] = v;
    updateKbRow(pid);

  } else if (game === 'bus') {
    // bus direct score input
    const i = +pid; // bus index
    state.scores.bus.scores[i] = v;
  }

  saveData();
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function refreshRanks(game) {
  const players = state.players;
  if (!players.length) return;

  if (game === 'hausnummer') {
    // Große: höchste Zahl gewinnt
    const gEntries = players.map(p => ({ id: p.id, total: grossHN(p.id) }));
    rank(gEntries, true).forEach(r  => setEl(`hn_gross_rank_${r.id}`, medal(r.rank)));
    // Kleine: niedrigste Zahl gewinnt
    const kEntries = players.map(p => ({ id: p.id, total: kleinHN(p.id) }));
    rank(kEntries, false).forEach(r => setEl(`hn_klein_rank_${r.id}`, medal(r.rank)));

  } else if (game === 'sv') {
    const entries = players.map(p => {
      const sv = state.scores.sv[p.id]||{throws:[],karte:0};
      const total = s(sv.throws) + (sv.karte||0);
      return { id: p.id, total: total > 21 ? -1 : total };
    });
    rank(entries).forEach(r => setEl(`sv_rank_${r.id}`, medal(r.rank)));

  } else if (game === 'rennen') {
    const rn = state.scores.rennen;
    if (!rn.teams || !rn.teams.length) return;
    const teamEntries = rn.teams.map(t => ({ id: t.id, total: rennenTeamTotal(t) }));
    rank(teamEntries).forEach(r => setEl(`rn_team_rank_${r.id}`, medal(r.rank)));

  } else if (game === 'schwein') {
    const wts = [0.2,0.4,0.6,0.8,1.0];
    const entries = players.map(p => {
      const vals = (state.scores.schwein[p.id]||{vals:[]}).vals||[];
      return { id: p.id, total: vals.reduce((a,x,i) => a+(x||0)*wts[i], 0) };
    });
    rank(entries, false).forEach(r => setEl(`sw_rank_${r.id}`, medal(r.rank)));

  } else if (game === 'idiot') {
    const entries = players.map(p => {
      const id = state.scores.idiot[p.id]||{links:0,beine:0,rechts:0};
      return { id: p.id, total: (id.links||0)+(id.beine||0)+(id.rechts||0) };
    });
    rank(entries).forEach(r => setEl(`idiot_rank_${r.id}`, medal(r.rank)));

  } else if (game === 'mensch') {
    const entries = players.map(p => ({
      id: p.id, total: s((state.scores.mensch[p.id]||{throws:[]}).throws)
    }));
    rank(entries).forEach(r => setEl(`mensch_rank_${r.id}`, medal(r.rank)));
  }
}

// Compute total score for a team across all 6 days (each player's score × day multiplier)
function rennenTeamTotal(t) {
  const days = state.scores.rennen.days || {};
  return [0,1,2,3,4,5].reduce((sum, i) => {
    const p1v = (days[t.p1] || [])[i] || 0;
    const p2v = (days[t.p2] || [])[i] || 0;
    return sum + (p1v + p2v) * (i + 1);
  }, 0);
}

// Refresh all per-team day-cells and totals when a player score changes
function updateRennenTeamCells(pid) {
  const rn = state.scores.rennen;
  // Update the player's own raw total cell
  const rawDays = (rn.days && rn.days[pid]) || Array(6).fill(0);
  setEl(`rn_ptotal_${pid}`, rawDays.reduce((a,v)=>a+(v||0),0));
  // Find which team this player is on and update team cells
  const t = (rn.teams || []).find(t => t.p1 === pid || t.p2 === pid);
  if (!t) return;
  const days = rn.days || {};
  let cum = 0;
  for (let i = 0; i < 6; i++) {
    const p1v = (days[t.p1] || [])[i] || 0;
    const p2v = (days[t.p2] || [])[i] || 0;
    const combined = (p1v + p2v) * (i + 1);
    cum += combined;
    setEl(`rn_teamday_${t.id}_${i}`, combined);
  }
  setEl(`rn_teamtotal_${t.id}`, cum);
}

function updateKbRow(pid) {
  const kb  = state.kegelbuch[pid]||{};
  const wts = [0.2,0.4,0.6,0.8,1.0];
  const sw  = state.scores.schwein[pid]||{vals:[]};
  const schweinSchuld = sw.vals.reduce((a,x,i) => a+(x||0)*wts[i], 0);
  const zahlen = schweinSchuld + (kb.pudel||0)*0.10;
  setEl(`kb_zahlen_${pid}`, zahlen.toFixed(2)+'€');
}


// ======================================================
// RENDER: SPIELER
// ======================================================
function renderSpieler() {
  return `
  <div class="page-card">
    <div class="card-header">
      <h2>👥 Spieler</h2>
      <span class="badge">${state.players.length}/${MAX_PLAYERS}</span>
    </div>
    <div class="player-add-form">
      <input class="text-input" id="newPlayerName" placeholder="Neuer Spielername..." maxlength="30"
             onkeydown="if(event.key==='Enter')addPlayerFromInput()">
      <button class="btn-primary" onclick="addPlayerFromInput()">➕ Hinzufügen</button>
      <button class="btn-secondary" onclick="loadPresetNames()" title="Spieler aus Vorlage laden">📋 Vorlage</button>
    </div>
    <div class="player-list">
      ${state.players.length === 0
        ? '<div class="empty-state">Noch keine Spieler. Füge Spieler hinzu oder lade die Vorlage.</div>'
        : state.players.map((p,i) => `
          <div class="player-item">
            <div class="player-num">${i+1}</div>
            <div class="player-name">${esc(p.name)}</div>
            <div class="player-actions">
              <button class="btn-icon-sm" onclick="movePlayer('${p.id}','up')"   title="Nach oben"  style="font-size:.7rem" ${i===0?'disabled style="opacity:.3;cursor:default;font-size:.7rem"':''}>▲</button>
              <button class="btn-icon-sm" onclick="movePlayer('${p.id}','down')" title="Nach unten" style="font-size:.7rem" ${i===state.players.length-1?'disabled style="opacity:.3;cursor:default;font-size:.7rem"':''}>▼</button>
              <button class="btn-icon-sm" onclick="renamePlayer('${p.id}')" title="Umbenennen">✏️</button>
              <button class="btn-icon-sm btn-danger-sm" onclick="removePlayer('${p.id}')" title="Löschen">🗑️</button>
            </div>
          </div>`).join('')}
    </div>
    <div class="data-actions">
      <button class="btn-secondary" onclick="saveData()">💾 Speichern</button>
      <button class="btn-secondary" onclick="exportData()">📤 Export JSON</button>
      <button class="btn-secondary" onclick="importData()">📥 Import JSON</button>
    </div>
  </div>`;
}