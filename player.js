'use strict';
/* ================================================================
   player.js — Kegel-Spiele Manager
   Spieler-Verwaltung: Hinzufügen · Entfernen · Umbenennen · Sortieren
   ================================================================ */

let _uidSeq = 0;
function genId() { return 'p' + Date.now() + '_' + (++_uidSeq); }

function addPlayer(name) {
  if (!name.trim()) return;
  if (state.players.length >= MAX_PLAYERS) { showToast('Maximum 20 Spieler!','error'); return; }
  const id = genId();
  state.players.push({ id, name: name.trim() });
  initPlayerScores(id);
  updateFooter();
}

function initPlayerScores(id) {
  if (!state.scores.hausnummer[id]) state.scores.hausnummer[id]={gross:{H:0,Z:0,E:0},klein:{H:0,Z:0,E:0}};
  if (!state.scores.sv[id])         state.scores.sv[id]={throws:[0,0,0,0,0,0,0],karte:0};
  if (!state.scores.rennen.days)    state.scores.rennen.days={};
  if (!state.scores.rennen.days[id])state.scores.rennen.days[id]=[0,0,0,0,0,0];
  if (!state.scores.schwein[id])    state.scores.schwein[id]={vals:[0,0,0,0,0]};
  if (!state.scores.idiot[id])      state.scores.idiot[id]={links:0,beine:0,rechts:0};
  if (!state.scores.mensch[id])     state.scores.mensch[id]={throws:Array(10).fill(0)};
  if (!state.kegelbuch[id])         state.kegelbuch[id]={startgeld:false,pudel:0,stina:0};
}

function removePlayer(id) {
  showConfirm('Spieler entfernen?','Alle Scores werden gelöscht!',()=>{
    state.players=state.players.filter(p=>p.id!==id);
    for (const g in state.scores) {
      const sc=state.scores[g];
      if (sc&&typeof sc==='object'&&!Array.isArray(sc)&&sc[id]) delete sc[id];
    }
    if (state.scores.rennen.days) delete state.scores.rennen.days[id];
    if (state.scores.rennen.teams) state.scores.rennen.teams.forEach(t=>{if(t.p1===id)t.p1='';if(t.p2===id)t.p2='';});
    ['g1','g2'].forEach(g=>{
      if (state.scores.einsacken[g]) state.scores.einsacken[g]=state.scores.einsacken[g].filter(x=>x!==id);
    });
    // Tannenbaum — removeTbPlayer macht treeCounts rückgängig (definiert in spiele.js)
    ['g1','g2'].forEach(g=>{ if((state.scores.tannenbaum[g]||[]).includes(id)) removeTbPlayer(g,id,true); });
    if (state.scores.bus.assignments) delete state.scores.bus.assignments[id];
    delete state.kegelbuch[id];
    saveData(); showPage('spieler'); updateFooter();
  });
}

function renamePlayer(id) {
  const p=state.players.find(x=>x.id===id); if(!p)return;
  showInputModal('Name ändern',p.name,val=>{ if(val.trim()){p.name=val.trim();saveData();showPage('spieler');} });
}

function movePlayer(id, dir) {
  const idx=state.players.findIndex(p=>p.id===id); if(idx<0)return;
  if (dir==='up'&&idx>0) [state.players[idx-1],state.players[idx]]=[state.players[idx],state.players[idx-1]];
  else if (dir==='down'&&idx<state.players.length-1) [state.players[idx+1],state.players[idx]]=[state.players[idx],state.players[idx+1]];
  else return;
  saveData(); showPage('spieler');
}

function addPlayerFromInput() {
  const inp=document.getElementById('newPlayerName'); if(!inp)return;
  addPlayer(inp.value); inp.value=''; saveData(); showPage('spieler');
}

function loadPresetNames() {
  const names=['Michael','Hilde','Peter','Brigitte','Elke','Gerhard','Helga','Birgit','Jo','Svenja','Marius'];
  names.forEach(n=>{ if(!state.players.find(p=>p.name===n)) addPlayer(n); });
  saveData(); showPage('spieler');
}

function updateFooter() {
  const c=document.getElementById('playerCount'); if(c)c.textContent=state.players.length+' Spieler';
}

// ── Render ────────────────────────────────────────────────────────
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
      ${state.players.length===0
        ?'<div class="empty-state">Noch keine Spieler. Füge Spieler hinzu oder lade die Vorlage.</div>'
        :state.players.map((p,i)=>`
          <div class="player-item">
            <div class="player-num">${i+1}</div>
            <div class="player-name">${esc(p.name)}</div>
            <div class="player-actions">
              <button class="btn-icon-sm" onclick="movePlayer('${p.id}','up')" style="font-size:.7rem" ${i===0?'disabled':''}> ▲</button>
              <button class="btn-icon-sm" onclick="movePlayer('${p.id}','down')" style="font-size:.7rem" ${i===state.players.length-1?'disabled':''}>▼</button>
              <button class="btn-icon-sm" onclick="renamePlayer('${p.id}')">✏️</button>
              <button class="btn-icon-sm btn-danger-sm" onclick="removePlayer('${p.id}')">🗑️</button>
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