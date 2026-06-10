// ======================================================
// RENDER: KEGELBUCH
// ======================================================

'use strict';

function renderKegelbuch() {
  if (!state.players.length) return noPlayers();
  const wts = [0.2,0.4,0.6,0.8,1.0];

  // Overall points calculation per player
  function getPoints(pid) {
    const sv  = state.scores.sv[pid]||{throws:[],karte:0};
    const id  = state.scores.idiot[pid]||{links:0,beine:0,rechts:0};
    const mn  = state.scores.mensch[pid]||{throws:[]};
    const svT = s(sv.throws)+(sv.karte||0);
    const rnT = ((state.scores.rennen.days||{})[pid]||[]).reduce((a,v,i)=>a+(v||0)*(i+1),0);
    return grossHN(pid)+(id.links||0)+(id.beine||0)+(id.rechts||0)+s(mn.throws)+svT+rnT;
  }

  function getSchweinSchuld(pid) {
    const sw = state.scores.schwein[pid]||{vals:[]};
    return sw.vals.reduce((a,x,i)=>a+(x||0)*wts[i],0);
  }

  const totalPunkte = state.players.reduce((a,p)=>a+getPoints(p.id),0);
  const totalSchwein = state.players.reduce((a,p)=>a+getSchweinSchuld(p.id),0);

  return `
  <div class="page-card">
    <div class="card-header"><h2>📖 Kegelbuch</h2></div>
    <div class="kegelbuch-totals">
      <div class="total-card"><div class="val">${state.players.length}</div><div class="lbl">Spieler</div></div>
      <div class="total-card"><div class="val">${totalPunkte}</div><div class="lbl">Gesamtpunkte</div></div>
      <div class="total-card"><div class="val">${totalSchwein.toFixed(2)}€</div><div class="lbl">Schweinepartie Σ</div></div>
      <div class="total-card"><div class="val">${state.scores.fuchs.rounds.length}</div><div class="lbl">Fuchs-Runden</div></div>
    </div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Startgeld<br>✓/✗</th>
            <th>🟣 Pudel<br>(0 Kegel)</th>
            <th>⭐ Stina<br>(alle 9)</th>
            <th>🐷 Schwein-<br>partie €</th>
            <th>Zu zahlen</th>
            <th>Punkte<br>Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p => {
            const kb  = state.kegelbuch[p.id] || { startgeld:false, pudel:0, stina:0 };
            const sw  = getSchweinSchuld(p.id);
            const pts = getPoints(p.id);
            // Pudel-Strafe: 0.10€ je Pudel; Stina: kein Abzug (Bonus)
            const zahlen = sw + (kb.pudel||0)*0.10;
            return `<tr>
              <td class="name-cell">${esc(p.name)}</td>
              <td style="text-align:center">
                <input type="checkbox" ${kb.startgeld?'checked':''}
                  onchange="toggleStartgeld('${p.id}',this.checked)">
              </td>
              <td><input class="score-input" type="number" min="0" max="99" value="${kb.pudel||0}"
                data-score data-game="kb" data-pid="${p.id}" data-field="pudel" data-idx="0"></td>
              <td><input class="score-input" type="number" min="0" max="99" value="${kb.stina||0}"
                data-score data-game="kb" data-pid="${p.id}" data-field="stina" data-idx="0"></td>
              <td class="sum-cell">${sw.toFixed(2)}€</td>
              <td id="kb_zahlen_${p.id}" style="color:var(--danger);font-weight:700">${zahlen.toFixed(2)}€</td>
              <td class="sum-cell">${pts}</td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:rgba(232,160,32,.08)">
            <td class="name-cell" style="font-weight:700">SUMME</td>
            <td style="text-align:center;font-weight:700">${state.players.filter(p=>(state.kegelbuch[p.id]||{}).startgeld).length}/${state.players.length}</td>
            <td style="font-weight:700;color:var(--accent);text-align:center">${state.players.reduce((a,p)=>a+((state.kegelbuch[p.id]||{}).pudel||0),0)}</td>
            <td style="font-weight:700;color:var(--accent);text-align:center">${state.players.reduce((a,p)=>a+((state.kegelbuch[p.id]||{}).stina||0),0)}</td>
            <td style="font-weight:700;color:var(--accent)">${totalSchwein.toFixed(2)}€</td>
            <td style="font-weight:700;color:var(--danger)">${state.players.reduce((a,p)=>{
              const kb=state.kegelbuch[p.id]||{};
              return a+getSchweinSchuld(p.id)+(kb.pudel||0)*0.10;
            },0).toFixed(2)}€</td>
            <td style="font-weight:700;color:var(--accent)">${totalPunkte}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="game-rules" style="margin-top:12px">
      🟣 <strong>Pudel</strong> = 0 Kegel getroffen → 0,10€ Strafe je Pudel &nbsp;|&nbsp;
      ⭐ <strong>Stina</strong> = Alle 9 Kegel (Volle) → wird gezählt &nbsp;|&nbsp;
      <strong>Zu zahlen</strong> = Schweinpartie + Pudel-Strafen
    </div>
  </div>`;
}

function toggleStartgeld(pid, checked) {
  if (!state.kegelbuch[pid]) state.kegelbuch[pid]={};
  state.kegelbuch[pid].startgeld = checked;
  saveData();
}

//-------------------------------------------------------------------------------------------------------------

// ── Auswertung — Platzierungs-Wertung ────────────────────────────
// Ersetze die bestehende renderAuswertung()-Funktion in spiele.js
// durch diese Version.
//
// Wertung: Jedes Spiel vergibt Platzierungspunkte (1. = 1 Pkt, 2. = 2 Pkt …)
// Niedrigste Gesamtsumme = Gesamtsieger (wie Mehrkampf / Golfsystem)
// Hausnummer: zwei getrennte Wertungen (Große HN + Kleine HN)
// ─────────────────────────────────────────────────────────────────

function renderAuswertung() {
  if (!state.players.length) return noPlayers();

  const wts = [0.2, 0.4, 0.6, 0.8, 1.0];
  const n   = state.players.length; // Anzahl Spieler

  // ── Score-Funktionen pro Spiel ──────────────────────────────────
  const scoreGrossHN   = pid => grossHN(pid);
  const scoreKleinHN   = pid => kleinHN(pid);
  const scoreSv        = pid => {
    const sv = state.scores.sv[pid] || { throws:[], karte:0 };
    const t  = s(sv.throws) + (sv.karte||0);
    return t > 21 ? -1 : t;              // Überkauft = letzter Platz
  };
  const scoreRennen    = pid => {
    const d = (state.scores.rennen.days||{})[pid] || [];
    return d.reduce((a,v,i) => a+(v||0)*(i+1), 0);
  };
  const scoreSchwein   = pid => {
    const sw = state.scores.schwein[pid] || { vals:[] };
    return sw.vals.reduce((a,x,i) => a+(x||0)*wts[i], 0);
  };
  const scoreIdiot     = pid => {
    const id = state.scores.idiot[pid] || {};
    return (id.links||0) + (id.beine||0) + (id.rechts||0);
  };
  const scoreMensch    = pid => s((state.scores.mensch[pid]||{throws:[]}).throws);
  const scoreFuchs     = pid => {
    const fr = state.scores.fuchs; if (!fr?.kaetschen) return 0;
    if (pid === fr.fuchsId) return fr.kaetschen.filter(k => k.winner==='fox').length;
    const hunters = state.players.filter(p => p.id !== fr.fuchsId);
    return hunters.find(h => h.id===pid)
      ? fr.kaetschen.filter(k => k.winner==='hunters').length : 0;
  };
  const scoreEinsacken = pid => {
    const es = state.scores.einsacken;
    let g = (es.g1||[]).includes(pid) ? 'g1' : (es.g2||[]).includes(pid) ? 'g2' : null;
    if (!g) return 0;
    return (es.rounds||[]).reduce((sum, rd) => {
      const members = es[g]||[]; let best = -1;
      members.forEach(p => { const sc=(rd[g]&&rd[g][p])||0; if(sc>best) best=sc; });
      return sum + (((rd[g]&&rd[g][pid])||0) === best && best > 0 ? 1 : 0);
    }, 0);
  };

  // ── Platzierungen pro Spiel berechnen ──────────────────────────
  // Gibt {pid → Platz} zurück. Nicht gespielte Spiele (alle 0)
  // → alle auf Platz n (letzter), damit kein Vorteil entsteht.
  function placementMap(scoreFn, higherBetter = true) {
    const entries = state.players.map(p => ({ id: p.id, total: scoreFn(p.id) }));
    const allZero = entries.every(e => e.total === 0);
    const map = {};
    if (allZero) {
      // Spiel noch nicht gespielt → alle neutral auf Platz n
      state.players.forEach(p => { map[p.id] = n; });
    } else {
      rank(entries, higherBetter).forEach(r => { map[r.id] = r.rank; });
    }
    return map;
  }

  // Alle 9 Einzel-Platzierungskarten (Hausnummer = 2×)
  const pl = {
    grossHN:   placementMap(scoreGrossHN,   true),
    kleinHN:   placementMap(scoreKleinHN,   false),  // niedrige Zahl = besser
    sv:        placementMap(scoreSv,         true),
    rennen:    placementMap(scoreRennen,     true),
    schwein:   placementMap(scoreSchwein,    true),
    idiot:     placementMap(scoreIdiot,      true),
    mensch:    placementMap(scoreMensch,     true),
    fuchs:     placementMap(scoreFuchs,      true),
    einsacken: placementMap(scoreEinsacken,  true),
  };
  const colKeys = Object.keys(pl); // Reihenfolge der Spalten

  // ── Gesamtsumme & Rangliste ──────────────────────────────────
  const totalPl = pid => colKeys.reduce((sum, k) => sum + (pl[k][pid]||n), 0);

  // Aufsteigend: niedrigste Summe = Rang 1
  const overallRanked = rank(
    state.players.map(p => ({ id:p.id, name:p.name, total:totalPl(p.id) })),
    false
  );

  // ── Podium ────────────────────────────────────────────────────
  const sorted3     = overallRanked.slice(0, 3);
  while (sorted3.length < 3) sorted3.push(null);
  const podiumOrder = [sorted3[1], sorted3[0], sorted3[2]];
  const podiumCls   = ['p2','p1','p3'];
  const podiumTroph = ['🥈','🥇','🥉'];

  const podiumCard  = (entry, cls, trophy) => !entry
    ? `<div class="podium-place ${cls}"><div class="podium-block" style="opacity:.3">–</div></div>`
    : `<div class="podium-place ${cls}">
        <div class="podium-trophy">${trophy}</div>
        <div class="podium-name">${esc(entry.name)}</div>
        <div class="podium-score" title="Niedrigere Summe = besser">${entry.total} Pl.</div>
        <div class="podium-block">${entry.rank}.</div>
      </div>`;

  // ── Spalten-Definition ────────────────────────────────────────
  const cols = [
    { key:'grossHN',   label:'Gr.HN',   title:'Große Hausnummer (höchste Zahl)' },
    { key:'kleinHN',   label:'Kl.HN',   title:'Kleine Hausnummer (niedrigste Zahl)' },
    { key:'sv',        label:'17u4',    title:'17 und 4' },
    { key:'rennen',    label:'Rennen',  title:'6-Tage-Rennen (Einzel)' },
    { key:'schwein',   label:'Schwein', title:'Schweinepartie (mehr Pins = besser)' },
    { key:'idiot',     label:'Idiot',   title:'Idiotenkegeln' },
    { key:'mensch',    label:'Mensch',  title:'Mensch ärger dich nicht' },
    { key:'fuchs',     label:'Fuchs',   title:'Fuchsjagd (Kätsche-Siege)' },
    { key:'einsacken', label:'Einsa.',  title:'Einsacken (Runden-Siege)' },
  ];

  // Zellen-Renderer: Medaillen-Farbe für Top 3
  const plCell = (r) => {
    const color = r===1 ? 'var(--gold)' : r===2 ? 'var(--silver)' : r===3 ? 'var(--bronze)' : 'var(--text3)';
    const bg    = r<=3 ? (r===1?'rgba(255,215,0,.12)':r===2?'rgba(192,192,192,.12)':'rgba(205,127,50,.12)') : '';
    return `<td style="text-align:center;font-weight:700;color:${color};font-size:.82rem;background:${bg}">${medal(r)}</td>`;
  };

  // ── Spielsieger (unverändert) ─────────────────────────────────
  function gameWinner(scoreFn, hb=true) {
    const ranked = rank(state.players.map(p=>({id:p.id,name:p.name,total:scoreFn(p.id)})), hb);
    const winners = ranked.filter(r => r.rank===1);
    if (!winners.length || winners[0].total===0) return null;
    return { names: winners.map(w=>esc(w.name)).join(' &amp; '), score: winners[0].total };
  }

  const gameWinners = [
    { title:'🏠 Große Hausnummer',  w: gameWinner(scoreGrossHN,  true)  },
    { title:'🏠 Kleine Hausnummer', w: gameWinner(scoreKleinHN,  false) },
    { title:'🃏 17 und 4',           w: gameWinner(scoreSv,       true)  },
    { title:'🚀 6-Tage-Rennen',     w: gameWinner(scoreRennen,   true)  },
    { title:'🐷 Schweinepartie',     w: gameWinner(scoreSchwein,  true)  },
    { title:'🤪 Idiotenkegeln',      w: gameWinner(scoreIdiot,    true)  },
    { title:'🎲 Mensch ä.d.n.',      w: gameWinner(scoreMensch,   true)  },
    { title:'🦊 Fuchsjagd',          w: gameWinner(scoreFuchs,    true)  },
    { title:'💰 Einsacken',          w: gameWinner(scoreEinsacken,true)  },
  ];

  const tb = state.scores.tannenbaum;

  return `
  <div class="page-card">
    <div class="card-header"><h2>🏆 Gesamtauswertung</h2></div>

    <!-- PODIUM -->
    <div class="podium-section">
      ${podiumOrder.map((e,i) => podiumCard(e, podiumCls[i], podiumTroph[i])).join('')}
    </div>

    <!-- ERKLÄRUNG -->
    <div class="game-rules" style="margin-bottom:14px;font-size:.78rem">
      📊 <strong>Mehrkampf-Wertung:</strong> Jedes Spiel vergibt Platzierungspunkte
      (🥇&nbsp;=&nbsp;1&nbsp;Pkt, 🥈&nbsp;=&nbsp;2&nbsp;Pkt&nbsp;…).
      <strong>Niedrigste Gesamtsumme gewinnt.</strong>
      Die Hausnummer zählt doppelt — Große HN und Kleine HN werden separat gewertet.
      Noch nicht gespielte Spiele: alle auf letztem Platz (neutral).
    </div>

    <!-- GESAMTRANGLISTE -->
    <hr class="sect-divider">
    <h3 style="font-size:.85rem;color:var(--text3);margin-bottom:10px;letter-spacing:1px">
      GESAMTRANGLISTE <span style="font-weight:400;font-size:.75rem">(↓ = besser)</span>
    </h3>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th rowspan="2" style="vertical-align:bottom">Platz</th>
            <th rowspan="2" style="vertical-align:bottom">Name</th>
            <th colspan="2" class="section-header gross" title="Große und Kleine Hausnummer">🏠 Hausnummer</th>
            <th colspan="7" class="section-header" style="background:rgba(120,80,200,.15);color:#b080ff">🎳 Einzelspiele</th>
            <th rowspan="2" style="vertical-align:bottom;min-width:52px">Σ&nbsp;Plätze</th>
          </tr>
          <tr>
            ${cols.map(c =>
              `<th title="${c.title}" style="font-size:.65rem;white-space:nowrap">${c.label}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>
          ${overallRanked.map(r => `
            <tr style="${r.rank<=3 ? 'background:rgba(232,160,32,.06)' : ''}">
              <td class="rank-cell" style="font-size:1.05rem">${medal(r.rank)}</td>
              <td class="name-cell">${esc(r.name)}</td>
              ${cols.map(c => plCell(pl[c.key][r.id] || n)).join('')}
              <td style="text-align:center;font-weight:800;font-size:.95rem;
                color:${r.rank===1?'var(--gold)':r.rank===2?'var(--silver)':r.rank===3?'var(--bronze)':'var(--accent)'}">
                ${r.total}
              </td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="font-size:.7rem;color:var(--text3);padding:6px 8px;text-align:left">
              ${n} Spieler · ${cols.length} Spiele · max. ${n * cols.length} Platzierungspunkte
            </td>
            ${cols.map(() => '<td></td>').join('')}
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- SPIELSIEGER -->
    <hr class="sect-divider">
    <h3 style="font-size:.85rem;color:var(--text3);margin-bottom:10px;letter-spacing:1px">SPIELSIEGER</h3>
    <div class="game-results-grid">
      ${gameWinners.map(gw => `
        <div class="game-result-card">
          <div class="game-name">${gw.title}</div>
          ${gw.w
            ? `<div class="winner">🥇 ${gw.w.names}</div>
               <div class="score">${Number.isInteger(gw.w.score) ? gw.w.score : gw.w.score.toFixed(2)} Pkt</div>`
            : `<div class="winner" style="color:var(--text3)">– Noch keine Daten –</div>`}
        </div>`).join('')}
      <div class="game-result-card">
        <div class="game-name">🌲 Tannenbaum</div>
        <div class="winner">
          🔵 Team A: ${tb.g1wins||0} 🌲 &nbsp;|&nbsp; 🟠 Team B: ${tb.g2wins||0} 🌲
        </div>
        <div class="score">
          ${(tb.g1wins||0)>(tb.g2wins||0) ? '🥇 Team A gewinnt!'
            : (tb.g2wins||0)>(tb.g1wins||0) ? '🥇 Team B gewinnt!' : 'Unentschieden'}
        </div>
      </div>
    </div>
  </div>`;
}

// ======================================================
// MODAL HELPERS
// ======================================================
function showInputModal(title, defaultVal, callback) {
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <div class="modal-title">${esc(title)}</div>
    <input class="modal-input" id="modalInput" type="text" value="${esc(defaultVal)}" maxlength="50">
    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-modal-ok" onclick="submitInputModal()">OK</button>
    </div>`;
  document._modalCb = callback;
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => { const i = document.getElementById('modalInput'); if(i){i.focus();i.select();} }, 50);
  const inp = document.getElementById('modalInput');
  if (inp) inp.addEventListener('keydown', e => { if(e.key==='Enter') submitInputModal(); if(e.key==='Escape') closeModal(); });
}

function submitInputModal() {
  const val = document.getElementById('modalInput')?.value || '';
  const cb = document._modalCb;   // save BEFORE closeModal nulls it
  closeModal();
  if (cb) cb(val);
}

function showConfirm(title, msg, callback) {
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <div class="modal-title">${esc(title)}</div>
    <div class="modal-sub">${esc(msg)}</div>
    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-modal-confirm-delete" onclick="confirmAction()">Bestätigen</button>
    </div>`;
  document._modalCb = callback;
  document.getElementById('modal').classList.remove('hidden');
}

function confirmAction() {
  const cb = document._modalCb;   // save BEFORE closeModal nulls it
  closeModal();
  if (cb) cb();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document._modalCb = null;
}

// ======================================================
// TOAST
// ======================================================
let _toastTimer = null;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' '+type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.className='toast hidden'; }, 300);
  }, 2200);
}

// ======================================================
// RULES TOGGLE
// ======================================================
function toggleRules(id) {
  const el = document.getElementById('rules_'+id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
