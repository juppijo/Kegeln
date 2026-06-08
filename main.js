'use strict';
/* ================================================================
   main.js — Kegel-Spiele Manager
   State · Persistenz · Navigation · Hilfsfunktionen · Modal · Toast
   ================================================================ */

const MAX_PLAYERS = 20;
const THEMES = ['classic','neon','light','retro'];
let themeIdx = 0;
const BAUM_STRUKTUR = {1:1,2:2,3:3,4:4,5:5,6:4,7:3,8:2,9:1};

function defaultState() {
  return {
    session: { name:'Kegel-Abend', date:'' },
    players: [],
    theme: 'classic',
    scores: {
      hausnummer: {},
      sv:         {},
      fuchs:      { fuchsId:null, rounds:[] },
      rennen:     { teams:[], days:{} },
      einsacken:  { g1:[], g2:[], rounds:[] },
      schwein:    {},
      tannenbaum: {
        g1:[], g2:[], g1wins:0, g2wins:0,
        treeCounts: {
          g1:{1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0},
          g2:{1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0}
        },
        throwHistory:[], g1winCounted:false, g2winCounted:false, throws:{}
      },
      idiot:  {},
      mensch: {},
      bus:    { assignments:{}, scores:{} }
    },
    kegelbuch: {}
  };
}

let state = defaultState();

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => { loadData(); showPage('spieler'); });

// ── Persistenz ────────────────────────────────────────────────────
function saveData() {
  state.session.date = new Date().toLocaleDateString('de-DE');
  localStorage.setItem('kegelspiele_v2', JSON.stringify(state));
  const el = document.getElementById('saveStatus');
  if (el) { el.textContent = '✔ Gespeichert ' + new Date().toLocaleTimeString('de-DE'); el.className = 'save-status saved'; }
  showToast('💾 Gespeichert!', 'success');
}

function loadData() {
  const raw = localStorage.getItem('kegelspiele_v2');
  if (!raw) { updateFooter(); return; }
  try {
    const parsed = JSON.parse(raw);
    state = deepMerge(defaultState(), parsed);
    migrateRennen();
    migrateHausnummer();
    migrateDuplicateIds();
    migrateTannenbaum();          // definiert in spiele.js
    themeIdx = Math.max(0, THEMES.indexOf(state.theme));
    applyTheme(state.theme);
    const nameEl = document.getElementById('sessionNameDisplay');
    if (nameEl) nameEl.textContent = state.session.name + ' ✏️';
  } catch(e) { console.warn('Load error', e); }
  updateFooter();
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return source !== undefined ? source : target;
  const result = Array.isArray(target) ? [...target] : Object.assign({}, target);
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else { result[key] = source[key]; }
  }
  return result;
}

function migrateRennen() {
  const rn = state.scores.rennen;
  if (rn.days && Array.isArray(rn.teams)) return;
  const newDays = {};
  for (const key in rn) {
    if (key!=='teams'&&key!=='days'&&rn[key]&&Array.isArray(rn[key].days)) newDays[key]=rn[key].days;
  }
  state.scores.rennen = { teams: rn.teams||[], days: newDays };
}

function migrateHausnummer() {
  for (const pid in state.scores.hausnummer) {
    const hn = state.scores.hausnummer[pid];
    ['gross','klein'].forEach(f => {
      if (Array.isArray(hn[f])) hn[f] = { H:hn[f][0]||0, Z:hn[f][1]||0, E:hn[f][2]||0 };
    });
  }
}

function migrateDuplicateIds() {
  const seen = new Set(); let fixed = false;
  state.players.forEach(p => {
    if (seen.has(p.id)) {
      const newId=genId(), oldId=p.id; p.id=newId;
      ['hausnummer','sv','schwein','idiot','mensch'].forEach(g => {
        if (state.scores[g]?.[oldId]) state.scores[g][newId]=JSON.parse(JSON.stringify(state.scores[g][oldId]));
      });
      if (state.scores.rennen.days?.[oldId]) state.scores.rennen.days[newId]=[...state.scores.rennen.days[oldId]];
      if (state.kegelbuch[oldId]) state.kegelbuch[newId]=JSON.parse(JSON.stringify(state.kegelbuch[oldId]));
      fixed = true;
    } else { seen.add(p.id); }
  });
  if (fixed) console.info('migrateDuplicateIds: Doppelte IDs repariert.');
}

function exportData() {
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download='kegelspiele_'+(state.session.date||'export').replace(/\./g,'-')+'.json';
  a.click(); URL.revokeObjectURL(url);
}
function importData() { document.getElementById('importFile').click(); }
function handleImport(e) {
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try {
      state=deepMerge(defaultState(),JSON.parse(ev.target.result));
      migrateTannenbaum(); applyTheme(state.theme); saveData();
      showPage(document.querySelector('.nav-btn.active')?.dataset.page||'spieler');
      showToast('✅ Import erfolgreich!','success');
    } catch { showToast('❌ Import fehlgeschlagen!','error'); }
  };
  reader.readAsText(file); e.target.value='';
}
function resetAll() {
  showConfirm('🗑️ Alle Daten löschen?','Diese Aktion kann nicht rückgängig gemacht werden!',()=>{
    localStorage.removeItem('kegelspiele_v2'); state=defaultState();
    showPage('spieler'); updateFooter(); showToast('Alle Daten gelöscht.','error');
  });
}

// ── Navigation ────────────────────────────────────────────────────
let currentPage = 'spieler';
function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const renderers = {
    spieler:renderSpieler, hausnummer:renderHausnummer, sv:renderSv, fuchs:renderFuchs,
    rennen:renderRennen, einsacken:renderEinsacken, schwein:renderSchwein,
    tannenbaum:renderTannenbaum, idiot:renderIdiot, mensch:renderMensch, bus:renderBus,
    kegelbuch:renderKegelbuch, auswertung:renderAuswertung
  };
  const main=document.getElementById('mainContent');
  main.innerHTML=renderers[page]?renderers[page]():'<div class="no-players-msg">Seite nicht gefunden</div>';
  attachInputListeners();
}

// ── Theme / Vollbild / Session ────────────────────────────────────
function cycleTheme() { themeIdx=(themeIdx+1)%THEMES.length; state.theme=THEMES[themeIdx]; applyTheme(state.theme); }
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme',t);
  const icons={classic:'🎳',neon:'💡',light:'☀️',retro:'🕹️'};
  const btn=document.getElementById('themeBtn'); if(btn)btn.textContent=icons[t]||'🎨';
}
function toggleFullscreen() {
  const btn=document.getElementById('fullscreenBtn');
  if(!document.fullscreenElement){document.documentElement.requestFullscreen();if(btn)btn.textContent='⊡';}
  else{document.exitFullscreen();if(btn)btn.textContent='⛶';}
}
function editSessionName() {
  showInputModal('Sitzungsname ändern',state.session.name,val=>{
    state.session.name=val;
    const el=document.getElementById('sessionNameDisplay'); if(el)el.textContent=val+' ✏️';
    saveData();
  });
}

// ── Hilfsfunktionen ───────────────────────────────────────────────
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function s(arr){return arr.reduce((a,b)=>a+(parseFloat(b)||0),0);}
function pname(id){const p=state.players.find(x=>x.id===id);return p?esc(p.name):'?';}
function grossHN(pid){const g=(state.scores.hausnummer[pid]||{}).gross||{H:0,Z:0,E:0};return(g.H||0)*100+(g.Z||0)*10+(g.E||0);}
function kleinHN(pid){const k=(state.scores.hausnummer[pid]||{}).klein||{H:0,Z:0,E:0};return(k.H||0)*100+(k.Z||0)*10+(k.E||0);}

function rank(entries,higherBetter=true){
  const sorted=[...entries].sort((a,b)=>higherBetter?b.total-a.total:a.total-b.total);
  let r=1;
  return sorted.map((e,i)=>{if(i>0&&e.total!==sorted[i-1].total)r=i+1;return{...e,rank:r};});
}
function medal(r){return r===1?'🥇':r===2?'🥈':r===3?'🥉':r+'.';}
function noPlayers(){return`<div class="no-players-msg">Noch keine Spieler. <a onclick="showPage('spieler')">Spieler hinzufügen</a></div>`;}

function rulesHtml(id) {
  const rules={
    hausnummer:`<strong>🏠 Große &amp; Kleine Hausnummer:</strong><br>3 Würfe in die Vollen. Ziffern auf H / Z / E verteilen.<br>
      <strong>Große HN:</strong> höchste Zahl gewinnt. Pudel (0) zählt als 0.<br>
      <strong>Kleine HN:</strong> niedrigste Zahl gewinnt. 0 ist kein Pudel!`,
    sv:`<strong>🃏 17 und 4:</strong> Bis zu 7 Würfe, Ziel: genau <strong>21</strong> ohne Überschreiten. Karte = Bonuspunkt.`,
    fuchs:`<strong>🦊 Fuchsjagd:</strong> Fuchs will 31 Punkte, Jäger versuchen ihn zu fangen.<br>
      Ablauf: Fox L → Fox R → Jäger 1 → Fox → Jäger 2 → …<br>
      Jäger fangen, wenn kumulierte Summe ≥ Fox-Gesamt.`,
    rennen:`<strong>🚀 6-Tage-Rennen:</strong> Zweier-Teams. Tag 1×1 … Tag 6×6. Höchste Gesamtpunktzahl gewinnt.`,
    einsacken:`<strong>💰 Einsacken:</strong> Pro Runde gewinnt der Spieler mit den meisten Punkten in seiner Gruppe einen Punkt.`,
    schwein:`<strong>🐷 Schweinepartie:</strong> 5 Kegel à 0,20–1,00€. Wer am wenigsten trifft (Schwein), zahlt die Gesamtsumme aller.`,
    tannenbaum:`<strong>🌲 Tannenbaum:</strong> Zahlen 1–9 auf dem Baum streichen (Raute/Pyramide).<br>
      ↔️ <strong>Kreuz-Regel:</strong> Ist deine Zahl schon voll → geht der Wurf auf den Gegner-Baum!<br>
      Pumpe (0) = nichts. Wer zuerst alle Zahlen voll hat, gewinnt das Spiel.`,
    idiot:`<strong>🤪 Idiotenkegeln:</strong> Links · Rückwärts durch die Beine · Rechts. Höchste Summe gewinnt.`,
    mensch:`<strong>🎲 Mensch-ärger-dich-nicht:</strong> 10 Würfe, höchste Summe gewinnt.`,
    bus:`<strong>🚌 Busfahren:</strong> Spieler einem Bus zuordnen, Punkte (Räder) vergeben. Bus mit den meisten Rädern gewinnt.`
  };
  return`<div class="game-rules">${rules[id]||'– Regeln nicht verfügbar –'}</div>`;
}

// ── Input-Handler ─────────────────────────────────────────────────
function attachInputListeners() {
  document.querySelectorAll('[data-score]').forEach(inp=>{
    inp.addEventListener('change',()=>handleScore(inp));
    inp.addEventListener('focus',()=>inp.select());
    inp.addEventListener('keydown',e=>{
      if(e.key==='Enter'||(e.key==='Tab'&&!e.shiftKey)){
        e.preventDefault();
        const all=[...document.querySelectorAll('[data-score]')],i=all.indexOf(inp);
        if(i<all.length-1)all[i+1].focus();
      }
    });
  });
}

function handleScore(inp) {
  const {game,pid,field,idx}=inp.dataset, v=parseFloat(inp.value)||0, sc=state.scores;
  if (game==='hausnummer') {
    if(!sc.hausnummer[pid])sc.hausnummer[pid]={gross:{H:0,Z:0,E:0},klein:{H:0,Z:0,E:0}};
    if(!sc.hausnummer[pid][field])sc.hausnummer[pid][field]={H:0,Z:0,E:0};
    sc.hausnummer[pid][field][idx]=v;
    setEl(`hn_${field}_num_${pid}`,field==='gross'?grossHN(pid):kleinHN(pid));
    refreshRanks('hausnummer');
  } else if (game==='sv') {
    if(!sc.sv[pid])sc.sv[pid]={throws:[0,0,0,0,0,0,0],karte:0};
    if(field==='throw')sc.sv[pid].throws[+idx]=v; else sc.sv[pid].karte=v;
    const sv=sc.sv[pid],erg=s(sv.throws),ges=erg+(sv.karte||0);
    setEl(`sv_ergebnis_${pid}`,erg);
    const gEl=document.getElementById(`sv_gesamt_${pid}`);
    if(gEl){gEl.textContent=ges;gEl.className='total-cell'+(ges>21?' over-limit':ges===21?' exact-hit':'');}
    refreshRanks('sv');
  } else if (game==='rennen') {
    if(!sc.rennen.days)sc.rennen.days={};
    if(!sc.rennen.days[pid])sc.rennen.days[pid]=Array(6).fill(0);
    sc.rennen.days[pid][+idx]=v; updateRennenTeamCells(pid); refreshRanks('rennen');
  } else if (game==='schwein') {
    if(!sc.schwein[pid])sc.schwein[pid]={vals:[0,0,0,0,0]};
    sc.schwein[pid].vals[+idx]=v;
    const wts=[0.2,0.4,0.6,0.8,1.0],erg=sc.schwein[pid].vals.reduce((a,x,i)=>a+(x||0)*wts[i],0);
    setEl(`sw_erg_${pid}`,erg.toFixed(2)+'€'); refreshRanks('schwein');
  } else if (game==='idiot') {
    if(!sc.idiot[pid])sc.idiot[pid]={links:0,beine:0,rechts:0};
    sc.idiot[pid][field]=v;
    const id=sc.idiot[pid]; setEl(`idiot_total_${pid}`,(id.links||0)+(id.beine||0)+(id.rechts||0)); refreshRanks('idiot');
  } else if (game==='mensch') {
    if(!sc.mensch[pid])sc.mensch[pid]={throws:Array(10).fill(0)};
    sc.mensch[pid].throws[+idx]=v; setEl(`mensch_total_${pid}`,s(sc.mensch[pid].throws)); refreshRanks('mensch');
  } else if (game==='kb') {
    if(!state.kegelbuch[pid])state.kegelbuch[pid]={startgeld:false,pudel:0,stina:0};
    state.kegelbuch[pid][field]=v; updateKbRow(pid);   // updateKbRow ist in kegelbuch.js
  } else if (game==='bus') {
    state.scores.bus.scores[pid]=v;
  }
  saveData();
}

function setEl(id,val){const el=document.getElementById(id);if(el)el.textContent=val;}

function refreshRanks(game) {
  const players=state.players; if(!players.length)return;
  if (game==='hausnummer') {
    rank(players.map(p=>({id:p.id,total:grossHN(p.id)})),true).forEach(r=>setEl(`hn_gross_rank_${r.id}`,medal(r.rank)));
    rank(players.map(p=>({id:p.id,total:kleinHN(p.id)})),false).forEach(r=>setEl(`hn_klein_rank_${r.id}`,medal(r.rank)));
  } else if (game==='sv') {
    rank(players.map(p=>{const sv=state.scores.sv[p.id]||{throws:[],karte:0};const t=s(sv.throws)+(sv.karte||0);return{id:p.id,total:t>21?-1:t};}))
      .forEach(r=>setEl(`sv_rank_${r.id}`,medal(r.rank)));
  } else if (game==='rennen') {
    const rn=state.scores.rennen; if(!rn.teams?.length)return;
    rank(rn.teams.map(t=>({id:t.id,total:rennenTeamTotal(t)}))).forEach(r=>setEl(`rn_team_rank_${r.id}`,medal(r.rank)));
  } else if (game==='schwein') {
    const wts=[0.2,0.4,0.6,0.8,1.0];
    rank(players.map(p=>{const vals=(state.scores.schwein[p.id]||{vals:[]}).vals||[];return{id:p.id,total:vals.reduce((a,x,i)=>a+(x||0)*wts[i],0)};}),false)
      .forEach(r=>setEl(`sw_rank_${r.id}`,medal(r.rank)));
  } else if (game==='idiot') {
    rank(players.map(p=>{const id=state.scores.idiot[p.id]||{};return{id:p.id,total:(id.links||0)+(id.beine||0)+(id.rechts||0)};}))
      .forEach(r=>setEl(`idiot_rank_${r.id}`,medal(r.rank)));
  } else if (game==='mensch') {
    rank(players.map(p=>({id:p.id,total:s((state.scores.mensch[p.id]||{throws:[]}).throws)})))
      .forEach(r=>setEl(`mensch_rank_${r.id}`,medal(r.rank)));
  }
}

function rennenTeamTotal(t) {
  const days=state.scores.rennen.days||{};
  return [0,1,2,3,4,5].reduce((sum,i)=>sum+(((days[t.p1]||[])[i]||0)+((days[t.p2]||[])[i]||0))*(i+1),0);
}

function updateRennenTeamCells(pid) {
  const rn=state.scores.rennen, rawDays=(rn.days&&rn.days[pid])||Array(6).fill(0);
  setEl(`rn_ptotal_${pid}`,rawDays.reduce((a,v)=>a+(v||0),0));
  const t=(rn.teams||[]).find(t=>t.p1===pid||t.p2===pid); if(!t)return;
  const days=rn.days||{}; let cum=0;
  for(let i=0;i<6;i++){
    const combined=(((days[t.p1]||[])[i]||0)+((days[t.p2]||[])[i]||0))*(i+1);
    cum+=combined; setEl(`rn_teamday_${t.id}_${i}`,combined);
  }
  setEl(`rn_teamtotal_${t.id}`,cum);
}

// ── Modal ─────────────────────────────────────────────────────────
function showInputModal(title,defaultVal,callback){
  document.getElementById('modalBox').innerHTML=`
    <div class="modal-title">${esc(title)}</div>
    <input class="modal-input" id="modalInput" type="text" value="${esc(defaultVal)}" maxlength="50">
    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-modal-ok" onclick="submitInputModal()">OK</button>
    </div>`;
  document._modalCb=callback;
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(()=>{const i=document.getElementById('modalInput');if(i){i.focus();i.select();}},50);
  const inp=document.getElementById('modalInput');
  if(inp)inp.addEventListener('keydown',e=>{if(e.key==='Enter')submitInputModal();if(e.key==='Escape')closeModal();});
}
function submitInputModal(){const val=document.getElementById('modalInput')?.value||'',cb=document._modalCb;closeModal();if(cb)cb(val);}
function showConfirm(title,msg,callback){
  document.getElementById('modalBox').innerHTML=`
    <div class="modal-title">${esc(title)}</div>
    <div class="modal-sub">${esc(msg)}</div>
    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal()">Abbrechen</button>
      <button class="btn-modal-confirm-delete" onclick="confirmAction()">Bestätigen</button>
    </div>`;
  document._modalCb=callback;
  document.getElementById('modal').classList.remove('hidden');
}
function confirmAction(){const cb=document._modalCb;closeModal();if(cb)cb();}
function closeModal(){document.getElementById('modal').classList.add('hidden');document._modalCb=null;}

// ── Toast ─────────────────────────────────────────────────────────
let _toastTimer=null;
function showToast(msg,type=''){
  const t=document.getElementById('toast'); if(!t)return;
  t.textContent=msg; t.className='toast show'+(type?' '+type:'');
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>{t.classList.remove('show');setTimeout(()=>{t.className='toast hidden';},300);},2200);
}

// ── Regeln-Toggle ─────────────────────────────────────────────────
function toggleRules(id){const el=document.getElementById('rules_'+id);if(!el)return;el.style.display=el.style.display==='none'?'block':'none';}