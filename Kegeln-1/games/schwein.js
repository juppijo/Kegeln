'use strict';

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