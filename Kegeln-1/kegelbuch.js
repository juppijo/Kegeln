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

// ======================================================
// RENDER: AUSWERTUNG
// ======================================================
function renderAuswertung() {
  if (!state.players.length) return noPlayers();
  const wts = [0.2, 0.4, 0.6, 0.8, 1.0];

  // ---- Points per game per player ----
  function pts_hausnummer(pid) {
    // For overall points: use gross HN value (normalized 0-9 per digit = max 999)
    // Give bonus points for good performance: gross ranks up, klein ranks down
    return grossHN(pid);
  }
  function pts_sv(pid) {
    const sv = state.scores.sv[pid] || { throws: [], karte: 0 };
    const t = s(sv.throws) + (sv.karte || 0);
    return t > 21 ? 0 : t;          // busted = 0 points
  }
  function pts_rennen(pid) {
    const days = (state.scores.rennen.days || {})[pid] || [];
    return days.reduce((a, v, i) => a + (v || 0) * (i + 1), 0);
  }
  function pts_idiot(pid) {
    const id = state.scores.idiot[pid] || { links: 0, beine: 0, rechts: 0 };
    return (id.links || 0) + (id.beine || 0) + (id.rechts || 0);
  }
  function pts_mensch(pid) {
    return s((state.scores.mensch[pid] || { throws: [] }).throws);
  }
  function pts_fuchs(pid) {
    const fr = state.scores.fuchs;
    if (!fr || !fr.kaetschen) return 0;
    // Fuchs gets 1 pt per won Kätsche; Hunters each get 1 pt per won Kätsche
    if (pid === fr.fuchsId) {
      return fr.kaetschen.filter(k => k.winner === 'fox').length;
    } else {
      // This player is a hunter
      const hunters = state.players.filter(p => p.id !== fr.fuchsId);
      if (!hunters.find(h => h.id === pid)) return 0;
      return fr.kaetschen.filter(k => k.winner === 'hunters').length;
    }
  }
  function pts_einsacken(pid) {
    const es = state.scores.einsacken;
    let g = null;
    if ((es.g1 || []).includes(pid)) g = 'g1';
    else if ((es.g2 || []).includes(pid)) g = 'g2';
    if (!g) return 0;
    return (es.rounds || []).reduce((sum, rd) => {
      const members = es[g] || [];
      let best = -1;
      members.forEach(p => { const sc = (rd[g] && rd[g][p]) || 0; if (sc > best) best = sc; });
      return sum + (((rd[g] && rd[g][pid]) || 0) === best && best > 0 ? 1 : 0);
    }, 0);
  }

  function allPoints(pid) {
    return pts_hausnummer(pid) + pts_sv(pid) + pts_rennen(pid) +
           pts_idiot(pid) + pts_mensch(pid) + pts_fuchs(pid) + pts_einsacken(pid);
  }

  // ---- Overall ranking ----
  const overallEntries = state.players.map(p => ({ id: p.id, name: p.name, total: allPoints(p.id) }));
  const overallRanked  = rank(overallEntries);

  // ---- Per-game winners (return raw name string, not escaped) ----
  function gameWinner(scoreFn, higherBetter = true) {
    const entries = state.players.map(p => ({ id: p.id, name: p.name, total: scoreFn(p.id) }));
    const ranked  = rank(entries, higherBetter);
    const winners = ranked.filter(r => r.rank === 1);
    if (!winners.length || winners[0].total === 0) return null;
    return {
      names: winners.map(w => esc(w.name)).join(' &amp; '),
      score: winners[0].total
    };
  }

  const gameWinners = [
    { title: '🏠 Große Hausnummer',  w: gameWinner(pid => grossHN(pid), true) },
    { title: '🏠 Kleine Hausnummer', w: gameWinner(pid => kleinHN(pid), false) },
    { title: '🃏 17 und 4',          w: gameWinner(pid => { const sv = state.scores.sv[pid] || { throws: [], karte: 0 }; const t = s(sv.throws) + (sv.karte || 0); return t > 21 ? -1 : t; }) },
    { title: '🚀 6-Tage-Rennen',     w: gameWinner(pts_rennen) },
    { title: '🐷 Schwein. (höchst)', w: gameWinner(pid => { const sw = state.scores.schwein[pid] || { vals: [] }; return sw.vals.reduce((a, x, i) => a + (x || 0) * wts[i], 0); }) },
    { title: '🤪 Idiotenkegeln',     w: gameWinner(pts_idiot) },
    { title: '🎲 Mensch ä.d.n.',     w: gameWinner(pts_mensch) },
    { title: '🦊 Fuchs',            w: gameWinner(pts_fuchs) },
    { title: '💰 Einsacken',        w: gameWinner(pts_einsacken) },
  ];

  // ---- Podium top3 (sorted desc already by rank()) ----
  const sorted3 = overallRanked.slice(0, 3);
  while (sorted3.length < 3) sorted3.push(null);
  // Podium layout: 2nd left, 1st center, 3rd right
  const podiumOrder = [sorted3[1], sorted3[0], sorted3[2]];
  const podiumCls   = ['p2', 'p1', 'p3'];
  const podiumTroph = ['🥈', '🥇', '🥉'];

  function podiumCard(entry, cls, trophy) {
    if (!entry) {
      return `<div class="podium-place ${cls}">
        <div class="podium-block" style="opacity:.3">–</div>
      </div>`;
    }
    return `
      <div class="podium-place ${cls}">
        <div class="podium-trophy">${trophy}</div>
        <div class="podium-name">${esc(entry.name)}</div>
        <div class="podium-score">${entry.total} Pkt</div>
        <div class="podium-block">${entry.rank}.</div>
      </div>`;
  }

  // ---- Breakdown table columns ----
  const breakCols = ['Haus','17u4','Rennen','Idiot','Mensch','Fuchs','Eins.'];
  const breakFns  = [pts_hausnummer, pts_sv, pts_rennen, pts_idiot, pts_mensch, pts_fuchs, pts_einsacken];

  return `
  <div class="page-card">
    <div class="card-header"><h2>🏆 Gesamtauswertung</h2></div>

    <!-- PODIUM -->
    <div class="podium-section">
      ${podiumOrder.map((e,i) => podiumCard(e, podiumCls[i], podiumTroph[i])).join('')}
    </div>

    <!-- GESAMTRANGLISTE -->
    <hr class="sect-divider">
    <h3 style="font-size:.85rem;color:var(--text3);margin-bottom:10px;letter-spacing:1px">GESAMTRANGLISTE</h3>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Platz</th>
            <th>Name</th>
            ${breakCols.map(c => `<th style="font-size:.68rem">${c}</th>`).join('')}
            <th>Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${overallRanked.map(r => `
            <tr style="${r.rank <= 3 ? 'background:rgba(232,160,32,.06)' : ''}">
              <td class="rank-cell" style="font-size:1.05rem">${medal(r.rank)}</td>
              <td class="name-cell">${esc(r.name)}</td>
              ${breakFns.map(fn => `<td style="font-size:.78rem;color:var(--text2)">${fn(r.id)}</td>`).join('')}
              <td class="sum-cell">${r.total}</td>
            </tr>`).join('')}
        </tbody>
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
               <div class="score">${typeof gw.w.score === 'number' ? (Number.isInteger(gw.w.score) ? gw.w.score : gw.w.score.toFixed(2)) : gw.w.score} Pkt</div>`
            : `<div class="winner" style="color:var(--text3)">– Noch keine Daten –</div>`}
        </div>`).join('')}
      <div class="game-result-card">
        <div class="game-name">🌲 Tannenbaum</div>
        <div class="winner">
          G1: ${state.scores.tannenbaum.g1wins || 0} 🌲 &nbsp;|&nbsp; G2: ${state.scores.tannenbaum.g2wins || 0} 🌲
        </div>
        <div class="score">
          ${(state.scores.tannenbaum.g1wins || 0) > (state.scores.tannenbaum.g2wins || 0) ? '🥇 Gruppe 1 gewinnt!'
          : (state.scores.tannenbaum.g2wins || 0) > (state.scores.tannenbaum.g1wins || 0) ? '🥇 Gruppe 2 gewinnt!'
          : 'Unentschieden'}
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
