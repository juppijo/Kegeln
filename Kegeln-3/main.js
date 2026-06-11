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
      
      // AB HIER ERSETZEN / ERGÄNZEN:
      tannenbaum: { 
        g1: [], 
        g2: [], 
        g1wins: 0, 
        g2wins: 0, 
        rounds: [],
        pendingPudelChoice: null // ← NEU für das Pudel-Banner-Update
      },
      
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
  initSplashScreen();
});

function initSplashScreen() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  window.setTimeout(() => {
    splash.classList.add('hidden');
    window.setTimeout(() => splash.remove(), 500);
  }, 3000);
}

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
