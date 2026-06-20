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

  // --- NEU: Häufigkeiten der Summen zählen (außer 0) ---
  const totalCounts = {};
  entries.forEach(e => {
    if (e.total > 0) {
      totalCounts[e.total] = (totalCounts[e.total] || 0) + 1;
    }
  });
  // ----------------------------------------------------

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
            const playerTotal = s(m.throws);
            
            // --- NEU: Hintergrundfarbe bestimmen, wenn Summe mehrfach existiert ---
            const isDuplicate = playerTotal > 0 && totalCounts[playerTotal] > 1;
            const bgStyle = isDuplicate ? 'background-color: #ff4d4d !important; color: white !important;' : '';

            // ---------------------------------------------------------------------

            return `<tr>
              <td class="name-cell" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span>${esc(p.name)}</span>
                <button class="btn-reset-player" title="Rausgeschmissen! (Nullen)" onclick="resetMenschPlayer('${p.id}')">💥</button>
              </td>

              ${m.throws.map((v,i)=>`<td><input class="score-input" type="number" min="0" max="9" value="${v||0}"
                data-score data-game="mensch" data-pid="${p.id}" data-field="throw" data-idx="${i}"></td>`).join('')}
              <td class="sum-cell" id="mensch_total_${p.id}" style="${playerTotal > 0 && totalCounts[playerTotal] > 1 ? 'background-color: #ff4d4d; color: white;' : ''}">${playerTotal}</td>
              <td class="rank-cell" id="mensch_rank_${p.id}">${mRanks[p.id]||'–'}</td>

            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ======================================================
// ACTION: SPIELER ZURÜCKSETZEN (RAUSGESCHMISSEN)
// ======================================================
function resetMenschPlayer(playerId) {
  // Setze die Würfe im State komplett auf 0 zurück
  if (!state.scores.mensch[playerId]) {
    state.scores.mensch[playerId] = { throws: Array(10).fill(0) };
  } else {
    state.scores.mensch[playerId].throws = Array(10).fill(0);
  }
  
  // Automatisch speichern und die Seite neu rendern, um die UI upzudaten
  saveData();
  showPage('mensch');
  
  // Optionaler visueller Feedback-Toast (falls die globale Funktion existiert)
  if (typeof showToast === 'function') {
    showToast('💥 Spieler wurde rausgeschmissen und genullt!', 'info');
  }
}