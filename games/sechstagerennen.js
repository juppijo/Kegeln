'use strict';

// ======================================================
// RENDER: 6-TAGE-RENNEN (Zweier-Teams)
// ======================================================

function renderRennen() {
  if (!state.players.length) return noPlayers();
  const rn = state.scores.rennen;
  if (!rn.teams) rn.teams = [];
  if (!rn.days)  rn.days  = {};

  const isCollapsed = localStorage.getItem('rennen_collapsed') === 'true';
  const assignedPids = rn.teams.flatMap(t => [t.p1, t.p2].filter(Boolean));
  const freePlayers  = state.players.filter(p => !assignedPids.includes(p.id));

  // Team ranking Berechnungen
  const teamEntries = rn.teams.map(t => ({ id: t.id, name: t.name, total: rennenTeamTotal(t) }));
  const teamRanked  = rank(teamEntries);
  const teamRankMap = {};
  teamRanked.forEach(r => { teamRankMap[r.id] = medal(r.rank); });

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
      
        <button class="btn-icon-sm" onclick="randomizeTeams()" title="Zufällige Teams">Zufall 🎲</button>
        <button class="btn-icon-sm" onclick="toggleRennenCollapse()"> ${isCollapsed ? 'Teamswahl ▼' : 'Teamswahl ▲'}</button>
        <button class="btn-rules" onclick="toggleRules('rennen')">📜 Regeln</button>
      
    </div>

    <div id="rules_rennen" style="display:none">${rulesHtml('rennen')}</div>

    ${!isCollapsed ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-weight:700;color:var(--accent);font-size:.95rem">🏁 Zweier-Teams</span>
        <button class="btn-secondary btn-sm" onclick="addRennenTeam()">➕ Team</button>
      </div>

      ${rn.teams.length === 0
        ? '<div style="color:var(--text3);font-size:.85rem;text-align:center">Noch keine Teams. Klicke „+ Team" um ein Paar zu bilden.</div>'
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
    </div>` : ''}

    ${rn.teams.length === 0 ? '' : rn.teams.map(t => {
          const p1 = state.players.find(p => p.id === t.p1);
          const p2 = state.players.find(p => p.id === t.p2);
          const total = rennenTeamTotal(t);
          const teamRank = teamRankMap[t.id] || '–';
          return `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px">
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