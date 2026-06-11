'use strict';

// Die benötigte Tannenbaum-Struktur (Rautenform von 1 bis 9)
const BAUM_STRUKTUR = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1
};

// ======================================================
// RENDER: TANNENBAUM
// ======================================================

// Fresh & Clean: Keine Altlasten, berechnet den Baum immer live aus den Würfen
function migrateTannenbaum() {
  const tb = state.scores.tannenbaum; if (!tb) return;
  if (!tb.g1) tb.g1 = [];
  if (!tb.g2) tb.g2 = [];
  if (!tb.g1wins) tb.g1wins = 0;
  if (!tb.g2wins) tb.g2wins = 0;
  if (tb.g1winCounted === undefined) tb.g1winCounted = false;
  if (tb.g2winCounted === undefined) tb.g2winCounted = false;
  if (!tb.throwHistory) tb.throwHistory = [];
  if (tb.pendingPudelChoice === undefined) tb.pendingPudelChoice = null;
  
  recalculateTreeCounts();
}

function recalculateTreeCounts() {
  const tb = state.scores.tannenbaum;
  tb.treeCounts = {
    g1: {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0},
    g2: {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0}
  };
  
  if (!tb.throwHistory) return;
  
  tb.throwHistory.forEach(h => {
    // 1) Normaler Treffer fürs eigene Team
    if (h.val > 0 && !h.isGift && !h.isPudelBonus) {
      if (tb.treeCounts[h.team] && tb.treeCounts[h.team][h.val] < BAUM_STRUKTUR[h.val]) {
        tb.treeCounts[h.team][h.val]++;
      }
    }
    // 2) Geschenk (Zahl war voll, Gegner bekommt sie)
    else if (h.isGift) {
      const oppTeam = h.team === 'g1' ? 'g2' : 'g1';
      if (tb.treeCounts[oppTeam] && tb.treeCounts[oppTeam][h.val] < BAUM_STRUKTUR[h.val]) {
        tb.treeCounts[oppTeam][h.val]++;
      }
    }
    // 3) Pudel-Auswahl (Vom Gegner ausgesuchte Zahl gestrichen)
    else if (h.isPudelBonus && h.oppGroup) {
      if (tb.treeCounts[h.oppGroup] && tb.treeCounts[h.oppGroup][h.val] < BAUM_STRUKTUR[h.val]) {
        tb.treeCounts[h.oppGroup][h.val]++;
      }
    }
  });
}

function getTeamCounts(group) {
  const tb = state.scores.tannenbaum; 
  if (!tb.treeCounts) recalculateTreeCounts();
  return tb.treeCounts?.[group] || {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};
}

function isTeamDone(group) {
  const c = getTeamCounts(group);
  return Object.keys(BAUM_STRUKTUR).every(n => (c[n]||0) >= BAUM_STRUKTUR[n]);
}

function treeDisplayHtml(group) {
  const c = getTeamCounts(group), isG1 = group === 'g1';
  const color = isG1 ? '#3b82f6' : '#f59e0b', glow = isG1 ? 'rgba(59,130,246,.7)' : 'rgba(245,158,11,.7)';
  const label = isG1 ? '🔵 Team A' : '🟠 Team B';
  const total = Object.keys(BAUM_STRUKTUR).reduce((a,n) => a+Math.min(c[n]||0,BAUM_STRUKTUR[n]),0);
  const done  = isTeamDone(group);
  return `
    <div style="flex:1;text-align:center;background:#0f0f1e;border-radius:var(--radius);padding:16px;border:2px solid ${done?color:'#2d3561'}">
      <div style="color:${color};font-weight:700;font-size:.95rem;margin-bottom:12px">
        ${label} ${done ? '<span style="color:gold">🏆 FERTIG!</span>' : `(${total}/25)`}
      </div>
      ${[1,2,3,4,5,6,7,8,9].map(n => {
        const need=BAUM_STRUKTUR[n], got=Math.min(c[n]||0,need);
        return `<div style="display:flex;justify-content:center;gap:4px;margin-bottom:5px">
          ${Array(need).fill(0).map((_,i) => `
            <div style="width:34px;height:34px;border-radius:4px;display:flex;align-items:center;justify-content:center;
              font-weight:800;font-size:.9rem;background:${i<got?color:'#1e2040'};color:${i<got?'#fff':'#4a5080'};
              box-shadow:${i<got?`0 0 7px ${glow}`:'none'};transition:background .25s">${n}</div>
          `).join('')}
        </div>`;
      }).join('')}
    </div>`;
}

function renderTannenbaum() {
  if (!state.players.length) return noPlayers();
  const tb = state.scores.tannenbaum;
  migrateTannenbaum();

  const g1done = isTeamDone('g1'), g2done = isTeamDone('g2');
  let sText='🎳 Spiel läuft…', sBg='var(--bg3)', sBd='var(--border)';
  if (g1done&&g2done) { sText='🤝 Unentschieden!'; sBg='rgba(255,255,255,.05)'; sBd='var(--border2)'; }
  else if (g1done)    { sText='🏆 Team A gewinnt! 🎉'; sBg='rgba(59,130,246,.12)'; sBd='#3b82f6'; }
  else if (g2done)    { sText='🏆 Team B gewinnt! 🎉'; sBg='rgba(245,158,11,.12)'; sBd='#f59e0b'; }

  const isPudelPending = !!tb.pendingPudelChoice;

  let pudelBanner = '';
  if (isPudelPending) {
    const { fromPid, fromGroup, oppGroup } = tb.pendingPudelChoice;
    const oppLabel = oppGroup==='g1' ? '🔵 Team A' : '🟠 Team B';
    const oppColor = oppGroup==='g1' ? '#3b82f6' : '#f59e0b';
    const oppCounts = getTeamCounts(oppGroup);
    const available = [1,2,3,4,5,6,7,8,9].filter(n => (oppCounts[n]||0) < BAUM_STRUKTUR[n]);
    
    pudelBanner = `
      <div style="background:rgba(255,140,0,.15);border:2px solid var(--warning);border-radius:var(--radius);
        padding:18px;margin-bottom:14px;text-align:center;">
        <div style="font-size:1.3rem;font-weight:700;margin-bottom:6px">🎳 PUDEL! (0 geworfen)</div>
        <div style="font-size:.9rem;color:var(--text2);margin-bottom:14px">
          <strong>${pname(fromPid)}</strong> hat eine 0 geworfen! 
          <strong style="color:${oppColor}">${oppLabel}</strong> darf nun eine beliebige Zahl streichen:
        </div>
        ${available.length === 0 
          ? `<div style="color:var(--text3);margin-bottom:10px">Keine Zahlen beim Gegner mehr verfügbar.</div>
             <button class="btn-secondary btn-sm" onclick="dismissPudel()">OK, weiter</button>`
          : `<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">
               ${available.map(n => `
                 <button onclick="applyPudelChoice('${oppGroup}',${n})" 
                   style="background:${oppColor};border:none;color:#000;font-weight:800;font-size:1.2rem;
                   width:50px;height:50px;border-radius:6px;cursor:pointer;box-shadow:0 4px 6px rgba(0,0,0,.3);
                   transition:transform .1s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                   ${n}
                 </button>
               `).join('')}
             </div>`
        }
      </div>`;
  }

  if (g1done && !g2done && !tb.g1winCounted) { tb.g1wins++; tb.g1winCounted = true; saveData(); }
  if (g2done && !g1done && !tb.g2winCounted) { tb.g2wins++; tb.g2winCounted = true; saveData(); }

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🌲 Tannenbaum</h2>
      <button class="btn-rules" onclick="toggleRules('tannenbaum')">📜 Regeln</button>
    </div>
    <div id="rules_tannenbaum" style="display:none">${rulesHtml('tannenbaum')}</div>

    ${pudelBanner}

    <div style="background:${sBg};border:1px solid ${sBd};border-radius:var(--radius);padding:10px 16px;margin-bottom:14px;
      display:flex;justify-content:between;align-items:center;flex-wrap:wrap;gap:10px">
      <span style="font-weight:700;font-size:.95rem">${sText}</span>
      <div style="margin-left:auto;font-size:.82rem;color:var(--text2)">
        🏆 Siege — Team A: <strong style="color:#3b82f6">${tb.g1wins}</strong> 
        | Team B: <strong style="color:#f59e0b">${tb.g2wins}</strong>
      </div>
      ${(tb.throwHistory||[]).length > 0 ? `<button class="btn-secondary btn-sm" onclick="undoLastTannenbaumThrow()">↺ Rückgängig</button>` : ''}
      <button class="btn-secondary btn-sm" onclick="resetTannenbaumMatch()">🔄 Match-Reset</button>
    </div>

    <div style="display:flex;gap:14px;margin-bottom:14px;flex-wrap:wrap">
      ${treeDisplayHtml('g1')}
      ${treeDisplayHtml('g2')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
      ${['g1','g2'].map(g => {
        const isG1 = g === 'g1', col = isG1 ? '#3b82f6' : '#f59e0b', label = isG1 ? '🔵 Team A' : '🟠 Team B';
        return `
          <div style="background:#0f0f1e;border:1px solid ${col}44;border-radius:var(--radius);padding:12px">
            <div style="font-weight:700;color:${col};margin-bottom:8px;font-size:.9rem">${label}</div>
            <div id="tb_team_list_${g}">${(tb[g]||[]).length === 0 ? `<div style="color:var(--text3);font-size:.8rem;padding:8px 0">Noch keine Spieler.</div>` : buildPlayerRowsHtml(g)}</div>
          </div>`;
      }).join('')}
    </div>

    <details open style="margin-bottom:12px" id="tb_assign_details">
      <summary style="cursor:pointer;color:var(--text2);font-size:.85rem;padding:6px 0">⚙️ Spieler zuordnen</summary>
      <div style="padding-top:10px;margin-bottom:10px;display:flex;justify-content:flex-start">
        <button class="btn-primary btn-sm" onclick="randomizeTannenbaumTeams()">🎲 Teams zufällig mischen</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" id="tb_assign_grids_container">
        ${['g1','g2'].map((g, gi) => {
          const col = g==='g1'?'#3b82f6':'#f59e0b';
          return `
            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px">
              <div style="font-size:.8rem;font-weight:700;color:${col};margin-bottom:6px">Zuordnung ${gi===0?'Team A':'Team B'}</div>
              <div style="max-height:160px;overflow-y:auto">
                ${state.players.map(p => {
                  const inG1 = (tb.g1||[]).includes(p.id), inG2 = (tb.g2||[]).includes(p.id);
                  const activeInThis = g==='g1' ? inG1 : inG2;
                  return `
                    <label style="display:flex;align-items:center;gap:6px;font-size:.8rem;padding:3px 0;cursor:pointer">
                      <input type="checkbox" name="tb_chk_${p.id}" data-group="${g}" ${activeInThis?'checked':''} onchange="toggleTannenbaumPlayer('${g}','${p.id}',this.checked)">
                      <span style="${activeInThis?`color:${col};font-weight:600`:''}">${esc(p.name)}</span>
                    </label>`;
                }).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>
    </details>

    <div style="display:flex;justify-content:flex-end">
      <button class="btn-footer btn-danger-foot" onclick="resetAllTannenbaum()">🗑️ Komplett-Reset (inkl. Siege)</button>
    </div>
  </div>`;
}

function buildPlayerRowsHtml(g) {
  const tb = state.scores.tannenbaum;
  const g1done = isTeamDone('g1'), g2done = isTeamDone('g2');
  const isPudelPending = !!tb.pendingPudelChoice;

  return (tb[g]||[]).map(pid => {
    const pHistory = (tb.throwHistory||[]).filter(h => h.pid === pid);
    const listStr = pHistory.map(h => {
      if (h.val === 0) return `<span style="color:var(--warning);font-weight:700" title="Pudel">P</span>`;
      if (h.isGift) return `<span style="color:#ef4444;text-decoration:line-through;" title="Euch geschenkt!">${h.val}</span>`;
      if (h.isPudelBonus) return `<span style="color:gold;font-weight:700" title="Pudel-Geschenk">${h.val}*</span>`;
      return h.val;
    }).join(', ') || '<span style="color:var(--textDim)">keine Würfe</span>';

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="flex:1">
          <div style="font-weight:600;font-size:.9rem">${pname(pid)}</div>
          <div style="font-size:.75rem;color:var(--text3)">Würfe: ${listStr}</div>
        </div>
        <div style="display:flex;gap:6px">
          <input class="score-input-sm" type="number" min="0" max="9" placeholder="Wurf" 
            id="tb_inp_${pid}" ${isPudelPending||g1done||g2done ? 'disabled' : ''}
            onkeydown="if(event.key==='Enter') addTannenbaumThrow('${pid}','${g}',this.value)">
          <button class="btn-primary btn-sm" style="padding:0 10px" ${isPudelPending||g1done||g2done ? 'disabled' : ''}
            onclick="addTannenbaumThrow('${pid}','${g}',document.getElementById('tb_inp_${pid}').value)">✓</button>
        </div>
      </div>`;
  }).join('');
}

function updateTannenbaumAssignUiLive() {
  const tb = state.scores.tannenbaum;
  state.players.forEach(p => {
    const chkA = document.querySelector(`input[name="tb_chk_${p.id}"][data-group="g1"]`);
    const chkB = document.querySelector(`input[name="tb_chk_${p.id}"][data-group="g2"]`);
    const inG1 = (tb.g1||[]).includes(p.id);
    const inG2 = (tb.g2||[]).includes(p.id);

    if (chkA) chkA.checked = inG1;
    if (chkB) chkB.checked = inG2;
    
    if (chkA && chkA.nextElementSibling) {
      chkA.nextElementSibling.style.color = inG1 ? '#3b82f6' : '';
      chkA.nextElementSibling.style.fontWeight = inG1 ? '600' : '';
    }
    if (chkB && chkB.nextElementSibling) {
      chkB.nextElementSibling.style.color = inG2 ? '#f59e0b' : '';
      chkB.nextElementSibling.style.fontWeight = inG2 ? '600' : '';
    }
  });

  ['g1', 'g2'].forEach(g => {
    const listEl = document.getElementById(`tb_team_list_${g}`);
    if (listEl) {
      listEl.innerHTML = (tb[g]||[]).length === 0 ? `<div style="color:var(--text3);font-size:.8rem;padding:8px 0">Noch keine Spieler.</div>` : buildPlayerRowsHtml(g);
    }
  });
}

function toggleTannenbaumPlayer(group, pid, isChecked) {
  const tb = state.scores.tannenbaum;
  if (isChecked) {
    if (group === 'g1') { 
      tb.g1 = tb.g1 || []; if(!tb.g1.includes(pid)) tb.g1.push(pid); 
      tb.g2 = (tb.g2||[]).filter(id => id !== pid); 
    } else { 
      tb.g2 = tb.g2 || []; if(!tb.g2.includes(pid)) tb.g2.push(pid); 
      tb.g1 = (tb.g1||[]).filter(id => id !== pid); 
    }
  } else {
    if (group === 'g1') tb.g1 = (tb.g1||[]).filter(id => id !== pid);
    else tb.g2 = (tb.g2||[]).filter(id => id !== pid);
  }
  recalculateTreeCounts();
  saveData();
  updateTannenbaumAssignUiLive();
}

function randomizeTannenbaumTeams() {
  if (!state.players.length) return;
  const tb = state.scores.tannenbaum;
  const shuffled = [...state.players].sort(() => Math.random() - 0.5);
  tb.g1 = []; tb.g2 = [];
  shuffled.forEach((p, idx) => {
    if (idx % 2 === 0) tb.g1.push(p.id);
    else tb.g2.push(p.id);
  });
  recalculateTreeCounts();
  saveData();
  updateTannenbaumAssignUiLive();
  showToast('🎲 Teams wurden zufällig aufgeteilt!', 'success');
}

function addTannenbaumThrow(pid, group, valStr) {
  const val = parseInt(valStr);
  if (isNaN(val) || val < 0 || val > 9) { showToast('Ungültiger Wurf! (0-9)', 'error'); return; }

  const tb = state.scores.tannenbaum;
  tb.throwHistory = tb.throwHistory || [];
  const oppGroup = group === 'g1' ? 'g2' : 'g1';

  // REGEL 1: PUDEL (0)
  if (val === 0) {
    tb.pendingPudelChoice = { fromPid: pid, fromGroup: group, oppGroup: oppGroup };
    tb.throwHistory.push({ pid, val: 0, team: group, isPudel: true });
    saveData();
    showPage('tannenbaum');
    showToast('🎳 Pudel! Gegner darf eine Zahl wählen!', 'warning');
    return;
  }

  const currentOwnCounts = getTeamCounts(group);
  const currentOppCounts = getTeamCounts(oppGroup);

  // REGEL 2: ZAHL BEIM EIGENEN TEAM SCHON VOLL
  if ((currentOwnCounts[val] || 0) >= BAUM_STRUKTUR[val]) {
    if ((currentOppCounts[val] || 0) < BAUM_STRUKTUR[val]) {
      // Gegner hat sie noch frei -> Seitenwechsel (Geschenk)
      tb.throwHistory.push({ pid, val, team: group, isGift: true });
      recalculateTreeCounts();
      saveData();
      showPage('tannenbaum');
      showToast(`🎁 Zahl ${val} ist bei euch voll! Dem Gegner geschenkt!`, 'warning');
    } else {
      // Beide voll -> Verfällt
      tb.throwHistory.push({ pid, val, team: group, isWasted: true });
      saveData();
      showPage('tannenbaum');
      showToast(`Zahl ${val} haben bereits beide Teams voll.`, 'info');
    }
    return;
  }

  // Normaler Treffer
  tb.throwHistory.push({ pid, val, team: group });
  recalculateTreeCounts();
  saveData();
  showPage('tannenbaum');
}

function applyPudelChoice(oppGroup, num) {
  const tb = state.scores.tannenbaum;
  if (!tb.pendingPudelChoice) return;
  const choice = tb.pendingPudelChoice;
  
  tb.throwHistory.push({
    pid: choice.fromPid,
    val: num,
    team: choice.fromGroup,
    isPudelBonus: true,
    oppGroup: oppGroup
  });

  tb.pendingPudelChoice = null;
  recalculateTreeCounts();
  saveData();
  showPage('tannenbaum');
  showToast(`Zahl ${num} gestrichen!`, 'success');
}

function dismissPudel() {
  const tb = state.scores.tannenbaum;
  tb.pendingPudelChoice = null;
  saveData();
  showPage('tannenbaum');
}

function undoLastTannenbaumThrow() {
  const tb = state.scores.tannenbaum;
  if (!tb.throwHistory || !tb.throwHistory.length) return;

  const last = tb.throwHistory.pop();
  if (last.isPudel || last.isPudelBonus) {
    tb.pendingPudelChoice = null;
    if (last.isPudelBonus && tb.throwHistory.length > 0) {
      const prev = tb.throwHistory[tb.throwHistory.length - 1];
      if (prev.isPudel && prev.pid === last.pid) {
        tb.throwHistory.pop();
      }
    }
  }

  recalculateTreeCounts();
  if (!isTeamDone('g1')) tb.g1winCounted = false;
  if (!isTeamDone('g2')) tb.g2winCounted = false;
  
  saveData();
  showPage('tannenbaum');
  showToast('↺ Letzte Aktion rückgängig gemacht', 'info');
}

function resetTannenbaumMatch() {
  if (!confirm('Aktuelles Match wirklich zurücksetzen?')) return;
  const tb = state.scores.tannenbaum;
  tb.throwHistory = [];
  tb.g1winCounted = false;
  tb.g2winCounted = false;
  tb.pendingPudelChoice = null;
  recalculateTreeCounts();
  saveData();
  showPage('tannenbaum');
}

function resetAllTannenbaum() {
  if (!confirm('Möchtest du die gesamte Tannenbaum-Statistik löschen?')) return;
  state.scores.tannenbaum = { g1:[], g2:[], g1wins:0, g2wins:0, throwHistory:[], pendingPudelChoice:null };
  recalculateTreeCounts();
  saveData();
  showPage('tannenbaum');
}

// Zufall-Button Logik
function randomizeTeams() {
  const players = [...state.players].sort(() => Math.random() - 0.5);
  const teams = [];
  for (let i = 0; i < players.length; i += 2) {
    if (players[i+1]) {
      teams.push({
        id: 't' + Date.now() + i,
        name: `Team ${teams.length + 1}`,
        p1: players[i].id,
        p2: players[i+1].id
      });
    }
  }
  state.scores.rennen.teams = teams;

  saveData(); // Speichern

  showPage('rennen'); // <-- Das lädt die Seite "Rennen" neu und zeichnet sie frisch

}

// Einklappen-Logik
function toggleRennenCollapse() {
  const current = localStorage.getItem('rennen_collapsed') === 'true';
  localStorage.setItem('rennen_collapsed', !current);
  
  // Wichtig: Wir rufen die Haupt-Navigationsfunktion auf, 
  // damit die Seite mit dem neuen Status neu geladen wird.
  showPage('rennen');
}
function processTannenbaumWurf(teamId, wurf) {
  const tb = state.scores.tannenbaum;
  const gegnerId = (teamId === 'g1') ? 'g2' : 'g1';
  
  if (wurf === 0) {
    // PUDEL-LOGIK: Gegner darf sich beliebige Zahl ausstreichen
    // Hier müsstest du ein Modal oder Auswahlmenü zeigen, 
    // welche Zahl der Gegner streichen darf.
    showToast('Pudel! Gegner darf eine Zahl wählen.', 'warning');
    // ... Logik zum Entfernen der gewählten Zahl aus tb[gegnerId]
  } else {
    // NORMALE WURF-LOGIK
    if (tb[teamId].includes(wurf)) {
      // Zahl vorhanden -> ausstreichen
      tb[teamId] = tb[teamId].filter(n => n !== wurf);
    } else {
      // Zahl nicht vorhanden -> Gegner darf streichen (wenn er die Zahl hat)
      if (tb[gegnerId].includes(wurf)) {
        tb[gegnerId] = tb[gegnerId].filter(n => n !== wurf);
      }
    }
  }
  
  // Sieg-Check
  if (tb[teamId].length === 0) {
    showToast(`Team ${teamId === 'g1' ? '1' : '2'} hat gewonnen!`, 'success');
  }
  
  saveData();
  showPage('tannenbaum'); // Seite neu zeichnen
}
/**
 * Verarbeitet einen Wurf im Tannenbaum-Spiel
 * @param {string} teamId - 'team1' oder 'team2'
 * @param {number} throwValue - 0 bis 9
 */
function handleTannenbaumWurf(teamId, throwValue) {
  // 1. Initialisierung prüfen
  if (!state.scores.tannenbaum) {
    state.scores.tannenbaum = { team1: [1,2,3,4,5,6,7,8,9], team2: [1,2,3,4,5,6,7,8,9] };
  }

  const opponentId = (teamId === 'g1') ? 'team2' : 'team1';
  let myNumbers = state.scores.tannenbaum[teamId];
  let oppNumbers = state.scores.tannenbaum[opponentId];

  // 2. Pudel-Logik
  if (throwValue === 0) {
    if (oppNumbers.length > 0) {
      // Entferne eine zufällige Zahl beim Gegner bei Pudel
      const randomIndex = Math.floor(Math.random() * oppNumbers.length);
      oppNumbers.splice(randomIndex, 1);
      showToast("Pudel! Gegner verliert eine Zahl.");
    }
  } 
  // 3. Regulärer Wurf
  else {
    const myIndex = myNumbers.indexOf(throwValue);
    
    if (myIndex > -1) {
      // Treffer im eigenen Team: Zahl streichen
      myNumbers.splice(myIndex, 1);
      showToast(`Treffer! ${throwValue} gestrichen.`);
    } else {
      // Nicht vorhanden: Gegner darf streichen, wenn er die Zahl noch hat
      const oppIndex = oppNumbers.indexOf(throwValue);
      if (oppIndex > -1) {
        oppNumbers.splice(oppIndex, 1);
        showToast(`Glück gehabt! Zahl ${throwValue} beim Gegner gestrichen.`);
      } else {
        showToast("Zahl bereits weg!");
      }
    }
  }

  // 4. Siegprüfung
  if (myNumbers.length === 0) {
    showToast(`Tusch! Team ${teamId} hat gewonnen!`, 'success');
  }

  saveData(); // Speichert den neuen Status in den LocalStorage
  showPage('tannenbaum'); // Aktualisiert die Ansicht
}