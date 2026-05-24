/* ======================================================
   KEGEL-SPIELE MANAGER — script.js
   Games: Hausnummer | 17und4 | Fuchs | 6-Tage-Rennen |
          Einsacken | Schweinepartie | Tannenbaum |
          Idiotenkegeln | Mensch-ä-d-n | Busfahren
   ====================================================== */
'use strict';

// ======================================================
// STATE
// ======================================================
const MAX_PLAYERS = 20;
const THEMES = ['classic','neon','light','retro'];
let themeIdx = 0;

function defaultState() {
  return {
    session: { name: 'Kegel-Abend', date: '' },
    players: [],
    theme: 'classic',
    scores: {
      hausnummer: {},     // id: {gross:[3], klein:[3]}
      sv:         {},     // id: {throws:[7], karte:0}
      fuchs: { fuchsId: null, rounds: [] },
                          // rounds: [{fochScore, hunters:{id:score}}]
      rennen:     {},     // id: {days:[6]}
      einsacken: { g1: [], g2: [], rounds: [] },
                          // rounds: [{g1:{id:n}, g2:{id:n}}]
      schwein:    {},     // id: {vals:[5]}  (0-9 pins each weight)
      tannenbaum: { g1: [], g2: [], g1wins: 0, g2wins: 0, rounds: [] },
      idiot:      {},     // id: {links, beine, rechts}
      mensch:     {},     // id: {throws:[10]}
      bus: {              // buses array
        assignments: {},  // playerId -> busIndex 0-8
        scores: [0,0,0,0,0,0,0,0,0]
      }
    },
    kegelbuch: {}         // id: {startgeld, pudel, stina}
  };
}

let state = defaultState();

// ======================================================
// INIT
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  showPage('spieler');
});

// ======================================================
// PERSISTENCE
// ======================================================
function saveData() {
  state.session.date = new Date().toLocaleDateString('de-DE');
  localStorage.setItem('kegelspiele_v2', JSON.stringify(state));
  const el = document.getElementById('saveStatus');
  if (el) {
    el.textContent = '✔ Gespeichert ' + new Date().toLocaleTimeString('de-DE');
    el.className = 'save-status saved';
  }
  showToast('💾 Gespeichert!', 'success');
}

function loadData() {
  const raw = localStorage.getItem('kegelspiele_v2');
  if (!raw) { updateFooter(); return; }
  try {
    const parsed = JSON.parse(raw);
    state = deepMerge(defaultState(), parsed);
    themeIdx = Math.max(0, THEMES.indexOf(state.theme));
    applyTheme(state.theme);
    const nameEl = document.getElementById('sessionNameDisplay');
    if (nameEl) nameEl.textContent = state.session.name + ' ✏️';
  } catch(e) { console.warn('Load error', e); }
  updateFooter();
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return source !== undefined ? source : target;
  const result = Array.isArray(target) ? [...target] : Object.assign({}, target);
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'kegelspiele_' + (state.session.date||'export').replace(/\./g,'-') + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData() { document.getElementById('importFile').click(); }

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      state = deepMerge(defaultState(), JSON.parse(ev.target.result));
      applyTheme(state.theme);
      saveData();
      showPage(document.querySelector('.nav-btn.active')?.dataset.page || 'spieler');
      showToast('✅ Import erfolgreich!', 'success');
    } catch { showToast('❌ Import fehlgeschlagen!', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function resetAll() {
  showConfirm('🗑️ Alle Daten löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden!', () => {
    localStorage.removeItem('kegelspiele_v2');
    state = defaultState();
    showPage('spieler');
    updateFooter();
    showToast('Alle Daten gelöscht.', 'error');
  });
}

// ======================================================
// NAVIGATION
// ======================================================
let currentPage = 'spieler';

function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  const main = document.getElementById('mainContent');
  const renderers = {
    spieler:    renderSpieler,
    hausnummer: renderHausnummer,
    sv:         renderSv,
    fuchs:      renderFuchs,
    rennen:     renderRennen,
    einsacken:  renderEinsacken,
    schwein:    renderSchwein,
    tannenbaum: renderTannenbaum,
    idiot:      renderIdiot,
    mensch:     renderMensch,
    bus:        renderBus,
    kegelbuch:  renderKegelbuch,
    auswertung: renderAuswertung
  };
  main.innerHTML = renderers[page] ? renderers[page]() : '<div class="no-players-msg">Seite nicht gefunden</div>';
  attachInputListeners();
}

// ======================================================
// THEME
// ======================================================
function cycleTheme() {
  themeIdx = (themeIdx + 1) % THEMES.length;
  state.theme = THEMES[themeIdx];
  applyTheme(state.theme);
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const icons = { classic:'🎳', neon:'💡', light:'☀️', retro:'🕹️' };
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = icons[t] || '🎨';
}

// ======================================================
// FULLSCREEN
// ======================================================
function toggleFullscreen() {
  const btn = document.getElementById('fullscreenBtn');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    if (btn) btn.textContent = '⊡';
  } else {
    document.exitFullscreen();
    if (btn) btn.textContent = '⛶';
  }
}

// ======================================================
// SESSION NAME
// ======================================================
function editSessionName() {
  showInputModal('Sitzungsname ändern', state.session.name, val => {
    state.session.name = val;
    const el = document.getElementById('sessionNameDisplay');
    if (el) el.textContent = val + ' ✏️';
    saveData();
  });
}

// ======================================================
// PLAYER MANAGEMENT
// ======================================================
function addPlayer(name) {
  if (!name.trim()) return;
  if (state.players.length >= MAX_PLAYERS) { showToast('Maximum 20 Spieler!', 'error'); return; }
  const id = 'p' + Date.now();
  state.players.push({ id, name: name.trim() });
  initPlayerScores(id);
  updateFooter();
}

function initPlayerScores(id) {
  if (!state.scores.hausnummer[id]) state.scores.hausnummer[id] = { gross:[0,0,0], klein:[0,0,0] };
  if (!state.scores.sv[id])         state.scores.sv[id]         = { throws:[0,0,0,0,0,0,0], karte:0 };
  if (!state.scores.rennen[id])     state.scores.rennen[id]     = { days:[0,0,0,0,0,0] };
  if (!state.scores.schwein[id])    state.scores.schwein[id]    = { vals:[0,0,0,0,0] };
  if (!state.scores.idiot[id])      state.scores.idiot[id]      = { links:0, beine:0, rechts:0 };
  if (!state.scores.mensch[id])     state.scores.mensch[id]     = { throws:Array(10).fill(0) };
  if (!state.kegelbuch[id])         state.kegelbuch[id]         = { startgeld:false, pudel:0, stina:0 };
}

function removePlayer(id) {
  showConfirm('Spieler entfernen?', 'Alle Scores werden gelöscht!', () => {
    state.players = state.players.filter(p => p.id !== id);
    for (const g in state.scores) {
      if (state.scores[g] && typeof state.scores[g] === 'object') delete state.scores[g][id];
    }
    delete state.kegelbuch[id];
    // Remove from groups
    ['g1','g2'].forEach(g => {
      if (state.scores.einsacken[g]) state.scores.einsacken[g] = state.scores.einsacken[g].filter(x => x !== id);
      if (state.scores.tannenbaum[g]) state.scores.tannenbaum[g] = state.scores.tannenbaum[g].filter(x => x !== id);
    });
    if (state.scores.bus.assignments) delete state.scores.bus.assignments[id];
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
  const names = ['Michael','Hilde','Peter','Brigitte','Elke','Gerhard','Helga','Birgit','Jo','Svenja','Marius'];
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
    hausnummer: `<strong>🏠 Große & Kleine Hausnummer:</strong> Jeder Spieler wirft je 3 mal für die Große und 3 mal für die Kleine Hausnummer. 
      Bei der Großen Hausnummer versucht man hohe Zahlen (7-9 Kegel) zu treffen, bei der Kleinen niedrige (1-3 Kegel). 
      Es werden die Summen verglichen – höchste Summe gewinnt jeweils.`,
    sv: `<strong>🃏 17 und 4:</strong> Wie Black­jack mit Kegeln! Jeder Spieler hat bis zu 7 Würfe und versucht genau 17 zu erreichen, 
      ohne zu überschreiten. Wer 17 überschreitet, ist "über" und verliert. 
      Die "Karte" ist ein Bonuspunkt. Sieger: wer am nächsten an 17 (ohne drüber) liegt.`,
    fuchs: `<strong>🦊 Fuchsspiel:</strong> Ein Spieler ist der "Fuchs". Er wirft zuerst und setzt damit die Zielzahl. 
      Die anderen Spieler ("Jäger") versuchen die Punktzahl des Fuchses zu übertreffen. 
      Gelingt es einem Jäger nicht, überlebt der Fuchs die Runde und bekommt einen Punkt. 
      Wer am Ende die meisten Punkte hat, gewinnt.`,
    rennen: `<strong>🚀 6-Tage-Rennen:</strong> Wie ein Radrennen! Tag 1 = normale Punkte, Tag 2 = doppelte Punkte, 
      Tag 3 = dreifache Punkte ... Tag 6 = sechsfache Punkte. Laufende Gesamtsumme = Rennstand. Höchste Gesamtsumme gewinnt.`,
    einsacken: `<strong>💰 Einsacken:</strong> Zwei Gruppen spielen gegeneinander. In jeder Runde wirft jeder Spieler einmal. 
      Der Spieler mit den meisten Punkten in seiner Gruppe "Sackt" die Runde ein (= bekommt einen Gewinnpunkt). 
      Wer am Ende die meisten Runden gewonnen hat, gewinnt für seine Gruppe.`,
    schwein: `<strong>🐷 Schweinepartie / Zahlenlotto:</strong> 5 Kegel sind mit Geldwerten belegt (0,20€ bis 1,00€). 
      Jeder Spieler wirft und sammelt die Werte der getroffenen Kegel. 
      Der Spieler mit dem niedrigsten Ergebnis (Schwein) muss die Gesamtsumme aller zahlen!`,
    tannenbaum: `<strong>🌲 Tannenbaum:</strong> Zwei Gruppen spielen abwechselnd. Der Tannenbaum hat 9 Ebenen: 1,2,3,4,5,4,3,2,1 Kegel. 
      Jeder Spieler muss nacheinander die richtige Anzahl Kegel treffen. 
      Wer alle 9 Ebenen schafft, holt den Tannenbaum für seine Gruppe!`,
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
    if (!sc.hausnummer[pid]) sc.hausnummer[pid] = { gross:[0,0,0], klein:[0,0,0] };
    sc.hausnummer[pid][field][+idx] = v;
    const hs = sc.hausnummer[pid];
    setEl(`hn_${field}_sum_${pid}`, s(hs[field]));
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
      gEl.className = 'total-cell' + (gesamt > 17 ? ' over-limit' : gesamt === 17 ? ' exact-hit' : '');
    }
    refreshRanks('sv');

  } else if (game === 'rennen') {
    if (!sc.rennen[pid]) sc.rennen[pid] = { days:[0,0,0,0,0,0] };
    sc.rennen[pid].days[+idx] = v;
    updateRennenRow(pid);
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
    ['gross','klein'].forEach(f => {
      const entries = players.map(p => ({
        id: p.id,
        total: s((state.scores.hausnummer[p.id]||{gross:[],klein:[]})[f]||[])
      }));
      rank(entries).forEach(r => setEl(`hn_${f}_rank_${r.id}`, medal(r.rank)));
    });

  } else if (game === 'sv') {
    const entries = players.map(p => {
      const sv = state.scores.sv[p.id]||{throws:[],karte:0};
      const total = s(sv.throws) + (sv.karte||0);
      return { id: p.id, total: total > 17 ? -1 : total };
    });
    rank(entries).forEach(r => setEl(`sv_rank_${r.id}`, medal(r.rank)));

  } else if (game === 'rennen') {
    const entries = players.map(p => {
      const r = state.scores.rennen[p.id]||{days:[]};
      return { id: p.id, total: r.days.reduce((a,v,i) => a+(v||0)*(i+1), 0) };
    });
    rank(entries).forEach(r => setEl(`rn_rank_${r.id}`, medal(r.rank)));

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

function updateRennenRow(pid) {
  const r = state.scores.rennen[pid]||{days:[]};
  let cum = 0;
  for (let i = 0; i < 6; i++) {
    const mult = (r.days[i]||0) * (i+1);
    cum += mult;
    setEl(`rn_mult_${pid}_${i}`, mult);
    setEl(`rn_sum_${pid}_${i}`, cum);
  }
  setEl(`rn_total_${pid}`, cum);
}

function updateKbRow(pid) {
  const kb  = state.kegelbuch[pid]||{};
  const wts = [0.2,0.4,0.6,0.8,1.0];
  const sw  = state.scores.schwein[pid]||{vals:[]};
  const schweinSchuld = sw.vals.reduce((a,x,i) => a+(x||0)*wts[i], 0);
  setEl(`kb_zahlen_${pid}`, schweinSchuld.toFixed(2)+'€');
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

// ======================================================
// RENDER: HAUSNUMMER
// ======================================================
function renderHausnummer() {
  if (!state.players.length) return noPlayers();
  const ranked = {};
  ['gross','klein'].forEach(f => {
    const entries = state.players.map(p => ({
      id: p.id, total: s((state.scores.hausnummer[p.id]||{gross:[],klein:[]})[f]||[])
    }));
    rank(entries).forEach(r => { ranked[`${f}_${r.id}`] = medal(r.rank); });
  });

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🏠 Große & Kleine Hausnummer</h2>
      <button class="btn-rules" onclick="toggleRules('hausnummer')">📜 Regeln</button>
    </div>
    <div id="rules_hausnummer" style="display:none">${rulesHtml('hausnummer')}</div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th rowspan="2">Name</th>
            <th colspan="3" class="section-header gross">Große Hausnummer</th>
            <th class="section-header gross">Σ</th>
            <th class="section-header gross">Platz</th>
            <th colspan="3" class="section-header klein">Kleine Hausnummer</th>
            <th class="section-header klein">Σ</th>
            <th class="section-header klein">Platz</th>
          </tr>
          <tr>
            <th>W1</th><th>W2</th><th>W3</th><th></th><th></th>
            <th>W1</th><th>W2</th><th>W3</th><th></th><th></th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const hs = state.scores.hausnummer[p.id]||{gross:[0,0,0],klein:[0,0,0]};
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              ${[0,1,2].map(i=>`<td><input class="score-input" type="number" min="0" max="9" value="${hs.gross[i]||0}"
                data-score data-game="hausnummer" data-pid="${p.id}" data-field="gross" data-idx="${i}"></td>`).join('')}
              <td class="sum-cell" id="hn_gross_sum_${p.id}">${s(hs.gross)}</td>
              <td class="rank-cell" id="hn_gross_rank_${p.id}">${ranked[`gross_${p.id}`]||'–'}</td>
              ${[0,1,2].map(i=>`<td><input class="score-input" type="number" min="0" max="9" value="${hs.klein[i]||0}"
                data-score data-game="hausnummer" data-pid="${p.id}" data-field="klein" data-idx="${i}"></td>`).join('')}
              <td class="sum-cell" id="hn_klein_sum_${p.id}">${s(hs.klein)}</td>
              <td class="rank-cell" id="hn_klein_rank_${p.id}">${ranked[`klein_${p.id}`]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ======================================================
// RENDER: 17 UND 4
// ======================================================
function renderSv() {
  if (!state.players.length) return noPlayers();
  const svRanks = {};
  const entries = state.players.map(p => {
    const sv = state.scores.sv[p.id]||{throws:Array(7).fill(0),karte:0};
    const total = s(sv.throws)+(sv.karte||0);
    return { id: p.id, total: total > 17 ? -1 : total };
  });
  rank(entries).forEach(r => { svRanks[r.id] = medal(r.rank); });

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🃏 17 und 4</h2>
      <button class="btn-rules" onclick="toggleRules('sv')">📜 Regeln</button>
    </div>
    <div id="rules_sv" style="display:none">${rulesHtml('sv')}</div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>W1</th><th>W2</th><th>W3</th><th>W4</th><th>W5</th><th>W6</th><th>W7</th>
            <th>Erg.</th><th>Karte</th><th>Gesamt</th><th>Platz</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const sv = state.scores.sv[p.id]||{throws:Array(7).fill(0),karte:0};
            const erg = s(sv.throws);
            const ges = erg + (sv.karte||0);
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              ${sv.throws.map((v,i)=>`<td><input class="score-input" type="number" min="0" max="9" value="${v||0}"
                data-score data-game="sv" data-pid="${p.id}" data-field="throw" data-idx="${i}"></td>`).join('')}
              <td class="sum-cell" id="sv_ergebnis_${p.id}">${erg}</td>
              <td><input class="score-input" type="number" min="0" max="9" value="${sv.karte||0}"
                data-score data-game="sv" data-pid="${p.id}" data-field="karte" data-idx="0"></td>
              <td class="total-cell${ges>17?' over-limit':ges===17?' exact-hit':''}" id="sv_gesamt_${p.id}">${ges}</td>
              <td class="rank-cell" id="sv_rank_${p.id}">${svRanks[p.id]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="game-rules" style="margin-top:12px">
      🔴 <strong>Rot</strong> = Über 17 (verloren) &nbsp;|&nbsp; 🟢 <strong>Grün</strong> = Genau 17 (Perfekt!)
    </div>
  </div>`;
}

// ======================================================
// RENDER: FUCHS
// ======================================================
function renderFuchs() {
  if (!state.players.length) return noPlayers();
  const fr = state.scores.fuchs;
  if (!fr.rounds) fr.rounds = [];

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🦊 Fuchsspiel</h2>
      <button class="btn-rules" onclick="toggleRules('fuchs')">📜 Regeln</button>
    </div>
    <div id="rules_fuchs" style="display:none">${rulesHtml('fuchs')}</div>
    <div class="fuchs-setup">
      <span style="font-weight:700;color:var(--accent)">🦊 Fuchs:</span>
      <select class="fuchs-select" onchange="setFuchs(this.value)">
        <option value="">— Fuchs wählen —</option>
        ${state.players.map(p=>`<option value="${p.id}" ${fr.fuchsId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}
      </select>
      <button class="btn-secondary btn-sm" onclick="addFuchsRound()">➕ Runde hinzufügen</button>
    </div>

    ${fr.fuchsId ? `
    <div id="fuchsRunden">
      ${fr.rounds.map((rd,ri) => `
        <div class="fuchs-round-card">
          <div class="fuchs-round-title">
            Runde ${ri+1}
            <button class="btn-danger btn-sm" onclick="removeFuchsRound(${ri})">✕</button>
          </div>
          <div class="fuchs-row">
            <span class="fuchs-label">${pname(fr.fuchsId)} <span class="fuchs-fox-badge">Fuchs</span></span>
            <input class="score-input" type="number" min="0" max="9" value="${rd.fuchsScore||0}"
              onchange="setFuchsScore(${ri},'fuchs',this.value)">
            <span class="fuchs-result">${rd.fuchsScore||0} Kegel</span>
          </div>
          ${state.players.filter(p=>p.id!==fr.fuchsId).map(p=>`
            <div class="fuchs-row">
              <span class="fuchs-label">${esc(p.name)} <span class="fuchs-hunter-badge">Jäger</span></span>
              <input class="score-input" type="number" min="0" max="9" value="${(rd.hunters&&rd.hunters[p.id])||0}"
                onchange="setFuchsScore(${ri},'${p.id}',this.value)">
              <span class="fuchs-result">${((rd.hunters&&rd.hunters[p.id])||0) > (rd.fuchsScore||0) ? '✅ gefangen!' : '❌ entkommen'}</span>
            </div>`).join('')}
        </div>`).join('')}
    </div>
    <div class="game-rules" style="margin-top:12px">
      <strong>Fuchspunkte:</strong>
      ${state.players.map(p => {
        const pts = fr.rounds.reduce((sum, rd) => {
          if (p.id === fr.fuchsId) {
            const survived = state.players.filter(h=>h.id!==fr.fuchsId)
              .some(h => ((rd.hunters&&rd.hunters[h.id])||0) <= (rd.fuchsScore||0));
            return sum + (survived ? 1 : 0);
          } else {
            return sum + (((rd.hunters&&rd.hunters[p.id])||0) > (rd.fuchsScore||0) ? 1 : 0);
          }
        }, 0);
        return `<span style="margin-right:16px">${esc(p.name)}: <strong>${pts} Pkt</strong></span>`;
      }).join('')}
    </div>
    ` : '<div class="empty-state">Bitte zuerst einen Fuchs auswählen!</div>'}
  </div>`;
}

function setFuchs(id) {
  state.scores.fuchs.fuchsId = id;
  saveData();
  showPage('fuchs');
}

function addFuchsRound() {
  if (!state.scores.fuchs.fuchsId) { showToast('Bitte zuerst Fuchs wählen!', 'error'); return; }
  state.scores.fuchs.rounds.push({ fuchsScore: 0, hunters: {} });
  saveData();
  showPage('fuchs');
}

function removeFuchsRound(i) {
  state.scores.fuchs.rounds.splice(i, 1);
  saveData();
  showPage('fuchs');
}

function setFuchsScore(roundIdx, who, val) {
  const rd = state.scores.fuchs.rounds[roundIdx];
  if (!rd) return;
  if (who === 'fuchs') rd.fuchsScore = parseFloat(val)||0;
  else { if (!rd.hunters) rd.hunters = {}; rd.hunters[who] = parseFloat(val)||0; }
  saveData();
  showPage('fuchs');
}

// ======================================================
// RENDER: 6-TAGE-RENNEN
// ======================================================
function renderRennen() {
  if (!state.players.length) return noPlayers();
  const entries = state.players.map(p => {
    const r = state.scores.rennen[p.id]||{days:[]};
    return { id: p.id, total: r.days.reduce((a,v,i) => a+(v||0)*(i+1), 0) };
  });
  const rnRanks = {};
  rank(entries).forEach(r => { rnRanks[r.id] = medal(r.rank); });

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🚀 6-Tage-Rennen</h2>
      <button class="btn-rules" onclick="toggleRules('rennen')">📜 Regeln</button>
    </div>
    <div id="rules_rennen" style="display:none">${rulesHtml('rennen')}</div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th rowspan="2">Name</th>
            <th>Tag 1<br><small>×1</small></th>
            <th>Tag 2<br><small>×2</small></th><th>Wert</th><th>Σ</th>
            <th>Tag 3<br><small>×3</small></th><th>Wert</th><th>Σ</th>
            <th>Tag 4<br><small>×4</small></th><th>Wert</th><th>Σ</th>
            <th>Tag 5<br><small>×5</small></th><th>Wert</th><th>Σ</th>
            <th>Tag 6<br><small>×6</small></th><th>Wert</th>
            <th>Gesamt</th><th>Platz</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const r = state.scores.rennen[p.id]||{days:Array(6).fill(0)};
            let cum = 0;
            const cells = r.days.map((v,i) => {
              const mult = (v||0)*(i+1);
              cum += mult;
              const input = `<td><input class="score-input" type="number" min="0" max="9" value="${v||0}"
                data-score data-game="rennen" data-pid="${p.id}" data-field="day" data-idx="${i}"></td>`;
              if (i === 0) return input;
              return input +
                `<td id="rn_mult_${p.id}_${i}" style="color:var(--accent2);font-weight:700">${mult}</td>` +
                `<td id="rn_sum_${p.id}_${i}" class="sum-cell">${cum}</td>`;
            }).join('');
            const total = r.days.reduce((a,v,i)=>a+(v||0)*(i+1),0);
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              ${cells}
              <td class="sum-cell" id="rn_total_${p.id}">${total}</td>
              <td class="rank-cell" id="rn_rank_${p.id}">${rnRanks[p.id]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ======================================================
// RENDER: EINSACKEN
// ======================================================
function renderEinsacken() {
  if (!state.players.length) return noPlayers();
  const es = state.scores.einsacken;
  if (!es.g1) es.g1 = [];
  if (!es.g2) es.g2 = [];
  if (!es.rounds) es.rounds = [];

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>💰 Einsacken</h2>
      <button class="btn-rules" onclick="toggleRules('einsacken')">📜 Regeln</button>
    </div>
    <div id="rules_einsacken" style="display:none">${rulesHtml('einsacken')}</div>

    <div class="einsacken-groups">
      ${['g1','g2'].map((g,gi) => `
        <div class="group-card">
          <div class="group-title">Gruppe ${gi+1}
            <span class="badge">${(es[g]||[]).length} Spieler</span>
          </div>
          <div style="margin-bottom:10px">
            <select class="select-input" onchange="addToGroup('${g}',this.value);this.value=''">
              <option value="">Spieler hinzufügen...</option>
              ${state.players.filter(p=>!es.g1.includes(p.id)&&!es.g2.includes(p.id))
                .map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}
            </select>
          </div>
          ${(es[g]||[]).map(pid => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="flex:1;font-size:.85rem">${pname(pid)}</span>
              <span class="badge">${countEinsackenWins(g,pid)} Gewonnen</span>
              <button class="btn-icon-sm btn-danger-sm" onclick="removeFromGroup('${g}','${pid}')">✕</button>
            </div>`).join('')}
        </div>`).join('')}
    </div>

    <hr class="sect-divider">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <strong>Runden (${es.rounds.length})</strong>
      <button class="btn-secondary btn-sm" onclick="addEinsackenRound()">➕ Runde</button>
    </div>

    ${es.rounds.map((rd,ri) => `
      <div class="fuchs-round-card">
        <div class="fuchs-round-title">Runde ${ri+1}
          <button class="btn-danger btn-sm" onclick="removeEinsackenRound(${ri})">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${['g1','g2'].map((g,gi) => `
            <div>
              <div style="font-size:.75rem;color:var(--text3);margin-bottom:6px">GRUPPE ${gi+1}</div>
              ${(es[g]||[]).map(pid => `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                  <span style="flex:1;font-size:.82rem">${pname(pid)}</span>
                  <input class="score-input" type="number" min="0" max="9" value="${(rd[g]&&rd[g][pid])||0}"
                    onchange="setEinsackenScore(${ri},'${g}','${pid}',this.value)">
                </div>`).join('')}
              <div style="font-size:.75rem;color:var(--accent);margin-top:6px">
                🏆 Rundensieger G${gi+1}: ${getEinsackenRoundWinner(rd[g],es[g])}
              </div>
            </div>`).join('')}
        </div>
      </div>`).join('')}
  </div>`;
}

function addToGroup(g, pid) {
  if (!pid) return;
  state.scores.einsacken[g].push(pid);
  saveData(); showPage('einsacken');
}
function removeFromGroup(g, pid) {
  state.scores.einsacken[g] = state.scores.einsacken[g].filter(x=>x!==pid);
  saveData(); showPage('einsacken');
}
function addEinsackenRound() {
  state.scores.einsacken.rounds.push({ g1:{}, g2:{} });
  saveData(); showPage('einsacken');
}
function removeEinsackenRound(i) {
  state.scores.einsacken.rounds.splice(i,1);
  saveData(); showPage('einsacken');
}
function setEinsackenScore(ri,g,pid,val) {
  const rd = state.scores.einsacken.rounds[ri];
  if (!rd[g]) rd[g]={};
  rd[g][pid] = parseFloat(val)||0;
  saveData(); showPage('einsacken');
}
function getEinsackenRoundWinner(groupScores, members) {
  if (!groupScores || !members || !members.length) return '–';
  let best=-1, winnerId=null;
  members.forEach(pid => {
    const sc = (groupScores[pid])||0;
    if (sc > best) { best=sc; winnerId=pid; }
  });
  return winnerId ? pname(winnerId) + ' (' + best + ')' : '–';
}
function countEinsackenWins(g, pid) {
  return state.scores.einsacken.rounds.reduce((sum,rd) => {
    const members = state.scores.einsacken[g]||[];
    let best = -1;
    members.forEach(p => { const sc=(rd[g]&&rd[g][p])||0; if(sc>best)best=sc; });
    const mysc = (rd[g]&&rd[g][pid])||0;
    return sum + (mysc === best && best >= 0 ? 1 : 0);
  }, 0);
}

// ======================================================
// RENDER: SCHWEINEPARTIE
// ======================================================
function renderSchwein() {
  if (!state.players.length) return noPlayers();
  const wts = [0.2,0.4,0.6,0.8,1.0];
  const entries = state.players.map(p => {
    const sw = state.scores.schwein[p.id]||{vals:[]};
    return { id: p.id, total: sw.vals.reduce((a,x,i)=>a+(x||0)*wts[i],0) };
  });
  const swRanks = {};
  rank(entries, false).forEach(r => { swRanks[r.id] = medal(r.rank); });

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🐷 Schweinepartie / Zahlenlotto</h2>
      <button class="btn-rules" onclick="toggleRules('schwein')">📜 Regeln</button>
    </div>
    <div id="rules_schwein" style="display:none">${rulesHtml('schwein')}</div>
    <div class="schwein-values">
      ${wts.map(w=>`<span class="val-pill">${w.toFixed(2)}€</span>`).join('')}
    </div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Kegel<br>0,20€</th><th>Kegel<br>0,40€</th><th>Kegel<br>0,60€</th>
            <th>Kegel<br>0,80€</th><th>Kegel<br>1,00€</th>
            <th>Ergebnis</th><th>Platz</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const sw = state.scores.schwein[p.id]||{vals:[0,0,0,0,0]};
            const erg = sw.vals.reduce((a,x,i)=>a+(x||0)*wts[i],0);
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              ${sw.vals.map((v,i)=>`<td><input class="score-input" type="number" min="0" max="9" value="${v||0}"
                data-score data-game="schwein" data-pid="${p.id}" data-field="val" data-idx="${i}"></td>`).join('')}
              <td class="sum-cell" id="sw_erg_${p.id}">${erg.toFixed(2)}€</td>
              <td class="rank-cell" id="sw_rank_${p.id}">${swRanks[p.id]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="game-rules" style="margin-top:12px">
      🐷 Das <strong>Schwein</strong> = wer am wenigsten Kegel trifft! Dieser zahlt die Gesamtsumme aller.<br>
      Jeder Kegel hat einen festen Wert. Anzahl × Wert = persönliche Schulden.
    </div>
  </div>`;
}

// ======================================================
// RENDER: TANNENBAUM
// ======================================================
function renderTannenbaum() {
  if (!state.players.length) return noPlayers();
  const tb = state.scores.tannenbaum;
  if (!tb.g1) tb.g1 = [];
  if (!tb.g2) tb.g2 = [];
  if (!tb.rounds) tb.rounds = [];
  if (!tb.g1wins) tb.g1wins = 0;
  if (!tb.g2wins) tb.g2wins = 0;

  // Tree levels: 1,2,3,4,5,4,3,2,1
  const levels = [1,2,3,4,5,4,3,2,1];

  function treeHtml(g) {
    const wins = g === 'g1' ? tb.g1wins : tb.g2wins;
    return `
      <div class="tree-container">
        <div class="tree-title">
          🌲 Gruppe ${g==='g1'?1:2}
          <span class="badge" style="font-size:.8rem">${wins} 🌲 Gewonnen</span>
        </div>
        <div class="tree-visual">
          ${levels.map((n,li) => `
            <div class="tree-row">
              ${Array(n).fill(0).map((_,ni)=>`
                <div class="tree-node ${isTreeFilled(g,li,ni)?'filled':''}" 
                     onclick="toggleTreeNode('${g}',${li},${ni})" title="Ebene ${li+1}, Kegel ${ni+1}">
                  ${n}
                </div>`).join('')}
            </div>`).join('')}
        </div>
        <div style="font-size:.8rem;color:var(--text3);text-align:center;margin-bottom:12px">
          Klicke Kegel an um Treffer zu markieren
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary btn-sm" onclick="completeTree('${g}')">✅ Vollständig!</button>
          <button class="btn-secondary btn-sm" onclick="resetTree('${g}')">↺ Reset</button>
        </div>
        <div style="margin-top:12px">
          <div style="font-size:.75rem;color:var(--text3);margin-bottom:6px">SPIELER IN GRUPPE</div>
          ${(tb[g]||[]).map(pid=>`
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:.82rem">
              <span style="flex:1">${pname(pid)}</span>
              <button class="btn-icon-sm btn-danger-sm" onclick="removeTreePlayer('${g}','${pid}')">✕</button>
            </div>`).join('')}
          <select class="select-input" style="width:100%;margin-top:8px" onchange="addTreePlayer('${g}',this.value);this.value=''">
            <option value="">Spieler hinzufügen...</option>
            ${state.players.filter(p=>!tb.g1.includes(p.id)&&!tb.g2.includes(p.id))
              .map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}
          </select>
        </div>
      </div>`;
  }

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🌲 Tannenbaum</h2>
      <button class="btn-rules" onclick="toggleRules('tannenbaum')">📜 Regeln</button>
    </div>
    <div id="rules_tannenbaum" style="display:none">${rulesHtml('tannenbaum')}</div>
    <div class="tannenbaum-wrapper">
      ${treeHtml('g1')}
      ${treeHtml('g2')}
    </div>
  </div>`;
}

function isTreeFilled(g, level, pos) {
  const tb = state.scores.tannenbaum;
  if (!tb.treeState) tb.treeState = {};
  if (!tb.treeState[g]) tb.treeState[g] = {};
  const key = `${level}_${pos}`;
  return !!tb.treeState[g][key];
}

function toggleTreeNode(g, level, pos) {
  const tb = state.scores.tannenbaum;
  if (!tb.treeState) tb.treeState = {};
  if (!tb.treeState[g]) tb.treeState[g] = {};
  const key = `${level}_${pos}`;
  tb.treeState[g][key] = !tb.treeState[g][key];
  saveData();
  showPage('tannenbaum');
}

function completeTree(g) {
  const tb = state.scores.tannenbaum;
  if (g === 'g1') tb.g1wins = (tb.g1wins||0) + 1;
  else tb.g2wins = (tb.g2wins||0) + 1;
  // Reset tree
  if (!tb.treeState) tb.treeState = {};
  tb.treeState[g] = {};
  saveData();
  showPage('tannenbaum');
  showToast('🌲 Tannenbaum gewonnen! +1 Punkt', 'success');
}

function resetTree(g) {
  const tb = state.scores.tannenbaum;
  if (!tb.treeState) tb.treeState = {};
  tb.treeState[g] = {};
  saveData(); showPage('tannenbaum');
}

function addTreePlayer(g, pid) {
  if (!pid) return;
  state.scores.tannenbaum[g].push(pid);
  saveData(); showPage('tannenbaum');
}
function removeTreePlayer(g, pid) {
  state.scores.tannenbaum[g] = state.scores.tannenbaum[g].filter(x=>x!==pid);
  saveData(); showPage('tannenbaum');
}

// ======================================================
// RENDER: IDIOTENKEGELN
// ======================================================
function renderIdiot() {
  if (!state.players.length) return noPlayers();
  const entries = state.players.map(p => {
    const id = state.scores.idiot[p.id]||{links:0,beine:0,rechts:0};
    return { id: p.id, total: (id.links||0)+(id.beine||0)+(id.rechts||0) };
  });
  const idRanks = {};
  rank(entries).forEach(r => { idRanks[r.id] = medal(r.rank); });

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🤪 Idiotenkegeln</h2>
      <button class="btn-rules" onclick="toggleRules('idiot')">📜 Regeln</button>
    </div>
    <div id="rules_idiot" style="display:none">${rulesHtml('idiot')}</div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>🤚 Links</th>
            <th>🙃 Rückwärts<br>durch d. Beine</th>
            <th>✋ Rechts</th>
            <th>Ergebnis</th>
            <th>Platz</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const id = state.scores.idiot[p.id]||{links:0,beine:0,rechts:0};
            const total = (id.links||0)+(id.beine||0)+(id.rechts||0);
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              <td><input class="score-input" type="number" min="0" max="9" value="${id.links||0}"
                data-score data-game="idiot" data-pid="${p.id}" data-field="links" data-idx="0"></td>
              <td><input class="score-input" type="number" min="0" max="9" value="${id.beine||0}"
                data-score data-game="idiot" data-pid="${p.id}" data-field="beine" data-idx="0"></td>
              <td><input class="score-input" type="number" min="0" max="9" value="${id.rechts||0}"
                data-score data-game="idiot" data-pid="${p.id}" data-field="rechts" data-idx="0"></td>
              <td class="sum-cell" id="idiot_total_${p.id}">${total}</td>
              <td class="rank-cell" id="idiot_rank_${p.id}">${idRanks[p.id]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ======================================================
// RENDER: MENSCH ÄRGER DICH NICHT
// ======================================================
function renderMensch() {
  if (!state.players.length) return noPlayers();
  const entries = state.players.map(p => ({
    id: p.id, total: s((state.scores.mensch[p.id]||{throws:[]}).throws)
  }));
  const mRanks = {};
  rank(entries).forEach(r => { mRanks[r.id] = medal(r.rank); });

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🎲 Mensch-ärger-dich-nicht</h2>
      <button class="btn-rules" onclick="toggleRules('mensch')">📜 Regeln</button>
    </div>
    <div id="rules_mensch" style="display:none">${rulesHtml('mensch')}</div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Name</th>
            ${Array(10).fill(0).map((_,i)=>`<th>W${i+1}</th>`).join('')}
            <th>Gesamt</th><th>Platz</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const m = state.scores.mensch[p.id]||{throws:Array(10).fill(0)};
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              ${m.throws.map((v,i)=>`<td><input class="score-input" type="number" min="0" max="9" value="${v||0}"
                data-score data-game="mensch" data-pid="${p.id}" data-field="throw" data-idx="${i}"></td>`).join('')}
              <td class="sum-cell" id="mensch_total_${p.id}">${s(m.throws)}</td>
              <td class="rank-cell" id="mensch_rank_${p.id}">${mRanks[p.id]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ======================================================
// RENDER: BUSFAHREN
// ======================================================
function renderBus() {
  if (!state.players.length) return noPlayers();
  const bs = state.scores.bus;
  if (!bs.assignments) bs.assignments = {};
  if (!bs.scores)      bs.scores      = Array(9).fill(0);
  if (bs.scores.length < 9) while(bs.scores.length<9) bs.scores.push(0);

  const busNames = ['Bus 1','Bus 2','Bus 3','Bus 4','Bus 5','Bus 6','Bus 7','Bus 8','Bus 9'];
  const busEmojis = ['🚌','🚌','🚍','🚌','🚌','🚍','🚌','🚌','🚍'];

  // Calc per-bus scores from player assignments
  const busTotals = Array(9).fill(0);
  state.players.forEach(p => {
    const bi = bs.assignments[p.id];
    if (bi !== undefined && bi >= 0 && bi < 9) busTotals[bi] += bs.scores[p.id]||0;
  });

  const busRanked = {};
  const busEntries = busNames.map((_,i)=>({id:i, total: busTotals[i]}));
  rank(busEntries).forEach(r=>{ busRanked[r.id]=medal(r.rank); });

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🚌 Busfahren</h2>
      <button class="btn-rules" onclick="toggleRules('bus')">📜 Regeln</button>
    </div>
    <div id="rules_bus" style="display:none">${rulesHtml('bus')}</div>

    <div style="margin-bottom:16px">
      <h3 style="font-size:.9rem;color:var(--text3);margin-bottom:10px">SPIELER → BUS ZUORDNUNG</h3>
      <div class="table-wrapper">
        <table class="score-table">
          <thead><tr><th>Spieler</th><th>Bus</th><th>Punkte (Räder)</th></tr></thead>
          <tbody>
            ${state.players.map(p=>`<tr>
              <td class="name-cell">${esc(p.name)}</td>
              <td>
                <select class="select-input" onchange="assignBus('${p.id}',this.value)">
                  <option value="-1">– kein Bus –</option>
                  ${busNames.map((bn,bi)=>`<option value="${bi}" ${bs.assignments[p.id]===bi?'selected':''}>${bn}</option>`).join('')}
                </select>
              </td>
              <td>
                <input class="score-input-sm" type="number" min="0" max="99" value="${bs.scores[p.id]||0}"
                  onchange="setBusScore('${p.id}',this.value)">
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <hr class="sect-divider">
    <h3 style="font-size:.9rem;color:var(--text3);margin-bottom:12px">BUS-RANGLISTE</h3>
    <div class="bus-grid">
      ${busNames.map((bn,i) => {
        const passengers = state.players.filter(p=>bs.assignments[p.id]===i);
        return `<div class="bus-card">
          <div class="bus-icon">${busEmojis[i]}</div>
          <div class="bus-name">${bn}</div>
          <div class="bus-rads">${busTotals[i]}</div>
          <div class="bus-rads-label">Räder</div>
          <div style="font-size:1.5rem">${busRanked[i]||'–'}</div>
          <div class="bus-players">${passengers.map(p=>esc(p.name)).join(', ')||'Keine Passagiere'}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function assignBus(pid, bi) {
  const idx = parseInt(bi);
  if (idx < 0) delete state.scores.bus.assignments[pid];
  else state.scores.bus.assignments[pid] = idx;
  saveData(); showPage('bus');
}

function setBusScore(pid, val) {
  state.scores.bus.scores[pid] = parseFloat(val)||0;
  saveData();
}

// ======================================================
// RENDER: KEGELBUCH
// ======================================================
function renderKegelbuch() {
  if (!state.players.length) return noPlayers();
  const wts = [0.2,0.4,0.6,0.8,1.0];

  // Overall points calculation per player
  function getPoints(pid) {
    const hn  = state.scores.hausnummer[pid]||{gross:[],klein:[]};
    const sv  = state.scores.sv[pid]||{throws:[],karte:0};
    const rn  = state.scores.rennen[pid]||{days:[]};
    const id  = state.scores.idiot[pid]||{links:0,beine:0,rechts:0};
    const mn  = state.scores.mensch[pid]||{throws:[]};
    const sw  = state.scores.schwein[pid]||{vals:[]};
    const svT = s(sv.throws)+(sv.karte||0);
    return s(hn.gross)+s(hn.klein)+svT+rn.days.reduce((a,v,i)=>a+(v||0)*(i+1),0)+
           (id.links||0)+(id.beine||0)+(id.rechts||0)+s(mn.throws);
  }

  function getSchweinSchuld(pid) {
    const sw = state.scores.schwein[pid]||{vals:[]};
    return sw.vals.reduce((a,x,i)=>a+(x||0)*wts[i],0);
  }

  const totalPunkte = state.players.reduce((a,p)=>a+getPoints(p.id),0);
  const totalSchwein = state.players.reduce((a,p)=>a+getSchweinSchuld(p.id),0);

  return `
  <div class="page-card">
    <div class="card-header"><h2>📖 Kegelbuch</h2></div>
    <div class="kegelbuch-totals">
      <div class="total-card"><div class="val">${state.players.length}</div><div class="lbl">Spieler</div></div>
      <div class="total-card"><div class="val">${totalPunkte}</div><div class="lbl">Gesamtpunkte</div></div>
      <div class="total-card"><div class="val">${totalSchwein.toFixed(2)}€</div><div class="lbl">Schweinpartie Σ</div></div>
      <div class="total-card"><div class="val">${state.scores.fuchs.rounds.length}</div><div class="lbl">Fuchs-Runden</div></div>
    </div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Startgeld</th>
            <th>Pudel<br>(0er)</th>
            <th>Stina<br>(alle 9)</th>
            <th>Schwein-<br>partie €</th>
            <th>Zu zahlen</th>
            <th>Punkte<br>Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const kb = state.kegelbuch[p.id]||{startgeld:false,pudel:0,stina:0};
            const sw = getSchweinSchuld(p.id);
            const pts = getPoints(p.id);
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              <td><input type="checkbox" ${kb.startgeld?'checked':''} onchange="toggleStartgeld('${p.id}',this.checked)"></td>
              <td><input class="score-input" type="number" min="0" max="99" value="${kb.pudel||0}"
                data-score data-game="kb" data-pid="${p.id}" data-field="pudel" data-idx="0"></td>
              <td><input class="score-input" type="number" min="0" max="99" value="${kb.stina||0}"
                data-score data-game="kb" data-pid="${p.id}" data-field="stina" data-idx="0"></td>
              <td class="sum-cell">${sw.toFixed(2)}€</td>
              <td class="rank-cell" id="kb_zahlen_${p.id}" style="color:var(--danger)">${sw.toFixed(2)}€</td>
              <td class="sum-cell">${pts}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="game-rules" style="margin-top:12px">
      <strong>Pudel</strong> = Kein Kegel getroffen (0) &nbsp;|&nbsp;
      <strong>Stina</strong> = Alle 9 Kegel auf einmal (Volle) &nbsp;|&nbsp;
      <strong>Startgeld</strong> = Eintrittsgebühr bezahlt ✓
    </div>
  </div>`;
}

function toggleStartgeld(pid, checked) {
  if (!state.kegelbuch[pid]) state.kegelbuch[pid]={};
  state.kegelbuch[pid].startgeld = checked;
  saveData();
}

// ======================================================
// RENDER: AUSWERTUNG
// ======================================================
function renderAuswertung() {
  if (!state.players.length) return noPlayers();
  const wts = [0.2, 0.4, 0.6, 0.8, 1.0];

  // ---- Points per game per player ----
  function pts_hausnummer(pid) {
    const hn = state.scores.hausnummer[pid] || { gross: [], klein: [] };
    return s(hn.gross) + s(hn.klein);
  }
  function pts_sv(pid) {
    const sv = state.scores.sv[pid] || { throws: [], karte: 0 };
    const t = s(sv.throws) + (sv.karte || 0);
    return t > 17 ? 0 : t;          // busted = 0 points
  }
  function pts_rennen(pid) {
    const r = state.scores.rennen[pid] || { days: [] };
    return r.days.reduce((a, v, i) => a + (v || 0) * (i + 1), 0);
  }
  function pts_idiot(pid) {
    const id = state.scores.idiot[pid] || { links: 0, beine: 0, rechts: 0 };
    return (id.links || 0) + (id.beine || 0) + (id.rechts || 0);
  }
  function pts_mensch(pid) {
    return s((state.scores.mensch[pid] || { throws: [] }).throws);
  }
  function pts_fuchs(pid) {
    const fr = state.scores.fuchs;
    if (!fr || !fr.rounds) return 0;
    return fr.rounds.reduce((sum, rd) => {
      if (pid === fr.fuchsId) {
        // Fox gets point if at least one hunter FAILS to beat it
        const allCaught = state.players
          .filter(h => h.id !== fr.fuchsId)
          .every(h => ((rd.hunters && rd.hunters[h.id]) || 0) > (rd.fuchsScore || 0));
        return sum + (allCaught ? 0 : 1);
      } else {
        // Hunter gets point if they beat the fox
        return sum + (((rd.hunters && rd.hunters[pid]) || 0) > (rd.fuchsScore || 0) ? 1 : 0);
      }
    }, 0);
  }
  function pts_einsacken(pid) {
    const es = state.scores.einsacken;
    let g = null;
    if ((es.g1 || []).includes(pid)) g = 'g1';
    else if ((es.g2 || []).includes(pid)) g = 'g2';
    if (!g) return 0;
    return (es.rounds || []).reduce((sum, rd) => {
      const members = es[g] || [];
      let best = -1;
      members.forEach(p => { const sc = (rd[g] && rd[g][p]) || 0; if (sc > best) best = sc; });
      return sum + (((rd[g] && rd[g][pid]) || 0) === best && best > 0 ? 1 : 0);
    }, 0);
  }

  function allPoints(pid) {
    return pts_hausnummer(pid) + pts_sv(pid) + pts_rennen(pid) +
           pts_idiot(pid) + pts_mensch(pid) + pts_fuchs(pid) + pts_einsacken(pid);
  }

  // ---- Overall ranking ----
  const overallEntries = state.players.map(p => ({ id: p.id, name: p.name, total: allPoints(p.id) }));
  const overallRanked  = rank(overallEntries);

  // ---- Per-game winners (return raw name string, not escaped) ----
  function gameWinner(scoreFn, higherBetter = true) {
    const entries = state.players.map(p => ({ id: p.id, name: p.name, total: scoreFn(p.id) }));
    const ranked  = rank(entries, higherBetter);
    const winners = ranked.filter(r => r.rank === 1);
    if (!winners.length || winners[0].total === 0) return null;
    return {
      names: winners.map(w => esc(w.name)).join(' &amp; '),
      score: winners[0].total
    };
  }

  const gameWinners = [
    { title: '🏠 Große Hausnummer',  w: gameWinner(pid => s((state.scores.hausnummer[pid] || { gross: [] }).gross)) },
    { title: '🏠 Kleine Hausnummer', w: gameWinner(pid => s((state.scores.hausnummer[pid] || { klein: [] }).klein)) },
    { title: '🃏 17 und 4',          w: gameWinner(pid => { const sv = state.scores.sv[pid] || { throws: [], karte: 0 }; const t = s(sv.throws) + (sv.karte || 0); return t > 17 ? -1 : t; }) },
    { title: '🚀 6-Tage-Rennen',     w: gameWinner(pts_rennen) },
    { title: '🐷 Schwein. (höchst)', w: gameWinner(pid => { const sw = state.scores.schwein[pid] || { vals: [] }; return sw.vals.reduce((a, x, i) => a + (x || 0) * wts[i], 0); }) },
    { title: '🤪 Idiotenkegeln',     w: gameWinner(pts_idiot) },
    { title: '🎲 Mensch ä.d.n.',     w: gameWinner(pts_mensch) },
    { title: '🦊 Fuchs',            w: gameWinner(pts_fuchs) },
    { title: '💰 Einsacken',        w: gameWinner(pts_einsacken) },
  ];

  // ---- Podium top3 (sorted desc already by rank()) ----
  const sorted3 = overallRanked.slice(0, 3);
  while (sorted3.length < 3) sorted3.push(null);
  // Podium layout: 2nd left, 1st center, 3rd right
  const podiumOrder = [sorted3[1], sorted3[0], sorted3[2]];
  const podiumCls   = ['p2', 'p1', 'p3'];
  const podiumTroph = ['🥈', '🥇', '🥉'];

  function podiumCard(entry, cls, trophy) {
    if (!entry) {
      return `<div class="podium-place ${cls}">
        <div class="podium-block" style="opacity:.3">–</div>
      </div>`;
    }
    return `
      <div class="podium-place ${cls}">
        <div class="podium-trophy">${trophy}</div>
        <div class="podium-name">${esc(entry.name)}</div>
        <div class="podium-score">${entry.total} Pkt</div>
        <div class="podium-block">${entry.rank}.</div>
      </div>`;
  }

  // ---- Breakdown table columns ----
  const breakCols = ['Haus','17u4','Rennen','Idiot','Mensch','Fuchs','Eins.'];
  const breakFns  = [pts_hausnummer, pts_sv, pts_rennen, pts_idiot, pts_mensch, pts_fuchs, pts_einsacken];

  return `
  <div class="page-card">
    <div class="card-header"><h2>🏆 Gesamtauswertung</h2></div>

    <!-- PODIUM -->
    <div class="podium-section">
      ${podiumOrder.map((e,i) => podiumCard(e, podiumCls[i], podiumTroph[i])).join('')}
    </div>

    <!-- GESAMTRANGLISTE -->
    <hr class="sect-divider">
    <h3 style="font-size:.85rem;color:var(--text3);margin-bottom:10px;letter-spacing:1px">GESAMTRANGLISTE</h3>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Platz</th>
            <th>Name</th>
            ${breakCols.map(c => `<th style="font-size:.68rem">${c}</th>`).join('')}
            <th>Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${overallRanked.map(r => `
            <tr style="${r.rank <= 3 ? 'background:rgba(232,160,32,.06)' : ''}">
              <td class="rank-cell" style="font-size:1.05rem">${medal(r.rank)}</td>
              <td class="name-cell">${esc(r.name)}</td>
              ${breakFns.map(fn => `<td style="font-size:.78rem;color:var(--text2)">${fn(r.id)}</td>`).join('')}
              <td class="sum-cell">${r.total}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- SPIELSIEGER -->
    <hr class="sect-divider">
    <h3 style="font-size:.85rem;color:var(--text3);margin-bottom:10px;letter-spacing:1px">SPIELSIEGER</h3>
    <div class="game-results-grid">
      ${gameWinners.map(gw => `
        <div class="game-result-card">
          <div class="game-name">${gw.title}</div>
          ${gw.w
            ? `<div class="winner">🥇 ${gw.w.names}</div>
               <div class="score">${typeof gw.w.score === 'number' ? (Number.isInteger(gw.w.score) ? gw.w.score : gw.w.score.toFixed(2)) : gw.w.score} Pkt</div>`
            : `<div class="winner" style="color:var(--text3)">– Noch keine Daten –</div>`}
        </div>`).join('')}
      <div class="game-result-card">
        <div class="game-name">🌲 Tannenbaum</div>
        <div class="winner">
          G1: ${state.scores.tannenbaum.g1wins || 0} 🌲 &nbsp;|&nbsp; G2: ${state.scores.tannenbaum.g2wins || 0} 🌲
        </div>
        <div class="score">
          ${(state.scores.tannenbaum.g1wins || 0) > (state.scores.tannenbaum.g2wins || 0) ? '🥇 Gruppe 1 gewinnt!'
          : (state.scores.tannenbaum.g2wins || 0) > (state.scores.tannenbaum.g1wins || 0) ? '🥇 Gruppe 2 gewinnt!'
          : 'Unentschieden'}
        </div>
      </div>
    </div>
  </div>`;
}

// ======================================================
// MODAL HELPERS
// ======================================================
function showInputModal(title, defaultVal, callback) {
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <div class="modal-title">${esc(title)}</div>
    <input class="modal-input" id="modalInput" type="text" value="${esc(defaultVal)}" maxlength="50">
    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-modal-ok" onclick="submitInputModal()">OK</button>
    </div>`;
  document._modalCb = callback;
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => { const i = document.getElementById('modalInput'); if(i){i.focus();i.select();} }, 50);
  const inp = document.getElementById('modalInput');
  if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') submitInputModal(); if(e.key==='Escape') closeModal(); });
}

function submitInputModal() {
  const val = document.getElementById('modalInput')?.value || '';
  const cb = document._modalCb;   // save BEFORE closeModal nulls it
  closeModal();
  if (cb) cb(val);
}

function showConfirm(title, msg, callback) {
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <div class="modal-title">${esc(title)}</div>
    <div class="modal-sub">${esc(msg)}</div>
    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-modal-confirm-delete" onclick="confirmAction()">Bestätigen</button>
    </div>`;
  document._modalCb = callback;
  document.getElementById('modal').classList.remove('hidden');
}

function confirmAction() {
  const cb = document._modalCb;   // save BEFORE closeModal nulls it
  closeModal();
  if (cb) cb();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document._modalCb = null;
}

// ======================================================
// TOAST
// ======================================================
let _toastTimer = null;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.className='toast hidden'; }, 300);
  }, 2200);
}

// ======================================================
// RULES TOGGLE
// ======================================================
function toggleRules(id) {
  const el = document.getElementById('rules_'+id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
