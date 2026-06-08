'use strict';
/* ================================================================
   kegelbuch.js — Kegel-Spiele Manager
   Kegelbuch: Render + Startgeld + Zahlen-Berechnung
   ================================================================ */

// Wird von handleScore (main.js) nach einer Kegelbuch-Eingabe aufgerufen
function updateKbRow(pid) {
  const kb=state.kegelbuch[pid]||{};
  const wts=[0.2,0.4,0.6,0.8,1.0];
  const sw=state.scores.schwein[pid]||{vals:[]};
  const schweinSchuld=sw.vals.reduce((a,x,i)=>a+(x||0)*wts[i],0);
  const zahlen=schweinSchuld+(kb.pudel||0)*0.10;
  setEl(`kb_zahlen_${pid}`,zahlen.toFixed(2)+'€');
}

function toggleStartgeld(pid, checked) {
  if(!state.kegelbuch[pid])state.kegelbuch[pid]={};
  state.kegelbuch[pid].startgeld=checked;
  saveData();
}

function renderKegelbuch() {
  if (!state.players.length) return noPlayers();
  const wts=[0.2,0.4,0.6,0.8,1.0];

  function getPoints(pid) {
    const sv=state.scores.sv[pid]||{throws:[],karte:0};
    const id=state.scores.idiot[pid]||{links:0,beine:0,rechts:0};
    const mn=state.scores.mensch[pid]||{throws:[]};
    const svT=s(sv.throws)+(sv.karte||0);
    const rnT=((state.scores.rennen.days||{})[pid]||[]).reduce((a,v,i)=>a+(v||0)*(i+1),0);
    return grossHN(pid)+(id.links||0)+(id.beine||0)+(id.rechts||0)+s(mn.throws)+svT+rnT;
  }
  function getSchweinSchuld(pid) {
    const sw=state.scores.schwein[pid]||{vals:[]};
    return sw.vals.reduce((a,x,i)=>a+(x||0)*wts[i],0);
  }

  const totalPunkte=state.players.reduce((a,p)=>a+getPoints(p.id),0);
  const totalSchwein=state.players.reduce((a,p)=>a+getSchweinSchuld(p.id),0);
  const fuchsKaetschen=(state.scores.fuchs.kaetschen||[]).length;

  return `
  <div class="page-card">
    <div class="card-header"><h2>📖 Kegelbuch</h2></div>
    <div class="kegelbuch-totals">
      <div class="total-card"><div class="val">${state.players.length}</div><div class="lbl">Spieler</div></div>
      <div class="total-card"><div class="val">${totalPunkte}</div><div class="lbl">Gesamtpunkte</div></div>
      <div class="total-card"><div class="val">${totalSchwein.toFixed(2)}€</div><div class="lbl">Schweinepartie Σ</div></div>
      <div class="total-card"><div class="val">${fuchsKaetschen}</div><div class="lbl">Fuchs-Kätsche</div></div>
    </div>
    <div class="table-wrapper">
      <table class="score-table">
        <thead>
          <tr>
            <th>Name</th><th>Startgeld</th><th>🟣 Pudel</th><th>⭐ Stina</th>
            <th>🐷 Schwein €</th><th>Zu zahlen</th><th>Punkte</th>
          </tr>
        </thead>
        <tbody>
          ${state.players.map(p=>{
            const kb=state.kegelbuch[p.id]||{startgeld:false,pudel:0,stina:0};
            const sw=getSchweinSchuld(p.id), zahlen=sw+(kb.pudel||0)*0.10;
            return`<tr>
              <td class="name-cell">${esc(p.name)}</td>
              <td style="text-align:center">
                <input type="checkbox" ${kb.startgeld?'checked':''} onchange="toggleStartgeld('${p.id}',this.checked)">
              </td>
              <td><input class="score-input" type="number" min="0" max="99" value="${kb.pudel||0}"
                data-score data-game="kb" data-pid="${p.id}" data-field="pudel" data-idx="0"></td>
              <td><input class="score-input" type="number" min="0" max="99" value="${kb.stina||0}"
                data-score data-game="kb" data-pid="${p.id}" data-field="stina" data-idx="0"></td>
              <td class="sum-cell">${sw.toFixed(2)}€</td>
              <td id="kb_zahlen_${p.id}" style="color:var(--danger);font-weight:700">${zahlen.toFixed(2)}€</td>
              <td class="sum-cell">${getPoints(p.id)}</td>
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
            <td style="font-weight:700;color:var(--danger)">${state.players.reduce((a,p)=>{const kb=state.kegelbuch[p.id]||{};return a+getSchweinSchuld(p.id)+(kb.pudel||0)*0.10;},0).toFixed(2)}€</td>
            <td style="font-weight:700;color:var(--accent)">${totalPunkte}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="game-rules" style="margin-top:12px">
      🟣 <strong>Pudel</strong> = 0 Kegel → 0,10€ Strafe &nbsp;|&nbsp;
      ⭐ <strong>Stina</strong> = Alle 9 Kegel &nbsp;|&nbsp;
      <strong>Zu zahlen</strong> = Schwein + Pudel-Strafen
    </div>
  </div>`;
}