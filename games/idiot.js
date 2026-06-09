'use strict';

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