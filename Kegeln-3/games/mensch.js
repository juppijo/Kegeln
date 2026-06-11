'use strict';

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