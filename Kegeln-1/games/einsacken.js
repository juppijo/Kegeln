'use strict';

// ======================================================
// RENDER: EINSACKEN
// ======================================================
function renderEinsacken() {
  if (!state.players.length) return noPlayers();
  const es = state.scores.einsacken;
  if (!es.g1) es.g1 = [];
  if (!es.g2) es.g2 = [];
  if (!es.rounds) es.rounds = [];

  const teamDefs = [
    { key: 'g1', cls: 'team-1', label: 'Team A', color: 'var(--team1)' },
    { key: 'g2', cls: 'team-2', label: 'Team B', color: 'var(--team2)' }
  ];

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>💰 Einsacken</h2>
      <button class="btn-rules" onclick="toggleRules('einsacken')">📜 Regeln</button>
    </div>
    <div id="rules_einsacken" style="display:none">${rulesHtml('einsacken')}</div>

    <!-- TEAM-KARTEN -->
    <div class="einsacken-groups">
      ${teamDefs.map(({ key: g, cls, label, color }) => `
        <div class="group-card ${cls}">
          <div class="group-card-header">
            <span class="group-title">🎳 ${label}</span>
            <span class="group-badge">${(es[g]||[]).length} Spieler</span>
          </div>
          <div class="group-card-body">
            <!-- Spieler-Liste -->
            ${(es[g]||[]).length === 0
              ? `<div style="color:var(--text3);font-size:.82rem;padding:6px 0;margin-bottom:8px">Noch keine Spieler zugeteilt.</div>`
              : (es[g]||[]).map(pid => `
                <div class="group-player-row">
                  <span style="flex:1">${pname(pid)}</span>
                  <span style="font-size:.75rem;background:${color}22;color:${color};
                    padding:2px 8px;border-radius:10px;font-weight:700">
                    ${countEinsackenWins(g,pid)} 🏆
                  </span>
                  <button class="btn-icon-sm btn-danger-sm" onclick="removeFromGroup('${g}','${pid}')">✕</button>
                </div>`).join('')}

            <!-- Spieler hinzufügen -->
            <select class="group-add-select" onchange="addToGroup('${g}',this.value);this.value=''">
              <option value="">➕ Spieler zu ${label} hinzufügen…</option>
              ${state.players.filter(p => !es.g1.includes(p.id) && !es.g2.includes(p.id))
                .map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
            </select>
          </div>
        </div>`).join('')}
    </div>

    <!-- RUNDEN -->
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
          ${teamDefs.map(({ key: g, label, color }) => `
            <div style="border-left:3px solid ${color};padding-left:10px">
              <div style="font-size:.8rem;font-weight:700;color:${color};margin-bottom:8px">${label}</div>
              ${(es[g]||[]).map(pid => `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                  <span style="flex:1;font-size:.82rem">${pname(pid)}</span>
                  <input class="score-input" type="number" min="0" max="9"
                    value="${(rd[g]&&rd[g][pid])||0}"
                    onchange="setEinsackenScore(${ri},'${g}','${pid}',this.value)">
                </div>`).join('')}
              <div style="font-size:.75rem;color:${color};margin-top:6px;font-weight:600">
                🏆 ${getEinsackenRoundWinner(rd[g],es[g])}
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
