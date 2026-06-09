'use strict';

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
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:12px">

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

      <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--text3)">
        <span>Fuchs braucht noch <strong>${31-foxTotal}</strong> bis Sieg</span>
        <span>Jäger brauchen noch
          <strong style="color:${(active?.huntersCumTotal||0)>=foxTotal&&foxTotal>0?'var(--success)':'var(--accent2)'}">
            ${Math.max(0,foxTotal-(active?.huntersCumTotal||0))}
          </strong> zum Fangen
        </span>
      </div>
    </div>

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

    ${hunters.length > 1 ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;margin-bottom:12px;font-size:.8rem">
      <span style="color:var(--text3);margin-right:6px">🏹 Jäger-Reihenfolge:</span>
      ${hunterQueueHtml()}
      ${fr.hunterStartIdx !== undefined && fr.hunterStartIdx > 0 ? `
        <span style="font-size:.7rem;color:var(--text3);display:block;margin-top:4px">
          (Fortsetzung ab Kätsche ${fr.kaetschen.length})
        </span>` : ''}
    </div>` : ''}

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

    ${fr.kaetschen.length > 0 && !active ? `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px">
      <div style="font-size:.72rem;font-weight:700;color:var(--text3);margin-bottom:8px;letter-spacing:1px">
        KÄTSCHE-CHRONIK — Fuchs: ${fr.fuchsWins} | Jäger: ${fr.hunterWins}
      </div>
      
      ${fr.kaetschen.map((k, i) => {
        // Fallback falls ein altes Spiel geladen wurde, das noch keinen Namen gespeichert hatte
        const historicFoxName = k.foxName || 'Fuchs'; 
        return `
          <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:.82rem">
            <span style="color:var(--text3)">Kätsche ${i + 1}</span>
            <span style="font-weight:700;color:${k.winner === 'fox' ? 'var(--accent)' : 'var(--accent2)'}">
              ${k.winner === 'fox'
                ? `🦊 ${esc(historicFoxName)} gewinnt (${k.foxFinal} Pkt)`
                : `🏹 Jäger fangen ${esc(historicFoxName)} ${k.caughtBy ? `durch ${esc(k.caughtBy)}` : ''} (${k.foxFinal} Pkt)`}
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
function processFuchsThrow() {
  const score  = parseInt(document.getElementById('fuchs_input')?.value ?? 0) || 0;
  const fr     = state.scores.fuchs;
  const active = fr.active;
  if (!active || active.complete) return;
  const hunters     = state.players.filter(p => p.id !== fr.fuchsId);
  const fuchsPlayer = state.players.find(p => p.id === fr.fuchsId);
  const currentFoxName = fuchsPlayer ? fuchsPlayer.name : 'Fuchs';

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
      // FUCHS GEWINNT
      fr.hunterStartIdx = active.hunterIdx % hunters.length;
      fr.fuchsWins++;
      // HIER GEÄNDERT: Aktuellen Fuchsnamen für die Chronik einfrieren
      fr.kaetschen.push({ winner: 'fox', foxName: currentFoxName, foxFinal: active.foxTotal });
      fr.active = null;
      saveData(); showPage('fuchs');
      showToast(`🦊 Fuchs ${currentFoxName} gewinnt! 31 erreicht!`, 'success');
      return;
    }
    active.phase = active.phase === 'fox_links' ? 'fox_rechts' : 'hunter';

  // ── EIN JÄGER wirft ──
  } else if (active.phase === 'hunter') {
    const hi     = active.hunterIdx % hunters.length;
    const hunter = hunters[hi];
    active.huntersCumTotal += score;
    active.turns.push({
      who: hunter.id, whoName: hunter.name,
      score, cumTotal: active.huntersCumTotal,
      foxTotal: active.foxTotal
    });
    active.hunterIdx++;

    if (active.huntersCumTotal >= active.foxTotal) {
      // JÄGER FANGEN DEN FUCHS
      fr.hunterStartIdx = active.hunterIdx % hunters.length;
      fr.hunterWins++;
      // HIER GEÄNDERT: Fuchsnamen und erfolgreichen Jäger einfrieren
      fr.kaetschen.push({ winner: 'hunters', foxName: currentFoxName, foxFinal: active.foxTotal, caughtBy: hunter.name });
      fr.active = null;
      saveData(); showPage('fuchs');
      showToast(`🏹 Jäger fangen den Fuchs! (${active.huntersCumTotal} ≥ ${active.foxTotal})`, 'success');
      return;
    }
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