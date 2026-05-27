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
      hausnummer: {},     // id: {gross:{H,Z,E}, klein:{H,Z,E}}
      sv:         {},     // id: {throws:[7], karte:0}
      fuchs: { fuchsId: null, rounds: [] },
                          // rounds: [{fochScore, hunters:{id:score}}]
      rennen: { teams: [], days: {} },  // teams:[{id,name,p1,p2}], days:{pid:[6]}
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
    migrateRennen();
    migrateHausnummer();
    migrateDuplicateIds();       // KRITISCH: doppelte IDs reparieren
    themeIdx = Math.max(0, THEMES.indexOf(state.theme));
    applyTheme(state.theme);
    const nameEl = document.getElementById('sessionNameDisplay');
    if (nameEl) nameEl.textContent = state.session.name + ' ✏️';
  } catch(e) { console.warn('Load error', e); }
  updateFooter();
}

// Migrate old rennen format {pid:{days:[...]}} → {teams:[], days:{pid:[...]}}
function migrateRennen() {
  const rn = state.scores.rennen;
  if (rn.days && Array.isArray(rn.teams)) return; // already new format
  const newDays = {};
  for (const key in rn) {
    if (key !== 'teams' && key !== 'days' && rn[key] && Array.isArray(rn[key].days)) {
      newDays[key] = rn[key].days;
    }
  }
  state.scores.rennen = { teams: rn.teams || [], days: newDays };
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

// Migrate old hausnummer format {gross:[v1,v2,v3]} → {gross:{H,Z,E}}
function migrateHausnummer() {
  for (const pid in state.scores.hausnummer) {
    const hn = state.scores.hausnummer[pid];
    ['gross','klein'].forEach(f => {
      if (Array.isArray(hn[f])) {
        hn[f] = { H: hn[f][0]||0, Z: hn[f][1]||0, E: hn[f][2]||0 };
      }
    });
  }
}
// Repariert doppelte Spieler-IDs (verursacht durch Date.now()-Kollision beim Massen-Import)
function migrateDuplicateIds() {
  const seen = new Set();
  let fixed = false;
  state.players.forEach(p => {
    if (seen.has(p.id)) {
      const newId = genId();
      const oldId = p.id;
      p.id = newId;
      // Scores vom alten Schlüssel kopieren
      ['hausnummer','sv','schwein','idiot','mensch'].forEach(g => {
        if (state.scores[g]?.[oldId])
          state.scores[g][newId] = JSON.parse(JSON.stringify(state.scores[g][oldId]));
      });
      if (state.scores.rennen.days?.[oldId])
        state.scores.rennen.days[newId] = [...state.scores.rennen.days[oldId]];
      if (state.kegelbuch[oldId])
        state.kegelbuch[newId] = JSON.parse(JSON.stringify(state.kegelbuch[oldId]));
      fixed = true;
    } else {
      seen.add(p.id);
    }
  });
  if (fixed) console.info('migrateDuplicateIds: Doppelte IDs repariert.');
}

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
// Eindeutiger ID-Generator — kein Date.now()-Duplikat bei Massen-Import
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
  if (!state.scores.hausnummer[id]) state.scores.hausnummer[id] = { gross:{H:0,Z:0,E:0}, klein:{H:0,Z:0,E:0} };
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

// ======================================================
// RENDER: HAUSNUMMER
// ======================================================
function renderHausnummer() {
  if (!state.players.length) return noPlayers();

  // Pre-compute ranks
  const gRanks = {}, kRanks = {};
  rank(state.players.map(p=>({id:p.id, total:grossHN(p.id)})), true)
    .forEach(r => { gRanks[r.id] = medal(r.rank); });
  rank(state.players.map(p=>({id:p.id, total:kleinHN(p.id)})), false)
    .forEach(r => { kRanks[r.id] = medal(r.rank); });

  // Input cell helper: data-idx is the position key H/Z/E
  function inp(pid, field, pos, val) {
    return `<input class="score-input" type="number" min="0" max="9" value="${val}"
      data-score data-game="hausnummer" data-pid="${pid}" data-field="${field}" data-idx="${pos}">`;
  }

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🏠 Große &amp; Kleine Hausnummer</h2>
      <button class="btn-rules" onclick="toggleRules('hausnummer')">📜 Regeln</button>
    </div>
    <div id="rules_hausnummer" style="display:none">${rulesHtml('hausnummer')}</div>

    <div class="game-rules">
      <strong>Große HN:</strong> Ziffern auf Hunderter / Zehner / Einer verteilen → <em>höchste</em> 3-stellige Zahl gewinnt. Pudel (0) = zählt als 0.<br>
      <strong>Kleine HN:</strong> Ziffern auf H / Z / E verteilen → <em>niedrigste</em> Zahl gewinnt. 0 ist ein gültiger Wurf (Kugel rollt durch) und zählt als 0!
    </div>

    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th rowspan="2">Name</th>
            <th colspan="3" class="section-header gross">🔼 Große Hausnummer</th>
            <th class="section-header gross">Zahl</th>
            <th class="section-header gross">Platz</th>
            <th colspan="3" class="section-header klein">🔽 Kleine Hausnummer</th>
            <th class="section-header klein">Zahl</th>
            <th class="section-header klein">Platz</th>
          </tr>
          <tr>
            <th title="Hunderterstelle">H</th>
            <th title="Zehnerstelle">Z</th>
            <th title="Einerstelle">E</th>
            <th></th><th></th>
            <th title="Hunderterstelle">H</th>
            <th title="Zehnerstelle">Z</th>
            <th title="Einerstelle">E</th>
            <th></th><th></th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const hn = state.scores.hausnummer[p.id] || { gross:{H:0,Z:0,E:0}, klein:{H:0,Z:0,E:0} };
            const g  = hn.gross || {H:0,Z:0,E:0};
            const k  = hn.klein || {H:0,Z:0,E:0};
            const gNum = grossHN(p.id);
            const kNum = kleinHN(p.id);
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              <td>${inp(p.id,'gross','H', g.H||0)}</td>
              <td>${inp(p.id,'gross','Z', g.Z||0)}</td>
              <td>${inp(p.id,'gross','E', g.E||0)}</td>
              <td class="sum-cell" id="hn_gross_num_${p.id}" style="font-size:1rem;font-weight:800;letter-spacing:1px">${gNum}</td>
              <td class="rank-cell" id="hn_gross_rank_${p.id}">${gRanks[p.id]||'–'}</td>
              <td>${inp(p.id,'klein','H', k.H||0)}</td>
              <td>${inp(p.id,'klein','Z', k.Z||0)}</td>
              <td>${inp(p.id,'klein','E', k.E||0)}</td>
              <td class="sum-cell" id="hn_klein_num_${p.id}" style="font-size:1rem;font-weight:800;letter-spacing:1px">${kNum}</td>
              <td class="rank-cell" id="hn_klein_rank_${p.id}">${kRanks[p.id]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="game-rules" style="margin-top:10px;font-size:.78rem">
      💡 Tipp: Bei der <strong>Großen HN</strong> höchste Zahl auf den Hunderter setzen (z.B. 8-6-3 → <strong>863</strong>).
      Bei der <strong>Kleinen HN</strong> niedrigste Zahl auf den Hunderter setzen (z.B. 1-2-5 → <strong>125</strong>).
      Eine 0 zählt als 0 (Kugel rollt durch) — das ist kein Pudel!
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
    return { id: p.id, total: total > 21 ? -1 : total };
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
              <td class="total-cell${ges>21?' over-limit':ges===21?' exact-hit':''}" id="sv_gesamt_${p.id}">${ges}</td>
              <td class="rank-cell" id="sv_rank_${p.id}">${svRanks[p.id]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="game-rules" style="margin-top:12px">
      🔴 <strong>Rot</strong> = Über 21 (verloren) &nbsp;|&nbsp; 🟢 <strong>Grün</strong> = Genau 21 (Perfekt!)
    </div>
  </div>`;
}

// ======================================================
// RENDER: FUCHSJAGD  (finale Regeln)
// Fuchs baut Gesamtsumme auf (Ziel: 31)
// Alle Jäger werfen je Runde — ihre kombinierte Summe muss Fox-Gesamt erreichen
// ======================================================
function renderFuchs() {
  if (!state.players.length) return noPlayers();
  const fr = state.scores.fuchs;
  if (!fr.fuchsWins)  fr.fuchsWins  = 0;
  if (!fr.hunterWins) fr.hunterWins = 0;
  if (!fr.kaetschen)  fr.kaetschen  = [];

  const fuchsPlayer = state.players.find(p => p.id === fr.fuchsId);
  const hunters     = state.players.filter(p => p.id !== fr.fuchsId);
  const active      = fr.active;

  function turnLabel() {
    if (!active) return '';
    const fn = esc(fuchsPlayer?.name || '?');
    if (active.phase === 'fox_links')  return `🦊 <strong>${fn}</strong> — Vorwurf <em>Linke Hand</em> 🤚`;
    if (active.phase === 'fox_rechts') return `🦊 <strong>${fn}</strong> — Vorwurf <em>Rechte Hand</em> ✋`;
    if (active.phase === 'fox')        return `🦊 <strong>${fn}</strong> — normaler Wurf`;
    if (active.phase === 'hunter') {
      const h = hunters[active.hunterIdx % hunters.length];
      return `🏹 Jäger: <strong>${esc(h?.name || '?')}</strong>`;
    }
    return '';
  }

  const foxTotal   = active?.foxTotal || 0;
  const foxPct     = Math.min(100, (foxTotal / 31) * 100);
  const barColor   = foxPct >= 80 ? 'var(--danger)' : foxPct >= 50 ? 'var(--warning)' : 'var(--success)';
  const hRoundTotal = active?.hunterRoundTotal || 0;
  const isHunterPhase = active?.phase === 'hunter';

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🦊 Fuchsjagd</h2>
      <button class="btn-rules" onclick="toggleRules('fuchs')">📜 Regeln</button>
    </div>
    <div id="rules_fuchs" style="display:none">${rulesHtml('fuchs')}</div>

    <!-- FUCHS-WAHL & STEUERUNG -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--bg3);padding:12px;border-radius:var(--radius);border:1px solid var(--border);margin-bottom:14px">
      <span style="font-weight:700;color:var(--accent)">🦊 Fuchs:</span>
      <select class="select-input" onchange="setFuchs(this.value)" ${active ? 'disabled' : ''}>
        <option value="">— Fuchs wählen —</option>
        ${state.players.map(p => `<option value="${p.id}" ${fr.fuchsId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
      </select>
      ${fuchsPlayer ? `<span style="font-size:.8rem;color:var(--text3)">🏹 ${hunters.map(h => esc(h.name)).join(', ') || '(keine Jäger)'}</span>` : ''}
      <div style="display:flex;gap:6px;margin-left:auto;flex-wrap:wrap">
        ${fuchsPlayer && !active
          ? `<button class="btn-primary btn-sm" onclick="startKaetsche()">🎯 Neue Kätsche</button>` : ''}
        ${active
          ? `<button class="btn-secondary btn-sm" onclick="undoFuchsThrow()" ${!active.turns.length ? 'disabled' : ''}>↺ Rückgängig</button>
             <button class="btn-secondary btn-sm" onclick="resetKaetsche()">✕ Abbrechen</button>` : ''}
        ${fr.kaetschen.length > 0 && !active
          ? `<button class="btn-secondary btn-sm" onclick="resetFuchs()">🗑️ Reset</button>` : ''}
      </div>
    </div>

    ${!fuchsPlayer ? '<div class="empty-state">Bitte zuerst einen Fuchs auswählen!</div>' : ''}

    ${active ? `
    <!-- DOPPEL-FORTSCHRITTSBALKEN: FUCHS vs JÄGER -->
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:12px">

      <!-- Fuchs-Balken -->
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <span style="font-weight:700;color:var(--accent);font-size:.9rem">🦊 Fuchs</span>
        <span style="font-weight:800;font-size:1.3rem;color:${foxTotal>=25?'var(--danger)':'var(--text)'}">
          ${foxTotal} <span style="font-size:.75rem;color:var(--text3)">/ 31</span>
        </span>
      </div>
      <div style="background:var(--surface);border-radius:20px;height:18px;overflow:hidden;margin-bottom:10px">
        <div style="background:${barColor};height:100%;width:${foxPct}%;transition:width .4s;border-radius:20px;
             box-shadow:0 0 8px ${barColor}40"></div>
      </div>

      <!-- Jäger-Balken -->
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <span style="font-weight:700;color:var(--accent2);font-size:.9rem">🏹 Jäger Gesamt</span>
        <span style="font-weight:800;font-size:1.3rem;
          color:${(active?.huntersCumTotal||0)>=foxTotal&&foxTotal>0?'var(--success)':'var(--text)'}">
          ${active?.huntersCumTotal||0}
          <span style="font-size:.75rem;color:var(--text3)">/ ${foxTotal||'?'}</span>
        </span>
      </div>
      <div style="background:var(--surface);border-radius:20px;height:18px;overflow:hidden;margin-bottom:6px">
        <div style="background:${(active?.huntersCumTotal||0)>=foxTotal&&foxTotal>0?'var(--success)':'var(--accent2)'};
             height:100%;width:${foxTotal>0?Math.min(100,((active?.huntersCumTotal||0)/foxTotal)*100):0}%;
             transition:width .3s;border-radius:20px"></div>
      </div>

      <!-- Differenz-Anzeige -->
      <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--text3)">
        <span>Fuchs braucht noch <strong>${31-foxTotal}</strong> bis Sieg</span>
        <span>Jäger brauchen noch
          <strong style="color:${(active?.huntersCumTotal||0)>=foxTotal&&foxTotal>0?'var(--success)':'var(--accent2)'}">
            ${Math.max(0,foxTotal-(active?.huntersCumTotal||0))}
          </strong> zum Fangen
        </span>
      </div>
    </div>

    <!-- AKTUELLER ZUG -->
    <div style="background:var(--surface2);border:2px solid ${isHunterPhase ? 'var(--accent2)' : 'var(--accent)'};border-radius:var(--radius);padding:16px;margin-bottom:12px">
      <div style="font-size:.7rem;color:var(--text3);letter-spacing:1px;margin-bottom:6px">AKTUELLER ZUG</div>
      <div style="font-size:1.05rem;margin-bottom:12px">${turnLabel()}</div>
      ${isHunterPhase ? `
        <div style="font-size:.8rem;background:var(--bg3);padding:6px 10px;border-radius:var(--radius);margin-bottom:10px;color:var(--text2)">
          Fuchs-Gesamt: <strong>${foxTotal}</strong> —
          Jäger bisher (kumulativ): <strong>${active?.huntersCumTotal||0}</strong> —
          Noch <strong style="color:var(--accent2)">${Math.max(0,foxTotal-(active?.huntersCumTotal||0))}</strong> zum Fangen
        </div>` : ''}
      <div style="display:flex;gap:8px;align-items:center">
        <input class="score-input-sm" type="number" id="fuchs_input" min="0" max="9" value="0"
          style="font-size:1.3rem;width:64px;height:42px;text-align:center"
          onkeydown="if(event.key==='Enter')processFuchsThrow()">
        <button class="btn-primary" onclick="processFuchsThrow()" style="padding:10px 22px">✅ Bestätigen</button>
      </div>
    </div>

    <!-- TURN-LOG -->
    ${active.turns.length > 0 ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px;max-height:240px;overflow-y:auto">
      <div style="font-size:.72rem;font-weight:700;color:var(--text3);margin-bottom:6px;letter-spacing:1px">
        VERLAUF — KÄTSCHE ${fr.kaetschen.length + 1}
      </div>
      ${[...active.turns].reverse().map(t =>
        t.who === 'fox'
          ? `<div style="padding:3px 0;border-bottom:1px solid var(--border);font-size:.8rem;color:var(--accent)">
               🦊 ${esc(fuchsPlayer?.name || '?')}${t.hand === 'L' ? ' 🤚' : t.hand === 'R' ? ' ✋' : ''}:
               <strong>${t.score}</strong> → Gesamt <strong>${t.foxTotal}</strong>
             </div>`
          : `<div style="padding:3px 0;border-bottom:1px solid var(--border);font-size:.8rem;color:var(--text2)">
               🏹 ${esc(t.whoName || '?')}: <strong>${t.score}</strong>
               <span style="color:var(--text3)"> (Jäger-Gesamt: ${t.cumTotal||t.roundTotal})</span>
             </div>`
      ).join('')}
    </div>` : ''}
    ` : ''}

    <!-- KÄTSCHE-CHRONIK -->
    ${fr.kaetschen.length > 0 && !active ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px">
      <div style="font-size:.72rem;font-weight:700;color:var(--text3);margin-bottom:8px;letter-spacing:1px">
        KÄTSCHE-CHRONIK — Fuchs: ${fr.fuchsWins} | Jäger: ${fr.hunterWins}
      </div>
      ${fr.kaetschen.map((k, i) => `
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:.82rem">
          <span style="color:var(--text3)">Kätsche ${i + 1}</span>
          <span style="font-weight:700;color:${k.winner === 'fox' ? 'var(--accent)' : 'var(--accent2)'}">
            ${k.winner === 'fox'
              ? `🦊 Fuchs (${k.foxFinal} Pkt)`
              : `🏹 Jäger (Fox war bei ${k.foxFinal})`}
          </span>
        </div>`).join('')}
    </div>` : ''}
  </div>`;
}

// ── Fuchs auswählen ──
function setFuchs(id) {
  if (state.scores.fuchs.active) return;
  state.scores.fuchs.fuchsId = id;
  saveData(); showPage('fuchs');
}

// ── Neue Kätsche starten ──
function startKaetsche() {
  const fr = state.scores.fuchs;
  if (!fr.fuchsId) { showToast('Bitte zuerst Fuchs auswählen!', 'error'); return; }
  const hunters = state.players.filter(p => p.id !== fr.fuchsId);
  if (!hunters.length) { showToast('Mindestens 1 Jäger nötig!', 'error'); return; }
  fr.active = {
    foxTotal: 0, lastFoxThrow: 0,
    phase: 'fox_links',
    hunterIdx: 0,
    hunterRoundTotal: 0,
    huntersCumTotal: 0,
    turns: [], complete: false, winner: null
  };
  saveData(); showPage('fuchs');
}

// ── Wurf verarbeiten ──
function processFuchsThrow() {
  const score = parseInt(document.getElementById('fuchs_input')?.value ?? 0) || 0;
  const fr    = state.scores.fuchs;
  const active = fr.active;
  if (!active || active.complete) return;
  const hunters = state.players.filter(p => p.id !== fr.fuchsId);
  const fuchsPlayer = state.players.find(p => p.id === fr.fuchsId);

  // ── FUCHS wirft ──
  if (['fox_links', 'fox_rechts', 'fox'].includes(active.phase)) {
    active.foxTotal    += score;
    active.lastFoxThrow = score;
    active.turns.push({
      who: 'fox',
      hand: active.phase === 'fox_links' ? 'L' : active.phase === 'fox_rechts' ? 'R' : null,
      score, foxTotal: active.foxTotal
    });
    if (active.foxTotal >= 31) {
      fr.fuchsWins++;
      fr.kaetschen.push({ winner: 'fox', foxFinal: active.foxTotal });
      fr.active = null;
      saveData(); showPage('fuchs');
      showToast('🦊 Fuchs gewinnt! 31 erreicht!', 'success');
      return;
    }
    // Phase: L→R→hunter, rechts/fox→hunter
    active.phase = active.phase === 'fox_links' ? 'fox_rechts' : 'hunter';
    active.hunterIdx = 0;
    active.hunterRoundTotal = 0;

  // ── JÄGER wirft ──
  } else if (active.phase === 'hunter') {
    const hi     = active.hunterIdx % hunters.length;
    const hunter = hunters[hi];
    active.hunterRoundTotal += score;
    active.huntersCumTotal  += score;
    active.turns.push({
      who: hunter.id, whoName: hunter.name,
      score, roundTotal: active.hunterRoundTotal,
      cumTotal: active.huntersCumTotal,
      foxTotal: active.foxTotal
    });
    active.hunterIdx++;

    // Alle Jäger dieser Runde geworfen?
    if (active.hunterIdx >= hunters.length) {
      if (active.huntersCumTotal >= active.foxTotal) {
        // JÄGER FANGEN DEN FUCHS
        fr.hunterWins++;
        fr.kaetschen.push({ winner: 'hunters', foxFinal: active.foxTotal });
        fr.active = null;
        saveData(); showPage('fuchs');
        showToast(`🏹 Jäger fangen den Fuchs! (${active.huntersCumTotal} ≥ ${active.foxTotal})`, 'success');
        return;
      }
      // Nicht gefangen — Fuchs ist wieder dran
      active.phase = 'fox';
      active.hunterIdx = 0;
      active.hunterRoundTotal = 0;  // Rundenreset, CumTotal bleibt!
    }
    // sonst: nächster Jäger (phase bleibt 'hunter')
  }

  const inp = document.getElementById('fuchs_input');
  if (inp) { inp.value = 0; inp.focus(); }
  saveData(); showPage('fuchs');
}

// ── Letzten Zug rückgängig ──
function undoFuchsThrow() {
  const fr = state.scores.fuchs;
  if (!fr.active?.turns?.length) return;
  const last = fr.active.turns.pop();
  if (last.who === 'fox') {
    fr.active.foxTotal     -= last.score;
    fr.active.phase         = last.hand === 'L' ? 'fox_links' : last.hand === 'R' ? 'fox_rechts' : 'fox';
    fr.active.hunterIdx     = 0;
    fr.active.hunterRoundTotal = 0;
  } else {
    fr.active.hunterIdx        = Math.max(0, fr.active.hunterIdx - 1);
    fr.active.hunterRoundTotal = Math.max(0, fr.active.hunterRoundTotal - last.score);
    fr.active.huntersCumTotal  = Math.max(0, (fr.active.huntersCumTotal || 0) - last.score);
    fr.active.phase            = 'hunter';
  }
  saveData(); showPage('fuchs');
}

function resetKaetsche() {
  state.scores.fuchs.active = null;
  saveData(); showPage('fuchs');
}

function resetFuchs() {
  showConfirm('Fuchsjagd zurücksetzen?', 'Alle Kätsche werden gelöscht!', () => {
    state.scores.fuchs = { fuchsId: state.scores.fuchs.fuchsId, fuchsWins:0, hunterWins:0, kaetschen:[], active:null };
    saveData(); showPage('fuchs');
  });
}
// ======================================================
// RENDER: 6-TAGE-RENNEN (Zweier-Teams)
// ======================================================
function renderRennen() {
  if (!state.players.length) return noPlayers();
  const rn = state.scores.rennen;
  if (!rn.teams) rn.teams = [];
  if (!rn.days)  rn.days  = {};

  const assignedPids = rn.teams.flatMap(t => [t.p1, t.p2].filter(Boolean));
  const freePlayers  = state.players.filter(p => !assignedPids.includes(p.id));

  // Team ranking
  const teamEntries = rn.teams.map(t => ({ id: t.id, name: t.name, total: rennenTeamTotal(t) }));
  const teamRanked  = rank(teamEntries);
  const teamRankMap = {};
  teamRanked.forEach(r => { teamRankMap[r.id] = medal(r.rank); });

  // Helper: options for player selection inside a team (show own slot + free players)
  function playerOptions(selectedId) {
    return state.players
      .filter(p => p.id === selectedId || !assignedPids.includes(p.id) || !selectedId)
      .map(p => `<option value="${p.id}" ${selectedId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`)
      .join('');
  }

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🚀 6-Tage-Rennen</h2>
      <button class="btn-rules" onclick="toggleRules('rennen')">📜 Regeln</button>
    </div>
    <div id="rules_rennen" style="display:none">${rulesHtml('rennen')}</div>

    <!-- ── TEAM-VERWALTUNG ── -->
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-weight:700;color:var(--accent);font-size:.95rem">🏁 Zweier-Teams</span>
        <button class="btn-secondary btn-sm" onclick="addRennenTeam()">➕ Team</button>
      </div>

      ${rn.teams.length === 0
        ? '<div style="color:var(--text3);font-size:.85rem">Noch keine Teams. Klicke „+ Team" um ein Paar zu bilden.</div>'
        : rn.teams.map((t, ti) => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <span style="font-weight:700;font-size:.85rem;min-width:64px;color:var(--accent)">${esc(t.name)}</span>
            <select class="select-input" style="flex:1;min-width:110px" onchange="setRennenTeamPlayer('${t.id}',1,this.value)">
              <option value="">– Spieler 1 –</option>
              ${playerOptions(t.p1)}
            </select>
            <span style="color:var(--text3);font-weight:700">+</span>
            <select class="select-input" style="flex:1;min-width:110px" onchange="setRennenTeamPlayer('${t.id}',2,this.value)">
              <option value="">– Spieler 2 –</option>
              ${playerOptions(t.p2)}
            </select>
            <button class="btn-icon-sm" onclick="renameRennenTeam('${t.id}')" title="Umbenennen">✏️</button>
            <button class="btn-icon-sm btn-danger-sm" onclick="removeRennenTeam('${t.id}')" title="Team löschen">🗑️</button>
          </div>`).join('')}

      ${freePlayers.length > 0
        ? `<div style="font-size:.75rem;color:var(--warning);margin-top:8px">
             ⚠️ Noch nicht zugeteilt: ${freePlayers.map(p=>esc(p.name)).join(', ')}
           </div>` : ''}
    </div>

    <!-- ── SCORECARD PRO TEAM ── -->
    ${rn.teams.length === 0
      ? ''
      : rn.teams.map(t => {
          const p1 = state.players.find(p => p.id === t.p1);
          const p2 = state.players.find(p => p.id === t.p2);
          const total = rennenTeamTotal(t);
          const teamRank = teamRankMap[t.id] || '–';
          return `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-family:var(--font-title);font-size:1.15rem;color:var(--accent)">${esc(t.name)}</span>
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:.85rem;color:var(--text2)">Gesamt: <strong style="color:var(--accent)">${total}</strong></span>
                <span style="font-size:1.3rem" id="rn_team_rank_${t.id}">${teamRank}</span>
              </div>
            </div>
            <div class="table-wrapper">
              <table class="score-table">
                <thead>
                  <tr>
                    <th>Spieler</th>
                    ${[1,2,3,4,5,6].map(d=>`<th>Tag ${d}<br><small style="color:var(--accent2)">×${d}</small></th>`).join('')}
                    <th>Einzel-Σ</th>
                  </tr>
                </thead>
                <tbody>
                  ${[p1, p2].filter(Boolean).map(pl => {
                    const days = (rn.days && rn.days[pl.id]) || Array(6).fill(0);
                    return `<tr>
                      <td class="name-cell">${esc(pl.name)}</td>
                      ${days.map((v, i) => `<td>
                        <input class="score-input" type="number" min="0" max="9" value="${v || 0}"
                          data-score data-game="rennen" data-pid="${pl.id}" data-field="day" data-idx="${i}">
                      </td>`).join('')}
                      <td class="sum-cell" id="rn_ptotal_${pl.id}">${days.reduce((a,v)=>a+(v||0),0)}</td>
                    </tr>`;
                  }).join('')}
                  <!-- Team-Summe-Zeile -->
                  <tr style="background:rgba(232,160,32,.1);border-top:2px solid var(--accent)">
                    <td class="name-cell" style="color:var(--accent);font-weight:700">Team (×Faktor)</td>
                    ${[0,1,2,3,4,5].map(i => {
                      const p1v = (rn.days && rn.days[t.p1] || [])[i] || 0;
                      const p2v = (rn.days && rn.days[t.p2] || [])[i] || 0;
                      const combined = (p1v + p2v) * (i + 1);
                      return `<td class="sum-cell" id="rn_teamday_${t.id}_${i}" style="font-size:.82rem">${combined}</td>`;
                    }).join('')}
                    <td class="sum-cell" id="rn_teamtotal_${t.id}" style="font-size:1rem;font-weight:800">${total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>`;
        }).join('')}

    <!-- ── GESAMTSTAND ── -->
    ${rn.teams.length > 1 ? `
    <div class="game-rules" style="margin-top:4px">
      <strong>🏁 Rennstand:</strong>
      ${teamRanked.map(r => `${medal(r.rank)} ${esc(rn.teams.find(t=>t.id===r.id)?.name||'?')}: <strong>${r.total} Pkt</strong>`).join('&nbsp;&nbsp;&nbsp;')}
    </div>` : ''}
  </div>`;
}

function addRennenTeam() {
  const rn = state.scores.rennen;
  if (!rn.teams) rn.teams = [];
  const n = rn.teams.length + 1;
  rn.teams.push({ id: 'rt' + Date.now(), name: 'Team ' + n, p1: '', p2: '' });
  saveData(); showPage('rennen');
}

function removeRennenTeam(tid) {
  state.scores.rennen.teams = state.scores.rennen.teams.filter(t => t.id !== tid);
  saveData(); showPage('rennen');
}

function setRennenTeamPlayer(tid, slot, pid) {
  const t = state.scores.rennen.teams.find(x => x.id === tid);
  if (!t) return;
  if (slot === 1) t.p1 = pid;
  else            t.p2 = pid;
  // Make sure player days are initialized
  if (pid && !state.scores.rennen.days[pid]) state.scores.rennen.days[pid] = Array(6).fill(0);
  saveData(); showPage('rennen');
}

function renameRennenTeam(tid) {
  const t = state.scores.rennen.teams.find(x => x.id === tid);
  if (!t) return;
  showInputModal('Team umbenennen', t.name, val => {
    if (val.trim()) { t.name = val.trim(); saveData(); showPage('rennen'); }
  });
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
// RENDER: TANNENBAUM  (korrekte Regeln)
// ======================================================
function renderTannenbaum() {
  if (!state.players.length) return noPlayers();
  const tb = state.scores.tannenbaum;
  if (!tb.g1)       tb.g1       = [];
  if (!tb.g2)       tb.g2       = [];
  if (!tb.g1wins)   tb.g1wins   = 0;
  if (!tb.g2wins)   tb.g2wins   = 0;
  if (!tb.crossed)  tb.crossed  = { g1: Array(9).fill(false), g2: Array(9).fill(false) };
  if (!tb.throwLog) tb.throwLog = [];

  // Diamond layout: rows 1,2,3,2,1 → numbers 1–9
  // Row0:[1], Row1:[2,3], Row2:[4,5,6], Row3:[7,8], Row4:[9]
  const diamondRows = [[1],[2,3],[4,5,6],[7,8],[9]];

  const g1done = (tb.crossed.g1||Array(9).fill(false)).every(x=>x);
  const g2done = (tb.crossed.g2||Array(9).fill(false)).every(x=>x);
  const gameOver = g1done || g2done;

  function treeHtml(g) {
    const crossed = tb.crossed[g] || Array(9).fill(false);
    const wins    = g==='g1' ? tb.g1wins : tb.g2wins;
    const color   = g==='g1' ? 'var(--accent)' : 'var(--accent2)';
    const done    = g==='g1' ? g1done : g2done;
    const cnt     = crossed.filter(x=>x).length;
    return `
      <div style="background:var(--bg3);border:2px solid ${color};border-radius:var(--radius);padding:14px;text-align:center">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-family:var(--font-title);font-size:1.1rem;color:${color}">GRUPPE ${g==='g1'?1:2}</span>
          <span style="font-size:.8rem;color:var(--text3)">${cnt}/9 gestrichen &nbsp;|&nbsp; ${wins} 🏆 Siege</span>
        </div>
        ${done ? '<div style="color:var(--success);font-size:1rem;font-weight:700;margin-bottom:8px">🏆 FERTIG — GEWONNEN!</div>' : ''}
        ${diamondRows.map(row=>`
          <div style="display:flex;justify-content:center;gap:6px;margin-bottom:6px">
            ${row.map(n => {
              const x = crossed[n-1];
              return `<div style="
                width:40px;height:40px;border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                font-weight:800;font-size:.95rem;
                background:${x ? '#1e6b2e' : 'var(--surface)'};
                border:2px solid ${x ? '#00cc44' : 'var(--border2)'};
                color:${x ? '#00ff55' : 'var(--text)'};
                box-shadow:${x ? '0 0 8px rgba(0,200,60,.4)' : 'none'};
                transition:all .2s;
              ">${x ? '✓' : n}</div>`;
            }).join('')}
          </div>`).join('')}
        <div style="font-size:.75rem;color:var(--text3);margin-top:8px">
          ${(tb[g]||[]).map(pid=>pname(pid)).join(' · ') || '(keine Spieler)'}
        </div>
      </div>`;
  }

  const recentLog = [...(tb.throwLog||[])].reverse().slice(0,12);

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🌲 Tannenbaum</h2>
      <button class="btn-rules" onclick="toggleRules('tannenbaum')">📜 Regeln</button>
    </div>
    <div id="rules_tannenbaum" style="display:none">${rulesHtml('tannenbaum')}</div>

    <!-- BÄUME -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
      ${treeHtml('g1')}
      ${treeHtml('g2')}
    </div>

    <!-- WURF-EINGABE  oder  GEWINN-ANZEIGE -->
    ${gameOver ? `
      <div style="text-align:center;padding:20px;background:var(--bg3);border:1px solid var(--success);border-radius:var(--radius);margin-bottom:14px">
        <div style="font-size:2.5rem">🏆</div>
        <div style="font-size:1.2rem;font-weight:700;color:var(--success);margin:8px 0">
          ${g1done&&g2done ? 'Gleichstand! Beide Bäume fertig!' : g1done ? 'Gruppe 1 gewinnt das Spiel!' : 'Gruppe 2 gewinnt das Spiel!'}
        </div>
        <div style="font-size:.85rem;color:var(--text3);margin-bottom:12px">Gesamtstand: G1 ${tb.g1wins} : ${tb.g2wins} G2</div>
        <button class="btn-primary" onclick="newTbGame()">🔄 Neues Spiel starten</button>
      </div>` : `
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:14px">
        <div style="font-weight:700;color:var(--accent);margin-bottom:10px;font-size:.9rem">🎳 Wurf eingeben <span style="font-size:.75rem;color:var(--text3);font-weight:400">(immer in die Vollen – alle 9 Kegel stehen)</span></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select class="select-input" id="tb_group">
            <option value="g1" style="color:#000">Gruppe 1</option>
            <option value="g2" style="color:#000">Gruppe 2</option>
          </select>
          <select class="select-input" id="tb_player" style="flex:1;min-width:120px">
            <option value="">— Spieler —</option>
            ${state.players.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}
          </select>
          <input class="score-input-sm" type="number" id="tb_score" min="0" max="9" value="0"
                 onkeydown="if(event.key==='Enter')processTbThrow()">
          <button class="btn-primary" onclick="processTbThrow()">✅ Eintragen</button>
          <button class="btn-secondary btn-sm" onclick="undoTbThrow()" ${!(tb.throwLog&&tb.throwLog.length)?'disabled':''}>↺ Rückgängig</button>
        </div>
        <div style="font-size:.75rem;color:var(--text3);margin-top:8px">
          💡 0 Kegel = <strong>Pumpe/Pille</strong> → nichts wird gestrichen &nbsp;|&nbsp;
          Zahl schon gestrichen → geht zum <strong>Gegner</strong>
        </div>
      </div>`}

    <!-- SPIELER-ZUWEISUNG -->
    <details style="margin-bottom:12px">
      <summary style="cursor:pointer;color:var(--text2);font-size:.85rem;padding:6px 0">⚙️ Spieler zuordnen (auf-/zuklappen)</summary>
      <div style="padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${['g1','g2'].map((g,gi)=>`
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px">
            <div style="font-weight:700;color:${gi===0?'var(--accent)':'var(--accent2)'};margin-bottom:8px;font-size:.9rem">Gruppe ${gi+1}</div>
            ${(tb[g]||[]).map(pid=>`
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:.82rem">
                <span style="flex:1">${pname(pid)}</span>
                <button class="btn-icon-sm btn-danger-sm" onclick="removeTbPlayer('${g}','${pid}')">✕</button>
              </div>`).join('')}
            <select class="select-input" style="width:100%;margin-top:6px;font-size:.8rem"
              onchange="addTbPlayer('${g}',this.value);this.value=''">
              <option value="">Spieler hinzufügen…</option>
              ${state.players.filter(p=>!(tb.g1||[]).includes(p.id)&&!(tb.g2||[]).includes(p.id))
                .map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}
            </select>
          </div>`).join('')}
      </div>
    </details>

    <!-- WURF-PROTOKOLL -->
    ${(tb.throwLog&&tb.throwLog.length) ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px">
      <div style="font-size:.8rem;font-weight:700;color:var(--text3);margin-bottom:6px">📋 Letzten Würfe</div>
      ${recentLog.map(e=>`
        <div style="font-size:.78rem;padding:3px 0;border-bottom:1px solid var(--border);
          color:${e.action==='pumpe'?'var(--text3)':e.action==='own'?'var(--success)':'var(--warning)'}">
          ${e.action==='pumpe'?'⚫':e.action==='own'?'✅':'↪️'}
          <strong>${esc(e.pname)}</strong> (G${e.group==='g1'?1:2}) wirft <strong>${e.score}</strong>
          ${e.action==='pumpe' ? '→ Pumpe! Nichts passiert.'
            : e.action==='own' ? `→ ${e.score} bei eigenem Team ✓`
            : `→ ${e.score} schon weg! Beim Gegner gestrichen`}
        </div>`).join('')}
    </div>` : ''}
  </div>`;
}

// Wurf verarbeiten: eigene Zahl streichen, oder Gegnerzahl wenn schon weg
function processTbThrow() {
  const group   = document.getElementById('tb_group')?.value;
  const pid     = document.getElementById('tb_player')?.value;
  const scoreEl = document.getElementById('tb_score');
  const score   = parseInt(scoreEl?.value ?? 0) || 0;
  if (!pid) { showToast('Bitte Spieler auswählen!', 'error'); return; }

  const tb = state.scores.tannenbaum;
  if (!tb.crossed)  tb.crossed  = { g1: Array(9).fill(false), g2: Array(9).fill(false) };
  if (!tb.throwLog) tb.throwLog = [];
  const player = state.players.find(p=>p.id===pid);

  let action, targetGroup;
  if (score === 0) {
    action = 'pumpe';
    targetGroup = null;
  } else {
    const idx = score - 1;
    if (!tb.crossed[group][idx]) {
      action = 'own';
      targetGroup = group;
      tb.crossed[group] = [...tb.crossed[group]];
      tb.crossed[group][idx] = true;
    } else {
      action = 'opponent';
      targetGroup = group==='g1' ? 'g2' : 'g1';
      tb.crossed[targetGroup] = [...tb.crossed[targetGroup]];
      tb.crossed[targetGroup][idx] = true;
    }
  }

  tb.throwLog.push({ group, pid, pname: player?.name||'?', score, action, targetGroup });

  // Gewinn-Check NACH dem Wurf
  if (tb.crossed.g1.every(x=>x)) {
    tb.g1wins = (tb.g1wins||0)+1;
    showToast('🏆 Gruppe 1 gewinnt das Spiel!', 'success');
  } else if (tb.crossed.g2.every(x=>x)) {
    tb.g2wins = (tb.g2wins||0)+1;
    showToast('🏆 Gruppe 2 gewinnt das Spiel!', 'success');
  }

  if (scoreEl) scoreEl.value = 0;
  saveData();
  showPage('tannenbaum');
}

// Letzten Wurf rückgängig machen
function undoTbThrow() {
  const tb = state.scores.tannenbaum;
  if (!tb.throwLog?.length) return;
  const last = tb.throwLog.pop();
  if (last.action !== 'pumpe' && last.targetGroup) {
    tb.crossed[last.targetGroup] = [...tb.crossed[last.targetGroup]];
    tb.crossed[last.targetGroup][last.score-1] = false;
  }
  saveData();
  showPage('tannenbaum');
  showToast('↺ Letzter Wurf rückgängig');
}

// Neues Spiel (Bäume reset, Siege bleiben)
function newTbGame() {
  const tb = state.scores.tannenbaum;
  tb.crossed  = { g1: Array(9).fill(false), g2: Array(9).fill(false) };
  tb.throwLog = [];
  saveData();
  showPage('tannenbaum');
}

function addTbPlayer(g, pid) {
  if (!pid) return;
  const tb = state.scores.tannenbaum;
  if (!tb[g]) tb[g]=[];
  tb[g].push(pid);
  saveData(); showPage('tannenbaum');
}
function removeTbPlayer(g, pid) {
  state.scores.tannenbaum[g] = (state.scores.tannenbaum[g]||[]).filter(x=>x!==pid);
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
    const sv  = state.scores.sv[pid]||{throws:[],karte:0};
    const id  = state.scores.idiot[pid]||{links:0,beine:0,rechts:0};
    const mn  = state.scores.mensch[pid]||{throws:[]};
    const svT = s(sv.throws)+(sv.karte||0);
    const rnT = ((state.scores.rennen.days||{})[pid]||[]).reduce((a,v,i)=>a+(v||0)*(i+1),0);
    return grossHN(pid)+(id.links||0)+(id.beine||0)+(id.rechts||0)+s(mn.throws)+svT+rnT;
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
      <div class="total-card"><div class="val">${totalSchwein.toFixed(2)}€</div><div class="lbl">Schweinepartie Σ</div></div>
      <div class="total-card"><div class="val">${state.scores.fuchs.rounds.length}</div><div class="lbl">Fuchs-Runden</div></div>
    </div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Startgeld<br>✓/✗</th>
            <th>🟣 Pudel<br>(0 Kegel)</th>
            <th>⭐ Stina<br>(alle 9)</th>
            <th>🐷 Schwein-<br>partie €</th>
            <th>Zu zahlen</th>
            <th>Punkte<br>Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const kb  = state.kegelbuch[p.id] || { startgeld:false, pudel:0, stina:0 };
            const sw  = getSchweinSchuld(p.id);
            const pts = getPoints(p.id);
            // Pudel-Strafe: 0.10€ je Pudel; Stina: kein Abzug (Bonus)
            const zahlen = sw + (kb.pudel||0)*0.10;
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              <td style="text-align:center">
                <input type="checkbox" ${kb.startgeld?'checked':''}
                  onchange="toggleStartgeld('${p.id}',this.checked)">
              </td>
              <td><input class="score-input" type="number" min="0" max="99" value="${kb.pudel||0}"
                data-score data-game="kb" data-pid="${p.id}" data-field="pudel" data-idx="0"></td>
              <td><input class="score-input" type="number" min="0" max="99" value="${kb.stina||0}"
                data-score data-game="kb" data-pid="${p.id}" data-field="stina" data-idx="0"></td>
              <td class="sum-cell">${sw.toFixed(2)}€</td>
              <td id="kb_zahlen_${p.id}" style="color:var(--danger);font-weight:700">${zahlen.toFixed(2)}€</td>
              <td class="sum-cell">${pts}</td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:rgba(232,160,32,.08)">
            <td class="name-cell" style="font-weight:700">SUMME</td>
            <td style="text-align:center;font-weight:700">${state.players.filter(p=>(state.kegelbuch[p.id]||{}).startgeld).length}/${state.players.length}</td>
            <td style="font-weight:700;color:var(--accent);text-align:center">${state.players.reduce((a,p)=>a+((state.kegelbuch[p.id]||{}).pudel||0),0)}</td>
            <td style="font-weight:700;color:var(--accent);text-align:center">${state.players.reduce((a,p)=>a+((state.kegelbuch[p.id]||{}).stina||0),0)}</td>
            <td style="font-weight:700;color:var(--accent)">${totalSchwein.toFixed(2)}€</td>
            <td style="font-weight:700;color:var(--danger)">${state.players.reduce((a,p)=>{
              const kb=state.kegelbuch[p.id]||{};
              return a+getSchweinSchuld(p.id)+(kb.pudel||0)*0.10;
            },0).toFixed(2)}€</td>
            <td style="font-weight:700;color:var(--accent)">${totalPunkte}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="game-rules" style="margin-top:12px">
      🟣 <strong>Pudel</strong> = 0 Kegel getroffen → 0,10€ Strafe je Pudel &nbsp;|&nbsp;
      ⭐ <strong>Stina</strong> = Alle 9 Kegel (Volle) → wird gezählt &nbsp;|&nbsp;
      <strong>Zu zahlen</strong> = Schweinpartie + Pudel-Strafen
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
    // For overall points: use gross HN value (normalized 0-9 per digit = max 999)
    // Give bonus points for good performance: gross ranks up, klein ranks down
    return grossHN(pid);
  }
  function pts_sv(pid) {
    const sv = state.scores.sv[pid] || { throws: [], karte: 0 };
    const t = s(sv.throws) + (sv.karte || 0);
    return t > 21 ? 0 : t;          // busted = 0 points
  }
  function pts_rennen(pid) {
    const days = (state.scores.rennen.days || {})[pid] || [];
    return days.reduce((a, v, i) => a + (v || 0) * (i + 1), 0);
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
    if (!fr || !fr.kaetschen) return 0;
    // Fuchs gets 1 pt per won Kätsche; Hunters each get 1 pt per won Kätsche
    if (pid === fr.fuchsId) {
      return fr.kaetschen.filter(k => k.winner === 'fox').length;
    } else {
      // This player is a hunter
      const hunters = state.players.filter(p => p.id !== fr.fuchsId);
      if (!hunters.find(h => h.id === pid)) return 0;
      return fr.kaetschen.filter(k => k.winner === 'hunters').length;
    }
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
    { title: '🏠 Große Hausnummer',  w: gameWinner(pid => grossHN(pid), true) },
    { title: '🏠 Kleine Hausnummer', w: gameWinner(pid => kleinHN(pid), false) },
    { title: '🃏 17 und 4',          w: gameWinner(pid => { const sv = state.scores.sv[pid] || { throws: [], karte: 0 }; const t = s(sv.throws) + (sv.karte || 0); return t > 21 ? -1 : t; }) },
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
