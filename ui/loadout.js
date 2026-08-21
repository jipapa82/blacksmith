/* ===================== 편성 UI ===================== */

/* 무기 문양 아이콘 (SVG) — 캔버스의 도형 언어(DESIGN 7.3)와 같은 모양.
   카드·정비·부대 어디서든 이걸로 무기를 한눈에 알아본다. */
function weaponIcon(key){
  const e=EQUIP[key]; if(!e)return '';
  const shapes={
    sword:'<polygon points="9,1 12.5,17 5.5,17"/>',                  // 좁은 삼각 — 단검
    great:'<polygon points="9,2 17,17 1,17"/>',                      // 넓은 삼각 — 대검
    shield:'<rect x="2.5" y="2.5" width="13" height="13"/>',         // 사각 — 방패
    bow:'<polygon points="9,1 17,9 9,17 1,9"/>',                     // 마름모 — 원거리
    wand:'<polygon points="17,9 13,15.9 5,15.9 1,9 5,2.1 13,2.1"/>', // 육각 — 마법
  };
  return `<span class="wicon"><svg viewBox="0 0 18 18" fill="${e.color}" stroke="rgba(255,255,255,.35)" stroke-width="1">${shapes[key]||''}</svg></span>`;
}

/* 무기가 고를 수 있는 원소 표시 (DESIGN 4.1.1 무기별 원소 제한) */
/* 원소 정식 명칭 — 화염·독·냉기·진동. 상태이상은 화상·중독·한기·빙결·공명·휘청 (DESIGN 4.1.1 용어 사전) */
const ELEM_INFO={fire:['화염','#E8963C'],pois:['독','#8FBF6A'],cold:['냉기','#9AD9E8'],shock:['진동','#9B8ACB']};
function elemChoices(key){
  return EQUIP[key].elems.map(e=>
    `<span style="color:${ELEM_INFO[e][1]}">● ${ELEM_INFO[e][0]}</span>`).join(' ');
}

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
      <div class="derived">원소 ${elemChoices(k)}</div>
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
