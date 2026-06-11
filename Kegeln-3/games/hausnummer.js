'use strict';

// ======================================================
// RENDER: HAUSNUMMER
// ======================================================

function renderHausnummer() {
  if (!state.players.length) return noPlayers();

  // Pre-compute ranks
  const gRanks = {}, kRanks = {};
  rank(state.players.map(p=>({id:p.id, total:grossHN(p.id)})), true)
    .forEach(r => { gRanks[r.id] = medal(r.rank); });
  rank(state.players.map(p=>({id:p.id, total:kleinHN(p.id)})), false)
    .forEach(r => { kRanks[r.id] = medal(r.rank); });

  // Input cell helper: data-idx is the position key H/Z/E
  function inp(pid, field, pos, val) {
    return `<input class="score-input" type="number" min="0" max="9" value="${val}"
      data-score data-game="hausnummer" data-pid="${pid}" data-field="${field}" data-idx="${pos}">`;
  }

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🏠 Große &amp; Kleine Hausnummer</h2>
      <button class="btn-rules" onclick="toggleRules('hausnummer')">📜 Regeln</button>
    </div>
    <div id="rules_hausnummer" style="display:none">${rulesHtml('hausnummer')}</div>

    <div class="game-rules">
      <strong>Große HN:</strong> Ziffern auf Hunderter / Zehner / Einer verteilen → <em>höchste</em> 3-stellige Zahl gewinnt. Pudel (0) = zählt als 0.<br>
      <strong>Kleine HN:</strong> Ziffern auf H / Z / E verteilen → <em>niedrigste</em> Zahl gewinnt. 0 ist ein gültiger Wurf (Kugel rollt durch) und zählt als 0!
    </div>

    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th rowspan="2">Name</th>
            <th colspan="3" class="section-header gross">🔼 Große Hausnummer</th>
            <th class="section-header gross">Zahl</th>
            <th class="section-header gross">Platz</th>
            <th colspan="3" class="section-header klein">🔽 Kleine Hausnummer</th>
            <th class="section-header klein">Zahl</th>
            <th class="section-header klein">Platz</th>
          </tr>
          <tr>
            <th title="Hunderterstelle">H</th>
            <th title="Zehnerstelle">Z</th>
            <th title="Einerstelle">E</th>
            <th></th><th></th>
            <th title="Hunderterstelle">H</th>
            <th title="Zehnerstelle">Z</th>
            <th title="Einerstelle">E</th>
            <th></th><th></th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const hn = state.scores.hausnummer[p.id] || { gross:{H:0,Z:0,E:0}, klein:{H:0,Z:0,E:0} };
            const g  = hn.gross || {H:0,Z:0,E:0};
            const k  = hn.klein || {H:0,Z:0,E:0};
            const gNum = grossHN(p.id);
            const kNum = kleinHN(p.id);
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              <td>${inp(p.id,'gross','H', g.H||0)}</td>
              <td>${inp(p.id,'gross','Z', g.Z||0)}</td>
              <td>${inp(p.id,'gross','E', g.E||0)}</td>
              <td class="sum-cell" id="hn_gross_num_${p.id}" style="font-size:1rem;font-weight:800;letter-spacing:1px">${gNum}</td>
              <td class="rank-cell" id="hn_gross_rank_${p.id}">${gRanks[p.id]||'–'}</td>
              <td>${inp(p.id,'klein','H', k.H||0)}</td>
              <td>${inp(p.id,'klein','Z', k.Z||0)}</td>
              <td>${inp(p.id,'klein','E', k.E||0)}</td>
              <td class="sum-cell" id="hn_klein_num_${p.id}" style="font-size:1rem;font-weight:800;letter-spacing:1px">${kNum}</td>
              <td class="rank-cell" id="hn_klein_rank_${p.id}">${kRanks[p.id]||'–'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="game-rules" style="margin-top:10px;font-size:.78rem">
      💡 Tipp: Bei der <strong>Großen HN</strong> höchste Zahl auf den Hunderter setzen (z.B. 8-6-3 → <strong>863</strong>).
      Bei der <strong>Kleinen HN</strong> niedrigste Zahl auf den Hunderter setzen (z.B. 1-2-5 → <strong>125</strong>).
      Eine 0 zählt als 0 (Kugel rollt durch) — das ist kein Pudel!
    </div>
  </div>`;
}