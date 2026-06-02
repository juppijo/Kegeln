// ======================================================
// RENDER: HAUSNUMMER
// ======================================================

'use strict';

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

// ======================================================
// RENDER: FUCHSJAGD  (finale Regeln)
// Fuchs baut Gesamtsumme auf (Ziel: 31)
// Alle Jäger werfen je Runde — ihre kombinierte Summe muss Fox-Gesamt erreichen
// ======================================================
function renderFuchs() {
  if (!state.players.length) return noPlayers();
  const fr = state.scores.fuchs;
  if (!fr.fuchsWins)  fr.fuchsWins  = 0;
  if (!fr.hunterWins) fr.hunterWins = 0;
  if (!fr.kaetschen)  fr.kaetschen  = [];

  const fuchsPlayer = state.players.find(p => p.id === fr.fuchsId);
  const hunters     = state.players.filter(p => p.id !== fr.fuchsId);
  const active      = fr.active;

  function turnLabel() {
    if (!active) return '';
    const fn = esc(fuchsPlayer?.name || '?');
    if (active.phase === 'fox_links')  return `🦊 <strong>${fn}</strong> — Vorwurf <em>Linke Hand</em> 🤚`;
    if (active.phase === 'fox_rechts') return `🦊 <strong>${fn}</strong> — Vorwurf <em>Rechte Hand</em> ✋`;
    if (active.phase === 'fox')        return `🦊 <strong>${fn}</strong> — normaler Wurf`;
    if (active.phase === 'hunter') {
      const hi = active.hunterIdx % hunters.length;
      const h  = hunters[hi];
      return `🏹 Jäger <strong>${esc(h?.name || '?')}</strong>
        <span style="font-size:.75rem;color:var(--text3)">(Nr. ${hi + 1} von ${hunters.length})</span>`;
    }
    return '';
  }

  // Jäger-Reihenfolge ab aktuellem Index
  function hunterQueueHtml() {
    if (!active || !hunters.length) return '';
    const currentHi = active.hunterIdx % hunters.length;
    return hunters.map((h, i) => {
      const pos = (i - currentHi + hunters.length) % hunters.length;
      const isCurrent = active.phase === 'hunter' && i === currentHi;
      return `<span style="
        display:inline-block;padding:2px 8px;margin:2px;border-radius:12px;font-size:.75rem;
        background:${isCurrent ? 'var(--accent2)' : pos === 0 && active.phase !== 'hunter' ? 'var(--surface2)' : 'var(--bg3)'};
        color:${isCurrent ? '#000' : 'var(--text2)'};
        border:1px solid ${isCurrent ? 'var(--accent2)' : 'var(--border)'};
        font-weight:${isCurrent ? '700' : '400'};
      ">${pos === 0 && !isCurrent ? '→ ' : ''}${esc(h.name)}</span>`;
    }).join('');
  }

  const foxTotal   = active?.foxTotal || 0;
  const foxPct     = Math.min(100, (foxTotal / 31) * 100);
  const barColor   = foxPct >= 80 ? 'var(--danger)' : foxPct >= 50 ? 'var(--warning)' : 'var(--success)';
  const hRoundTotal = active?.hunterRoundTotal || 0;
  const isHunterPhase = active?.phase === 'hunter';

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🦊 Fuchsjagd</h2>
      <button class="btn-rules" onclick="toggleRules('fuchs')">📜 Regeln</button>
    </div>
    <div id="rules_fuchs" style="display:none">${rulesHtml('fuchs')}</div>

    <!-- FUCHS-WAHL & STEUERUNG -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--bg3);padding:12px;border-radius:var(--radius);border:1px solid var(--border);margin-bottom:14px">
      <span style="font-weight:700;color:var(--accent)">🦊 Fuchs:</span>
      <select class="select-input" onchange="setFuchs(this.value)" ${active ? 'disabled' : ''}>
        <option value="">— Fuchs wählen —</option>
        ${state.players.map(p => `<option value="${p.id}" ${fr.fuchsId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
      </select>
      ${fuchsPlayer ? `<span style="font-size:.8rem;color:var(--text3)">🏹 ${hunters.map(h => esc(h.name)).join(', ') || '(keine Jäger)'}</span>` : ''}
      <div style="display:flex;gap:6px;margin-left:auto;flex-wrap:wrap">
        ${fuchsPlayer && !active
          ? `<button class="btn-primary btn-sm" onclick="startKaetsche()">🎯 Neue Kätsche</button>` : ''}
        ${active
          ? `<button class="btn-secondary btn-sm" onclick="undoFuchsThrow()" ${!active.turns.length ? 'disabled' : ''}>↺ Rückgängig</button>
             <button class="btn-secondary btn-sm" onclick="resetKaetsche()">✕ Abbrechen</button>` : ''}
        ${fr.kaetschen.length > 0 && !active
          ? `<button class="btn-secondary btn-sm" onclick="resetFuchs()">🗑️ Reset</button>` : ''}
      </div>
    </div>

    ${!fuchsPlayer ? '<div class="empty-state">Bitte zuerst einen Fuchs auswählen!</div>' : ''}

    ${active ? `
    <!-- DOPPEL-FORTSCHRITTSBALKEN: FUCHS vs JÄGER -->
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:12px">

      <!-- Fuchs-Balken -->
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <span style="font-weight:700;color:var(--accent);font-size:.9rem">🦊 Fuchs</span>
        <span style="font-weight:800;font-size:1.3rem;color:${foxTotal>=25?'var(--danger)':'var(--text)'}">
          ${foxTotal} <span style="font-size:.75rem;color:var(--text3)">/ 31</span>
        </span>
      </div>
      <div style="background:var(--surface);border-radius:20px;height:18px;overflow:hidden;margin-bottom:10px">
        <div style="background:${barColor};height:100%;width:${foxPct}%;transition:width .4s;border-radius:20px;
             box-shadow:0 0 8px ${barColor}40"></div>
      </div>

      <!-- Jäger-Balken -->
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <span style="font-weight:700;color:var(--accent2);font-size:.9rem">🏹 Jäger Gesamt</span>
        <span style="font-weight:800;font-size:1.3rem;
          color:${(active?.huntersCumTotal||0)>=foxTotal&&foxTotal>0?'var(--success)':'var(--text)'}">
          ${active?.huntersCumTotal||0}
          <span style="font-size:.75rem;color:var(--text3)">/ ${foxTotal||'?'}</span>
        </span>
      </div>
      <div style="background:var(--surface);border-radius:20px;height:18px;overflow:hidden;margin-bottom:6px">
        <div style="background:${(active?.huntersCumTotal||0)>=foxTotal&&foxTotal>0?'var(--success)':'var(--accent2)'};
             height:100%;width:${foxTotal>0?Math.min(100,((active?.huntersCumTotal||0)/foxTotal)*100):0}%;
             transition:width .3s;border-radius:20px"></div>
      </div>

      <!-- Differenz-Anzeige -->
      <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--text3)">
        <span>Fuchs braucht noch <strong>${31-foxTotal}</strong> bis Sieg</span>
        <span>Jäger brauchen noch
          <strong style="color:${(active?.huntersCumTotal||0)>=foxTotal&&foxTotal>0?'var(--success)':'var(--accent2)'}">
            ${Math.max(0,foxTotal-(active?.huntersCumTotal||0))}
          </strong> zum Fangen
        </span>
      </div>
    </div>

    <!-- AKTUELLER ZUG -->
    <div style="background:var(--surface2);border:2px solid ${isHunterPhase ? 'var(--accent2)' : 'var(--accent)'};border-radius:var(--radius);padding:16px;margin-bottom:12px">
      <div style="font-size:.7rem;color:var(--text3);letter-spacing:1px;margin-bottom:6px">AKTUELLER ZUG</div>
      <div style="font-size:1.05rem;margin-bottom:12px">${turnLabel()}</div>
      ${isHunterPhase ? `
        <div style="font-size:.8rem;background:var(--bg3);padding:6px 10px;border-radius:var(--radius);margin-bottom:10px;color:var(--text2)">
          Fuchs-Gesamt: <strong>${foxTotal}</strong> —
          Jäger bisher (kumulativ): <strong>${active?.huntersCumTotal||0}</strong> —
          Noch <strong style="color:var(--accent2)">${Math.max(0,foxTotal-(active?.huntersCumTotal||0))}</strong> zum Fangen
        </div>` : ''}
      <div style="display:flex;gap:8px;align-items:center">
        <input class="score-input-sm" type="number" id="fuchs_input" min="0" max="9" value="0"
          style="font-size:1.3rem;width:64px;height:42px;text-align:center"
          onkeydown="if(event.key==='Enter')processFuchsThrow()">
        <button class="btn-primary" onclick="processFuchsThrow()" style="padding:10px 22px">✅ Bestätigen</button>
      </div>
    </div>

    <!-- JÄGER-REIHENFOLGE -->
    ${hunters.length > 1 ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;margin-bottom:12px;font-size:.8rem">
      <span style="color:var(--text3);margin-right:6px">🏹 Jäger-Reihenfolge:</span>
      ${hunterQueueHtml()}
      ${fr.hunterStartIdx !== undefined && fr.hunterStartIdx > 0 ? `
        <span style="font-size:.7rem;color:var(--text3);display:block;margin-top:4px">
          (Fortsetzung ab Kätsche ${fr.kaetschen.length})
        </span>` : ''}
    </div>` : ''}

    <!-- TURN-LOG -->
    ${active.turns.length > 0 ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px;max-height:240px;overflow-y:auto">
      <div style="font-size:.72rem;font-weight:700;color:var(--text3);margin-bottom:6px;letter-spacing:1px">
        VERLAUF — KÄTSCHE ${fr.kaetschen.length + 1}
      </div>
      ${[...active.turns].reverse().map(t =>
        t.who === 'fox'
          ? `<div style="padding:3px 0;border-bottom:1px solid var(--border);font-size:.8rem;color:var(--accent)">
               🦊 ${esc(fuchsPlayer?.name || '?')}${t.hand === 'L' ? ' 🤚' : t.hand === 'R' ? ' ✋' : ''}:
               <strong>${t.score}</strong> → Gesamt <strong>${t.foxTotal}</strong>
             </div>`
          : `<div style="padding:3px 0;border-bottom:1px solid var(--border);font-size:.8rem;color:var(--text2)">
               🏹 ${esc(t.whoName || '?')}: <strong>${t.score}</strong>
               <span style="color:var(--text3)"> (Jäger-Gesamt: ${t.cumTotal||t.roundTotal})</span>
             </div>`
      ).join('')}
    </div>` : ''}
    ` : ''}

    <!-- KÄTSCHE-CHRONIK -->
    ${fr.kaetschen.length > 0 && !active ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px">
      <div style="font-size:.72rem;font-weight:700;color:var(--text3);margin-bottom:8px;letter-spacing:1px">
        KÄTSCHE-CHRONIK — Fuchs: ${fr.fuchsWins} | Jäger: ${fr.hunterWins}
      </div>
      
      ${fr.kaetschen.map((k, i) => {
        const foxName = state.players.find(p => p.id === fr.fuchsId)?.name || 'Fuchs';
        return `
          <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:.82rem">
            <span style="color:var(--text3)">Kätsche ${i + 1}</span>
            <span style="font-weight:700;color:${k.winner === 'fox' ? 'var(--accent)' : 'var(--accent2)'}">
              ${k.winner === 'fox'
                ? `🦊 ${esc(foxName)} gewinnt (${k.foxFinal} Pkt)`
                : `🏹 Jäger fangen ${esc(foxName)} (${k.foxFinal} Pkt)`}
            </span>
          </div>`;
      }).join('')}

    </div>` : ''}
  </div>`;
}

// ── Fuchs auswählen ──
function setFuchs(id) {
  if (state.scores.fuchs.active) return;
  state.scores.fuchs.fuchsId = id;
  saveData(); showPage('fuchs');
}

// ── Neue Kätsche starten ──
function startKaetsche() {
  const fr = state.scores.fuchs;
  if (!fr.fuchsId) { showToast('Bitte zuerst Fuchs auswählen!', 'error'); return; }
  const hunters = state.players.filter(p => p.id !== fr.fuchsId);
  if (!hunters.length) { showToast('Mindestens 1 Jäger nötig!', 'error'); return; }
  if (fr.hunterStartIdx === undefined) fr.hunterStartIdx = 0;
  fr.active = {
    foxTotal: 0,
    lastFoxThrow: 0,
    phase: 'fox_links',
    hunterIdx: fr.hunterStartIdx % hunters.length,  // weitermachen wo aufgehört
    huntersCumTotal: 0,
    turns: [], complete: false, winner: null
  };
  saveData(); showPage('fuchs');
}

// ── Wurf verarbeiten ──
// Ablauf: Fox_L → Fox_R → Jäger[i] → Fox → Jäger[i+1] → Fox → ...
// Jäger kommen einzeln abwechselnd mit Fuchs.
// Fangbedingung: Jäger-Gesamtsumme ≥ Fuchs-Gesamtsumme (nach JEDEM einzelnen Jäger-Wurf geprüft)
function processFuchsThrow() {
  const score  = parseInt(document.getElementById('fuchs_input')?.value ?? 0) || 0;
  const fr     = state.scores.fuchs;
  const active = fr.active;
  if (!active || active.complete) return;
  const hunters     = state.players.filter(p => p.id !== fr.fuchsId);

  // ── FUCHS wirft ──
  if (['fox_links', 'fox_rechts', 'fox'].includes(active.phase)) {
    active.foxTotal     += score;
    active.lastFoxThrow  = score;
    active.turns.push({
      who: 'fox',
      hand: active.phase === 'fox_links' ? 'L' : active.phase === 'fox_rechts' ? 'R' : null,
      score, foxTotal: active.foxTotal
    });
    if (active.foxTotal >= 31) {
      // FUCHS GEWINNT — Jäger-Reihenfolge dort weitermachen wo sie sind
      fr.hunterStartIdx = active.hunterIdx % hunters.length;
      fr.fuchsWins++;
      fr.kaetschen.push({ winner: 'fox', foxFinal: active.foxTotal });
      fr.active = null;
      saveData(); showPage('fuchs');
      showToast('🦊 Fuchs gewinnt! 31 erreicht!', 'success');
      return;
    }
    // Phase: L → R → Jäger; sonst R/fox → Jäger
    active.phase = active.phase === 'fox_links' ? 'fox_rechts' : 'hunter';

  // ── EIN JÄGER wirft (strikt alternierend mit Fuchs) ──
  } else if (active.phase === 'hunter') {
    const hi     = active.hunterIdx % hunters.length;
    const hunter = hunters[hi];
    active.huntersCumTotal += score;
    active.turns.push({
      who: hunter.id, whoName: hunter.name,
      score, cumTotal: active.huntersCumTotal,
      foxTotal: active.foxTotal
    });
    active.hunterIdx++;   // nächster Jäger beim nächsten Jäger-Zug

    if (active.huntersCumTotal >= active.foxTotal) {
      // JÄGER FANGEN DEN FUCHS
      fr.hunterStartIdx = active.hunterIdx % hunters.length;  // dort weitermachen
      fr.hunterWins++;
      fr.kaetschen.push({ winner: 'hunters', foxFinal: active.foxTotal });
      fr.active = null;
      saveData(); showPage('fuchs');
      showToast(`🏹 Jäger fangen den Fuchs! (${active.huntersCumTotal} ≥ ${active.foxTotal})`, 'success');
      return;
    }
    // Noch nicht gefangen → Fuchs wirft wieder
    active.phase = 'fox';
  }

  const inp = document.getElementById('fuchs_input');
  if (inp) { inp.value = 0; inp.focus(); }
  saveData(); showPage('fuchs');
}

// ── Letzten Zug rückgängig ──
function undoFuchsThrow() {
  const fr = state.scores.fuchs;
  if (!fr.active?.turns?.length) return;
  const last = fr.active.turns.pop();
  if (last.who === 'fox') {
    fr.active.foxTotal      -= last.score;
    fr.active.lastFoxThrow   = fr.active.turns.filter(t => t.who === 'fox').slice(-1)[0]?.score || 0;
    fr.active.phase          = last.hand === 'L' ? 'fox_links' : last.hand === 'R' ? 'fox_rechts' : 'fox';
  } else {
    fr.active.hunterIdx      = Math.max(fr.active.hunterIdx - 1, 0);
    fr.active.huntersCumTotal = Math.max((fr.active.huntersCumTotal || 0) - last.score, 0);
    fr.active.phase          = 'hunter';
  }
  saveData(); showPage('fuchs');
}

function resetKaetsche() {
  state.scores.fuchs.active = null;
  saveData(); showPage('fuchs');
}

function resetFuchs() {
  showConfirm('Fuchsjagd zurücksetzen?', 'Alle Kätsche werden gelöscht!', () => {
    state.scores.fuchs = { fuchsId: state.scores.fuchs.fuchsId, fuchsWins:0, hunterWins:0, kaetschen:[], active:null };
    saveData(); showPage('fuchs');
  });
}
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

// ======================================================
// TANNENBAUM — nach Referenzimplementierung
// Jede Zahl 1–9 braucht BAUM_STRUKTUR[n] Treffer (1,2,3,4,5,4,3,2,1 = 25 Blöcke)
// Spieler geben geworfene Zahlen ein → Baum leuchtet live auf
// Kein Kreuz-Regel: jedes Team füllt seinen eigenen Baum
// ======================================================

// Tannenbaum: Anzahl benötigter Treffer pro Zahl (Pyramide 1→5→1, gesamt 25 Blöcke)
const BAUM_STRUKTUR = {1:1, 2:2, 3:3, 4:4, 5:5, 6:4, 7:3, 8:2, 9:1};

function getTeamCounts(group) {
  const tb = state.scores.tannenbaum;
  const c  = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};
  (tb[group]||[]).forEach(pid => {
    ((tb.throws||{})[pid]||[]).forEach(v => { if (v>=1&&v<=9) c[v]++; });
  });
  return c;
}

function isTeamDone(group) {
  const c = getTeamCounts(group);
  return Object.keys(BAUM_STRUKTUR).every(n => c[n] >= BAUM_STRUKTUR[n]);
}

function treeDisplayHtml(group) {
  const c     = getTeamCounts(group);
  const isG1  = group === 'g1';
  const color = isG1 ? '#3b82f6' : '#f59e0b';
  const glow  = isG1 ? 'rgba(59,130,246,.7)' : 'rgba(245,158,11,.7)';
  const label = isG1 ? '🔵 Team A' : '🟠 Team B';
  const total = Object.keys(BAUM_STRUKTUR).reduce((a,n)=>a+Math.min(c[n],BAUM_STRUKTUR[n]),0);
  const done  = isTeamDone(group);
  return `
    <div style="flex:1;text-align:center;background:#0f0f1e;border-radius:var(--radius);padding:16px;
      border:2px solid ${done?color:'#2d3561'}">
      <div style="color:${color};font-weight:700;font-size:.95rem;margin-bottom:12px">
        ${label} ${done ? '<span style="color:gold">🏆 FERTIG!</span>' : `(${total}/25)`}
      </div>
      ${[1,2,3,4,5,6,7,8,9].map(n=>{
        const need = BAUM_STRUKTUR[n];
        const got  = Math.min(c[n], need);
        return `<div style="display:flex;justify-content:center;gap:4px;margin-bottom:5px">
          ${Array(need).fill(0).map((_,i)=>`
            <div style="width:34px;height:34px;border-radius:4px;
              display:flex;align-items:center;justify-content:center;
              font-weight:800;font-size:.9rem;
              background:${i<got?color:'#1e2040'};
              color:${i<got?'#fff':'#4a5080'};
              box-shadow:${i<got?`0 0 7px ${glow}`:'none'};
              transition:background .25s,box-shadow .25s">${n}</div>
          `).join('')}
        </div>`;
      }).join('')}
    </div>`;
}

function renderTannenbaum() {
  if (!state.players.length) return noPlayers();
  const tb = state.scores.tannenbaum;
  if (!tb.g1)     tb.g1     = [];
  if (!tb.g2)     tb.g2     = [];
  if (!tb.g1wins) tb.g1wins = 0;
  if (!tb.g2wins) tb.g2wins = 0;
  if (!tb.throws) tb.throws = {};

  const g1done = isTeamDone('g1');
  const g2done = isTeamDone('g2');

  // Status-Banner
  let statusText  = '🎳 Spiel läuft…';
  let statusBg    = 'var(--bg3)';
  let statusBd    = 'var(--border)';
  if (g1done && g2done) { statusText='🤝 Unentschieden — beide gleichzeitig fertig!'; statusBg='rgba(255,255,255,.05)'; statusBd='var(--border2)'; }
  else if (g1done)      { statusText='🏆 Team A gewinnt! 🎉';  statusBg='rgba(59,130,246,.12)'; statusBd='#3b82f6'; }
  else if (g2done)      { statusText='🏆 Team B gewinnt! 🎉';  statusBg='rgba(245,158,11,.12)'; statusBd='#f59e0b'; }

  // Spieler-Eingabe-Zeilen
  function playerRows(group) {
    const col = group==='g1' ? '#3b82f6' : '#f59e0b';
    return (tb[group]||[]).map(pid=>{
      const throws = (tb.throws[pid]||[]);
      const last4  = throws.slice(-4).join(', ')||'–';
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;
          border-bottom:1px solid var(--border);flex-wrap:wrap">
          <div style="flex:1;min-width:80px">
            <div style="font-weight:700;font-size:.88rem">${pname(pid)}</div>
            <div style="font-size:.7rem;color:var(--text3)">Letzte: ${last4}</div>
          </div>
          <input type="number" min="1" max="9" id="tb_inp_${pid}"
            style="width:52px;height:36px;text-align:center;background:var(--bg3);
              border:1px solid var(--border);color:var(--text);border-radius:var(--radius);
              font-weight:800;font-size:1rem;-moz-appearance:textfield"
            placeholder="1-9"
            onkeydown="if(event.key==='Enter'){event.preventDefault();
              addTbThrow('${pid}',this.value);this.value='';this.focus()}">
          <button onclick="addTbThrow('${pid}',document.getElementById('tb_inp_${pid}').value);
            document.getElementById('tb_inp_${pid}').value='';
            document.getElementById('tb_inp_${pid}').focus()"
            style="background:${col};border:none;color:#000;font-weight:800;
              padding:7px 12px;border-radius:var(--radius);cursor:pointer;font-size:.85rem">+</button>
          ${throws.length>0?`
            <button onclick="undoTbThrow('${pid}')"
              style="background:var(--surface2);border:1px solid var(--border);color:var(--text2);
                padding:7px 8px;border-radius:var(--radius);cursor:pointer;font-size:.75rem"
              title="Letzten Wurf rückgängig">↺</button>`:''}
        </div>`;
    }).join('');
  }

  return `
  <div class="page-card">
    <div class="card-header">
      <h2>🌲 Tannenbaum</h2>
      <button class="btn-rules" onclick="toggleRules('tannenbaum')">📜 Regeln</button>
    </div>
    <div id="rules_tannenbaum" style="display:none">${rulesHtml('tannenbaum')}</div>

    <!-- STATUS-BANNER -->
    <div style="text-align:center;font-size:1.15rem;font-weight:700;
      padding:12px 16px;background:${statusBg};border:2px solid ${statusBd};
      border-radius:var(--radius);margin-bottom:14px">
      ${statusText}
      ${(g1done||g2done)?`<div style="margin-top:8px">
        <button class="btn-primary btn-sm" onclick="newTbGame()">🔄 Neues Spiel</button>
      </div>`:''}
    </div>

    <!-- BÄUME -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      ${treeDisplayHtml('g1')}
      ${treeDisplayHtml('g2')}
    </div>

    <!-- SPIELER-EINGABE (2 Spalten) -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      ${['g1','g2'].map((g,gi)=>{
        const col   = g==='g1'?'#3b82f6':'#f59e0b';
        const label = g==='g1'?'🔵 Team A':'🟠 Team B';
        return `
          <div style="background:var(--bg3);border:2px solid ${col}44;border-radius:var(--radius);padding:12px">
            <div style="font-weight:700;color:${col};margin-bottom:8px;font-size:.9rem">${label}</div>
            ${(tb[g]||[]).length===0
              ? `<div style="color:var(--text3);font-size:.8rem;padding:8px 0">Noch keine Spieler.</div>`
              : playerRows(g)}
          </div>`;
      }).join('')}
    </div>

    <!-- SPIELER ZUORDNEN -->
    <details style="margin-bottom:12px">
      <summary style="cursor:pointer;color:var(--text2);font-size:.85rem;padding:6px 0">
        ⚙️ Spieler zuordnen
      </summary>
      <div style="padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${['g1','g2'].map((g,gi)=>{
          const col = g==='g1'?'#3b82f6':'#f59e0b';
          return `
            <div style="background:var(--bg3);border:1px solid var(--border);
              border-radius:var(--radius);padding:10px">
              <div style="font-weight:700;color:${col};margin-bottom:8px">Team ${gi===0?'A':'B'}</div>
              ${(tb[g]||[]).map(pid=>`
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:.82rem">
                  <span style="flex:1">${pname(pid)}</span>
                  <button class="btn-icon-sm btn-danger-sm" onclick="removeTbPlayer('${g}','${pid}')">✕</button>
                </div>`).join('')}
              <select class="select-input" style="width:100%;margin-top:6px;font-size:.8rem"
                onchange="addTbPlayer('${g}',this.value);this.value=''">
                <option value="">Spieler hinzufügen…</option>
                ${state.players.filter(p=>!(tb.g1||[]).includes(p.id)&&!(tb.g2||[]).includes(p.id))
                  .map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}
              </select>
            </div>`;
        }).join('')}
      </div>
    </details>

    <!-- SIEGE -->
    <div style="display:flex;gap:16px;align-items:center;font-size:.85rem;color:var(--text3)">
      <span>🔵 Team A: <strong style="color:#3b82f6">${tb.g1wins}</strong> Siege</span>
      <span>🟠 Team B: <strong style="color:#f59e0b">${tb.g2wins}</strong> Siege</span>
      ${tb.g1wins>0||tb.g2wins>0
        ?`<button class="btn-secondary btn-sm" onclick="resetTbAll()" style="margin-left:auto">
            🗑️ Alles reset</button>`:''}
    </div>
  </div>`;
}

// ── Wurf hinzufügen ──
function addTbThrow(pid, valStr) {
  const val = parseInt(valStr);
  if (!val || val < 1 || val > 9) { showToast('Bitte Zahl 1–9 eingeben!', 'error'); return; }
  const tb = state.scores.tannenbaum;
  if (!tb.throws)      tb.throws      = {};
  if (!tb.throws[pid]) tb.throws[pid] = [];
  tb.throws[pid].push(val);
  // Gewinn-Check (nur einmal zählen, wenn gerade vollendet)
  const g1done = isTeamDone('g1');
  const g2done = isTeamDone('g2');
  if (g1done || g2done) {
    // Nur zählen wenn vorher noch nicht gewonnen
    const prev1 = (tb.throws.g1winCounted || false);
    const prev2 = (tb.throws.g2winCounted || false);
    if (g1done && !prev1) { tb.g1wins++; tb.throws.g1winCounted = true; }
    if (g2done && !prev2) { tb.g2wins++; tb.throws.g2winCounted = true; }
    if (g1done && g2done) showToast('🤝 Unentschieden!');
    else if (g1done) showToast('🏆 Team A gewinnt!', 'success');
    else             showToast('🏆 Team B gewinnt!', 'success');
  }
  saveData();
  showPage('tannenbaum');
}

// ── Letzten Wurf eines Spielers rückgängig ──
function undoTbThrow(pid) {
  const tb = state.scores.tannenbaum;
  if (tb.throws?.[pid]?.length > 0) {
    tb.throws[pid].pop();
    // Win-Flag zurücksetzen falls jetzt nicht mehr fertig
    if (!isTeamDone('g1')) tb.throws.g1winCounted = false;
    if (!isTeamDone('g2')) tb.throws.g2winCounted = false;
    saveData(); showPage('tannenbaum');
  }
}

// ── Neues Spiel (Würfe reset, Siege bleiben) ──
function newTbGame() {
  const tb = state.scores.tannenbaum;
  tb.throws = {};
  saveData(); showPage('tannenbaum');
}

// ── Alles zurücksetzen ──
function resetTbAll() {
  showConfirm('Alles zurücksetzen?','Siege und alle Würfe werden gelöscht.',()=>{
    const tb = state.scores.tannenbaum;
    tb.throws = {}; tb.g1wins = 0; tb.g2wins = 0;
    saveData(); showPage('tannenbaum');
  });
}

function addTbPlayer(g, pid) {
  if (!pid) return;
  const tb = state.scores.tannenbaum;
  if (!tb[g]) tb[g]=[];
  tb[g].push(pid);
  saveData(); showPage('tannenbaum');
}
function removeTbPlayer(g, pid) {
  state.scores.tannenbaum[g] = (state.scores.tannenbaum[g]||[]).filter(x=>x!==pid);
  if (state.scores.tannenbaum.throws) delete state.scores.tannenbaum.throws[pid];
  saveData(); showPage('tannenbaum');
}





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