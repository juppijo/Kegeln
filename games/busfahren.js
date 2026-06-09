'use strict';

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