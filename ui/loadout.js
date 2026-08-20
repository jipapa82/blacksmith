/* ===================== 편성 UI ===================== */
const mercList=document.getElementById('mercList');
function renderLoadout(){
  mercList.innerHTML='';
  loadout.forEach((k,i)=>{
    const e=EQUIP[k], front=i===0;
    const bad=front&&(e.trait==='shoot'||e.trait==='blast'||e.trait==='assassin');
    const bad2=!front&&e.trait==='wall';
    const d=document.createElement('div'); d.className='merc-row';
    d.innerHTML=`<div class="merc-top">
        <span class="rowtag ${front?'front':'back'}">${front?'앞줄':'뒷줄'}</span>
        <span>용병 ${String.fromCharCode(65+i)}</span></div>
      <select data-slot="${i}">${Object.entries(EQUIP).map(([kk,v])=>
        `<option value="${kk}" ${kk===k?'selected':''}>${v.name}</option>`).join('')}</select>
      <div class="derived"><span>공 <b>${e.atk}</b></span><span>방 <b>${e.def}</b></span>
        <span>체 <b>${e.hp}</b></span><span>속 <b>${e.spd.toFixed(2)}</b></span></div>
      <div class="trait-note">${e.desc}</div>
      ${bad?`<div class="warn-note">${e.trait==='assassin'?'앞줄에 서면 지킬 후미가 없다':'앞줄에 세우면 둘러싸인다'}</div>`:''}
      ${bad2?'<div class="warn-note">뒷줄에서는 막을 것이 없다</div>':''}`;
    mercList.appendChild(d);
  });
  mercList.querySelectorAll('select').forEach(s=>s.onchange=ev=>{
    const slot=+ev.target.dataset.slot,pick=ev.target.value,o=1-slot;
    if(loadout[o]===pick) loadout[o]=loadout[slot];
    loadout[slot]=pick; renderLoadout(); reset();
  });
}
document.getElementById('swapBtn').onclick=()=>{loadout.reverse();renderLoadout();reset();};
