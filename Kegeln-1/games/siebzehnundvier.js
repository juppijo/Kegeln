'use strict';

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